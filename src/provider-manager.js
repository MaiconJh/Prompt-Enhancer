// ===== src/provider-manager.js =====
    const ProviderManager = (() => {
        const KEY_PROVIDERS = 'pe_providers';
        const KEY_ACTIVE = 'pe_active_provider';
        const KEY_FALLBACK = 'pe_fallback_provider';
        const KEY_PINNED = 'pe_pinned_route';
        const KEY_VIRTUAL_FALLBACK_ENABLED = 'pe_virtual_fallback_enabled';
        const KEY_MIGRATED = 'pe_providers_migrated';
        const KEY_KILO_GATEWAY_MIGRATED = 'pe_kilo_gateway_migrated';
        const LEGACY_DEFAULT_URL = 'https://api.kilo.ai/api/openrouter/chat/completions';
        const LEGACY_DEFAULT_MODEL = 'kilo-auto/free';

        const DEFAULT_TEMPLATE = {
            id: 'default',
            name: 'Kilo',
            url: DEFAULT_PROVIDER.url,
            model: DEFAULT_PROVIDER.model,
            apiKey: 'anonymous',
            headers: { ...(DEFAULT_PROVIDER.headers || {}) },
            builtin: true,
            fallback: false
        };

        const URL_CUSTOM_CONFIRM_MSG = 'Deseja permitir conexão com este endpoint externo?\n\n{url}\n\nSomente confirme se confiar no destino.\n\nO gerenciador de userscripts também pedirá autorização de rede para este host.';
        const BUILTIN_HOSTS = [
            'ai-gateway.kilo.ai',
            'api.groq.com',
            'gen.pollinations.ai',
            'keylessai.thryx.workers.dev',
            'oai.endpoints.kepler.ai.cloud.ovh.net'
        ];

        const safeGet = (key, fallback) => {
            try { return GM_getValue(key, fallback); } catch (_) { return fallback; }
        };

        const safeSet = (key, value) => {
            try { GM_setValue(key, value); return true; } catch (_) { return false; }
        };

        function _load() {
            const raw = safeGet(KEY_PROVIDERS, null);
            if (raw === null || raw === undefined || raw === '') return null;
            try {
                const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (!Array.isArray(arr)) return null;
                return arr.filter(p => p && typeof p.id === 'string' && typeof p.url === 'string' && typeof p.model === 'string')
                    .map(p => ({
                        id: p.id,
                        name: String(p.name || 'Provider'),
                        url: String(p.url),
                        model: String(p.model),
                        apiKey: String(p.apiKey || ''),
                        headers: p.headers && typeof p.headers === 'object' ? p.headers : {},
                        builtin: !!p.builtin,
                        fallback: !!p.fallback,
                        createdAt: Number(p.createdAt) || Date.now()
                    }));
            } catch (_) { return null; }
        }

        function _save(list) {
            safeSet(KEY_PROVIDERS, JSON.stringify(list));
        }

        function migrate() {
            if (!safeGet(KEY_MIGRATED, false)) {
                let list = _load();
                if (list === null || list.length === 0) {
                    const seeded = [{ ...DEFAULT_TEMPLATE, createdAt: Date.now() }];
                    _save(seeded);
                    list = seeded;
                }

                const legacyUrl = String(safeGet('pe_api_url', '') || '').trim();
                const legacyModel = String(safeGet('pe_model', '') || '').trim();
                const legacyKey = String(safeGet('pe_api_key', '') || '').trim();

                const isCustom =
                    (legacyUrl && legacyUrl !== DEFAULT_PROVIDER.url && legacyUrl !== LEGACY_DEFAULT_URL) ||
                    (legacyModel && legacyModel !== DEFAULT_PROVIDER.model && legacyModel !== LEGACY_DEFAULT_MODEL) ||
                    (legacyKey && legacyKey !== 'anonymous');

                if (isCustom) {
                    const current = _load() || [];
                    const exists = current.some(p => !p.builtin && p.url === (legacyUrl || DEFAULT_PROVIDER.url) && p.model === (legacyModel || DEFAULT_PROVIDER.model));
                    if (!exists) {
                        const entry = {
                            id: Utils.uid('prov'),
                            name: typeof I18n !== 'undefined' ? I18n.t('pm.provider.legacy') : 'Meu provider (legado)',
                            url: legacyUrl || DEFAULT_PROVIDER.url,
                            model: legacyModel || DEFAULT_PROVIDER.model,
                            apiKey: legacyKey || 'anonymous',
                            headers: (legacyUrl && !legacyUrl.includes('kilo.ai')) ? {} : { ...(DEFAULT_PROVIDER.headers || {}) },
                            builtin: false,
                            fallback: false,
                            createdAt: Date.now()
                        };
                        current.push(entry);
                        _save(current);
                        safeSet(KEY_ACTIVE, entry.id);
                    }
                }

                try { GM_deleteValue('pe_api_url'); } catch (_) {}
                try { GM_deleteValue('pe_model'); } catch (_) {}
                try { GM_deleteValue('pe_api_key'); } catch (_) {}
                safeSet(KEY_MIGRATED, true);
            }

            if (!safeGet(KEY_KILO_GATEWAY_MIGRATED, false)) {
                const current = _load() || [];
                let changed = false;
                current.forEach(provider => {
                    if (!provider.builtin || provider.id !== 'kilo') return;
                    if (provider.url === LEGACY_DEFAULT_URL) {
                        provider.url = DEFAULT_PROVIDER.url;
                        if (provider.model === LEGACY_DEFAULT_MODEL) provider.model = DEFAULT_PROVIDER.model;
                        changed = true;
                    }
                });
                if (changed) _save(current);
                safeSet(KEY_KILO_GATEWAY_MIGRATED, true);
            }
        }

        function list() {
            migrate();
            if (typeof ProviderRegistry !== 'undefined') {
                const catalog = ProviderRegistry.getCached();
                if (Array.isArray(catalog) && catalog.length) return catalog;
            }
            return _load() || [];
        }

        function getActive() {
            migrate();
            const all = _load() || [];
            if (!all.length) return null;
            const activeId = safeGet(KEY_ACTIVE, '');
            return all.find(p => p.id === activeId) || all[0];
        }

        function getFallback() {
            migrate();
            const all = _load() || [];
            if (!all.length) return null;
            const active = getActive();
            const fallbackId = safeGet(KEY_FALLBACK, '');
            const activeId = active ? active.id : '';
            return all.find(p => p.id === fallbackId && p.id !== activeId)
                || all.find(p => p.fallback && p.id !== activeId)
                || null;
        }

        function setActive(id) {
            if (!id) return;
            const all = _load() || [];
            if (!all.some(p => p.id === id)) return;
            if (safeGet(KEY_FALLBACK, '') === id) setFallback('');
            safeSet(KEY_ACTIVE, id);
        }

        function setFallback(id) {
            const all = _load() || [];
            if (!id) {
                safeSet(KEY_FALLBACK, '');
                all.forEach(p => { p.fallback = false; });
                _save(all);
                return;
            }
            if (!all.some(p => p.id === id)) return;
            const activeId = getActive()?.id || '';
            if (id === activeId) {
                all.forEach(p => { p.fallback = false; });
                _save(all);
                safeSet(KEY_FALLBACK, '');
                return;
            }
            all.forEach(p => { p.fallback = p.id === id && p.id !== activeId; });
            _save(all);
            safeSet(KEY_FALLBACK, id);
        }

        function add(input = {}, options = {}) {
            migrate();
            const list = _load() || [];
            const entryUrl = _chatUrl(input.url || '');
            if (!_isValidUrl(entryUrl)) throw new Error(`URL inválida: ${entryUrl}. Use https://`);
            if (!_isCustomUrl(entryUrl) && !options.skipConfirm) {
                // builtin/known URL: no confirmation needed
            } else if (_isCustomUrl(entryUrl) && !options.skipConfirm) {
                if (!_confirmCustomHost(entryUrl)) throw new Error(`Conexão com host customizado negada: ${entryUrl}`);
            }
            const entry = {
                id: Utils.uid('prov'),
                name: String(input.name || 'Provider').trim().slice(0, 60),
                url: entryUrl,
                model: String(input.model || '').trim(),
                apiKey: String(input.apiKey || ''),
                headers: input.headers && typeof input.headers === 'object' ? input.headers : {},
                builtin: false,
                fallback: !!input.fallback,
                createdAt: Date.now()
            };
            list.push(entry);
            _save(list);
            if (entry.fallback) safeSet(KEY_FALLBACK, entry.id);
            return entry;
        }

        function update(id, patch = {}, options = {}) {
            const list = _load() || [];
            const idx = list.findIndex(p => p.id === id);
            if (idx === -1) return null;
            const cur = list[idx];
            const nextUrl = patch.url !== undefined ? _chatUrl(patch.url) : cur.url;
            if (!_isValidUrl(nextUrl)) throw new Error(`URL inválida: ${nextUrl}. Use https://`);
            if (_isCustomUrl(nextUrl) && !options.skipConfirm && !_confirmCustomHost(nextUrl)) {
                throw new Error(`Conexão com host customizado negada: ${nextUrl}`);
            }
            const next = {
                ...cur,
                name: patch.name !== undefined ? String(patch.name).trim().slice(0, 60) : cur.name,
                url: nextUrl,
                model: patch.model !== undefined ? String(patch.model).trim() : cur.model,
                apiKey: patch.apiKey !== undefined ? String(patch.apiKey) : cur.apiKey,
                headers: patch.headers && typeof patch.headers === 'object' ? patch.headers : cur.headers,
                fallback: patch.fallback !== undefined ? !!patch.fallback : !!cur.fallback
            };
            list[idx] = next;
            _save(list);
            if (next.fallback) safeSet(KEY_FALLBACK, next.id);
            else if (safeGet(KEY_FALLBACK, '') === next.id) safeSet(KEY_FALLBACK, '');
            return next;
        }

        function remove(id) {
            const list = _load() || [];
            const target = list.find(p => p.id === id);
            if (!target || target.builtin) return false;
            const filtered = list.filter(p => p.id !== id);
            if (!filtered.length) return false;
            _save(filtered);
            const active = safeGet(KEY_ACTIVE, '');
            if (active === id) {
                const next = filtered[0];
                safeSet(KEY_ACTIVE, next ? next.id : '');
            }
            const fallbackId = safeGet(KEY_FALLBACK, '');
            if (fallbackId === id) safeSet(KEY_FALLBACK, '');
            return true;
        }

        function resetToDefault() {
            const seeded = [{ ...DEFAULT_TEMPLATE, createdAt: Date.now() }];
            _save(seeded);
            safeSet(KEY_ACTIVE, seeded[0].id);
            safeSet(KEY_FALLBACK, '');
            return seeded[0];
        }

        function _chatUrl(baseUrl) {
            const base = String(baseUrl || '').trim().replace(/\/+$/, '');
            return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
        }

        function _isValidUrl(url) {
            const u = String(url || '').trim();
            return /^https:\/\/[^\s/?#]+/.test(u);
        }

        function _isCustomUrl(url) {
            const u = String(url || '').trim();
            if (!u || u === DEFAULT_PROVIDER.url || u === LEGACY_DEFAULT_URL) return false;
            const hostname = u.match(/^https:\/\/([^\s/?#]+)/);
            return !hostname || !BUILTIN_HOSTS.includes(hostname[1]);
        }

        function _confirmCustomHost(url) {
            if (typeof window === 'undefined' || typeof window.confirm !== 'function') return true;
            return window.confirm(URL_CUSTOM_CONFIRM_MSG.replace('{url}', url));
        }

        function pin(entryOrId) {
            const entry = typeof entryOrId === 'string'
                ? (typeof ProviderRegistry !== 'undefined' ? ProviderRegistry.get(entryOrId) : null)
                : entryOrId;
            if (!entry || !entry.id || !entry.baseUrl || !entry.modelId) return false;
            let provider = (_load() || []).find((item) =>
                item.url.replace(/\/+$/, '') === _chatUrl(entry.baseUrl)
                && item.model === entry.modelId);
            if (!provider) {
                provider = add({
                    name: entry.providerLabel,
                    url: _chatUrl(entry.baseUrl),
                    model: entry.modelId,
                    apiKey: entry.auth?.key || (entry.auth?.type === 'none' ? '' : safeGet('pe_api_key', '')),
                    headers: {
                        ...(entry.headers || {}),
                        ...(entry.auth?.headerName ? { [entry.auth.headerName]: CONFIG.EDITOR_NAME } : {})
                    }
                });
            }
            setActive(provider.id);
            if (!safeSet(KEY_PINNED, JSON.stringify({ entryId: entry.id, pinnedAt: Date.now() }))) return false;
            return true;
        }

        function getPinned() {
            try {
                if (typeof ProviderRegistry === 'undefined') return null;
                const raw = safeGet(KEY_PINNED, null);
                if (!raw) return null;
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return parsed && typeof parsed.entryId === 'string' ? ProviderRegistry.get(parsed.entryId) : null;
            } catch (_) {
                return null;
            }
        }

        function unpin() {
            try { GM_deleteValue(KEY_PINNED); } catch (_) {}
        }

        function _entryToProvider(entry) {
            if (!entry) return null;
            return {
                id: entry.id,
                name: entry.providerLabel,
                url: _chatUrl(entry.baseUrl),
                model: entry.modelId,
                apiKey: entry.auth?.key || (entry.auth?.type === 'none' ? '' : 'anonymous'),
                authType: entry.auth?.type || 'bearer',
                headers: {
                    ...(entry.headers || {}),
                    ...(entry.auth?.headerName ? { [entry.auth.headerName]: CONFIG.EDITOR_NAME } : {})
                },
                virtual: !!entry.virtual
            };
        }

        function resolveForRequest() {
            const pinned = getPinned();
            const primary = pinned ? _entryToProvider(pinned) : (getActive() || { ...DEFAULT_TEMPLATE });
            let fallback = getFallback();
            if (pinned && !fallback && safeGet(KEY_VIRTUAL_FALLBACK_ENABLED, false)
                && Array.isArray(CONFIG.VIRTUAL_FALLBACK_MODELS)
                && typeof ProviderRegistry !== 'undefined') {
                for (const modelId of CONFIG.VIRTUAL_FALLBACK_MODELS) {
                    const candidate = ProviderRegistry.list().find((entry) => entry.virtual && entry.modelId === modelId);
                    if (candidate && (candidate.auth.type === 'none' || candidate.auth.key || candidate.providerId !== 'openrouter')) {
                        fallback = _entryToProvider(candidate);
                        break;
                    }
                }
            }
            const sequence = [primary].concat((fallback && fallback.id !== primary.id) ? [fallback] : []);
            return {
                primary: {
                    id: primary.id || 'default',
                    name: primary.name || 'Kilo',
                    url: _chatUrl(primary.url || DEFAULT_PROVIDER.url),
                    model: String(primary.model || '').trim() || DEFAULT_PROVIDER.model,
                    apiKey: primary.authType === 'none' ? '' : (String(primary.apiKey || '').trim() || 'anonymous'),
                    authType: primary.authType || 'bearer',
                    headers: pinned ? { ...(primary.headers || {}) } : { ...(DEFAULT_PROVIDER.headers || {}), ...(primary.headers || {}) },
                    builtin: !!primary.builtin,
                    fallback: !!primary.fallback,
                    virtual: !!primary.virtual
                },
                fallback: fallback && fallback.id !== primary.id ? {
                    id: fallback.id || 'fallback',
                    name: fallback.name || 'Fallback',
                    url: _chatUrl(fallback.url || DEFAULT_PROVIDER.url),
                    model: String(fallback.model || '').trim() || DEFAULT_PROVIDER.model,
                    apiKey: fallback.authType === 'none' ? '' : (String(fallback.apiKey || '').trim() || 'anonymous'),
                    authType: fallback.authType || 'bearer',
                    headers: fallback.virtual ? { ...(fallback.headers || {}) } : { ...(DEFAULT_PROVIDER.headers || {}), ...(fallback.headers || {}) },
                    builtin: !!fallback.builtin,
                    fallback: !!fallback.fallback,
                    virtual: !!fallback.virtual
                } : null,
                all: sequence.map((provider) => ({
                    id: provider.id || 'default',
                    name: provider.name || 'Provider',
                    url: _chatUrl(provider.url || DEFAULT_PROVIDER.url),
                    model: String(provider.model || '').trim() || DEFAULT_PROVIDER.model,
                    apiKey: provider.authType === 'none' ? '' : (String(provider.apiKey || '').trim() || 'anonymous'),
                    authType: provider.authType || 'bearer',
                    headers: provider.virtual ? { ...(provider.headers || {}) } : { ...(DEFAULT_PROVIDER.headers || {}), ...(provider.headers || {}) },
                    builtin: !!provider.builtin,
                    fallback: !!provider.fallback,
                    virtual: !!provider.virtual
                }))
            };
        }

        return {
            list,
            getActive,
            getFallback,
            pin,
            unpin,
            getPinned,
            setActive,
            setFallback,
            add,
            update,
            remove,
            resetToDefault,
            resolveForRequest,
            migrate
        };
    })();
