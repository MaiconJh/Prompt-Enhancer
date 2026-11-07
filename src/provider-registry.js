// ===== src/provider-registry.js =====
    const ProviderRegistry = (() => {
        const KEY_CACHE = 'pe_provider_catalog_cache';
        let _memory = null;
        let _hydrating = null;

        function _normalize(raw, providerId = '', providerLabel = '') {
            if (!raw || typeof raw !== 'object') return null;
            const modelId = String(raw.modelId || '').trim();
            const id = String(raw.id || (providerId && modelId ? `${providerId}:${modelId}` : '')).trim();
            if (!id || !modelId) return null;
            const auth = raw.auth && typeof raw.auth === 'object' ? raw.auth : {};
            const capabilities = raw.capabilities && typeof raw.capabilities === 'object' ? raw.capabilities : {};
            const limits = raw.limits && typeof raw.limits === 'object' ? raw.limits : {};
            const entry = {
                id,
                providerId: String(raw.providerId || providerId || id.split(':', 1)[0]),
                providerLabel: String(raw.providerLabel || providerLabel || raw.providerId || providerId || 'Provider'),
                baseUrl: String(raw.baseUrl || '').trim().replace(/\/+$/, ''),
                modelId,
                label: String(raw.label || modelId),
                auth: {
                    type: ['bearer', 'none', 'custom-header'].includes(auth.type) ? auth.type : 'bearer',
                    key: typeof auth.key === 'string' ? auth.key : '',
                    headerName: typeof auth.headerName === 'string' ? auth.headerName : null
                },
                headers: raw.headers && typeof raw.headers === 'object' && !Array.isArray(raw.headers) ? { ...raw.headers } : {},
                limits: {
                    rpm: Number.isFinite(limits.rpm) ? limits.rpm : null,
                    rpd: Number.isFinite(limits.rpd) ? limits.rpd : null,
                    tpm: Number.isFinite(limits.tpm) ? limits.tpm : null,
                    note: String(limits.note || '')
                },
                capabilities: {
                    streaming: !!capabilities.streaming,
                    tools: !!capabilities.tools,
                    jsonMode: !!capabilities.jsonMode
                },
                contextWindow: Number.isFinite(raw.contextWindow) ? raw.contextWindow : null,
                source: raw.source === 'dynamic' ? 'dynamic' : 'curated',
                virtual: !!raw.virtual
            };
            if (entry.source === 'dynamic') entry.fetchedAt = Number(raw.fetchedAt) || Date.now();
            return entry;
        }

        function _merge(staticList, dynamicList, virtualList) {
            const byId = new Map();
            staticList.forEach((entry) => {
                const normalized = _normalize(entry);
                if (normalized) byId.set(normalized.id, normalized);
            });
            dynamicList.forEach((entry) => {
                const normalized = _normalize({ ...entry, source: 'dynamic' });
                if (normalized) byId.set(normalized.id, normalized);
            });
            virtualList.forEach((entry) => {
                const normalized = _normalize(entry);
                if (normalized) byId.set(normalized.id, normalized);
            });
            return Array.from(byId.values()).sort((a, b) =>
                a.providerLabel.localeCompare(b.providerLabel) || a.label.localeCompare(b.label));
        }

        function _readCache() {
            try {
                const raw = GM_getValue(KEY_CACHE, null);
                const cache = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (!cache || cache.version !== CATALOG_VERSION || !Number.isFinite(cache.fetchedAt) || !Array.isArray(cache.entries)) return null;
                if (Date.now() - cache.fetchedAt > CONFIG.CATALOG_CACHE_TTL_MS) return null;
                const entries = cache.entries.map((entry) => _normalize(entry)).filter(Boolean);
                return entries.length ? entries : null;
            } catch (_) {
                return null;
            }
        }

        function _writeCache(entries) {
            try {
                GM_setValue(KEY_CACHE, JSON.stringify({ version: CATALOG_VERSION, fetchedAt: Date.now(), entries }));
            } catch (err) {
                console.warn('[PE] Não foi possível salvar o cache do catálogo.', err);
            }
        }

        async function _fetchAllDynamic() {
            const adapters = [discoverOpenRouter, discoverKilo, discoverPollinations, discoverKeylessAI];
            const results = await Promise.allSettled(adapters.map((adapter) => adapter()));
            return results.flatMap((result) => result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []);
        }

        async function hydrate(force = false) {
            if (!force) {
                const cached = _readCache();
                if (cached) return (_memory = cached);
            }
            if (_hydrating) return _hydrating;
            _hydrating = (async () => {
                try {
                    const dynamic = await _fetchAllDynamic();
                    const merged = _merge(STATIC_CATALOG, dynamic, VIRTUAL_ROUTERS);
                    _writeCache(merged);
                    _memory = merged;
                    return merged;
                } catch (err) {
                    console.warn('[PE] Falha na hidratação do catálogo.', err);
                    const fallback = _merge(STATIC_CATALOG, [], VIRTUAL_ROUTERS);
                    _memory = fallback;
                    return fallback;
                } finally {
                    _hydrating = null;
                }
            })();
            return _hydrating;
        }

        function getCached() {
            if (_memory) return _memory;
            const cached = _readCache();
            if (cached) return (_memory = cached);
            return _merge(STATIC_CATALOG, [], VIRTUAL_ROUTERS);
        }

        function list({ provider = null, keylessOnly = false, streamingOnly = false, search = '' } = {}) {
            const query = String(search || '').trim().toLowerCase();
            return getCached().filter((entry) => {
                if (provider && entry.providerId !== provider) return false;
                if (keylessOnly && !(entry.auth.type === 'none' || entry.auth.key === 'anonymous')) return false;
                if (streamingOnly && !entry.capabilities.streaming) return false;
                if (query && !`${entry.label} ${entry.modelId} ${entry.providerLabel}`.toLowerCase().includes(query)) return false;
                return true;
            });
        }

        function groupByProvider(entries = list()) {
            const groups = new Map();
            entries.forEach((entry) => {
                if (!groups.has(entry.providerId)) {
                    groups.set(entry.providerId, {
                        providerId: entry.providerId,
                        providerLabel: entry.providerLabel,
                        entries: []
                    });
                }
                groups.get(entry.providerId).entries.push(entry);
            });
            return Array.from(groups.values());
        }

        function get(id) {
            return getCached().find((entry) => entry.id === id) || null;
        }

        return { hydrate, getCached, list, groupByProvider, get };
    })();
