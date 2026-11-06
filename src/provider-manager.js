// ===== src/provider-manager.js =====
    const ProviderManager = (() => {
        const KEY_PROVIDERS = 'pe_providers';
        const KEY_ACTIVE = 'pe_active_provider';
        const KEY_FALLBACK = 'pe_fallback_provider';
        const KEY_MIGRATED = 'pe_providers_migrated';
        const KEY_KILO_GATEWAY_MIGRATED = 'pe_kilo_gateway_migrated';
        const LEGACY_DEFAULT_URL = 'https://api.kilo.ai/api/openrouter/chat/completions';
        const LEGACY_DEFAULT_MODEL = 'kilo-auto/free';

        const DEFAULT_TEMPLATE = {
            id: 'kilo',
            name: 'Kilo (padrão)',
            url: DEFAULT_PROVIDER.url,
            model: DEFAULT_PROVIDER.model,
            apiKey: 'anonymous',
            headers: { ...(DEFAULT_PROVIDER.headers || {}) },
            builtin: true,
            fallback: false
        };

        const PRESETS = [
            { id: 'kilo', label: 'Kilo (padrão)', template: {
                name: 'Kilo',
                url: DEFAULT_PROVIDER.url,
                model: DEFAULT_PROVIDER.model,
                apiKey: 'anonymous',
                headers: { ...(DEFAULT_PROVIDER.headers || {}) }
            } },
            { id: 'openrouter', label: 'OpenRouter', template: {
                name: 'OpenRouter',
                url: 'https://openrouter.ai/api/v1/chat/completions',
                model: 'openai/gpt-4o-mini',
                apiKey: '',
                headers: {
                    'HTTP-Referer': 'https://github.com/EdgeTypE/better-deepseek',
                    'X-Title': 'Prompt-Enhancer'
                }
            } },
            { id: 'openai', label: 'OpenAI', template: {
                name: 'OpenAI',
                url: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-4o-mini',
                apiKey: '',
                headers: {}
            } },
            { id: 'groq', label: 'Groq', template: {
                name: 'Groq',
                url: 'https://api.groq.com/openai/v1/chat/completions',
                model: 'llama-3.3-70b-versatile',
                apiKey: '',
                headers: {}
            } },
            { id: 'ollama', label: 'Ollama (local)', template: {
                name: 'Ollama',
                url: 'http://localhost:11434/v1/chat/completions',
                model: 'llama3.2',
                apiKey: '',
                headers: {}
            } },
            { id: 'custom', label: 'Personalizado', template: {
                name: 'Meu provider',
                url: '',
                model: '',
                apiKey: '',
                headers: {}
            } }
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
                            name: 'Meu provider (legado)',
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

        function add(input = {}) {
            migrate();
            const list = _load() || [];
            const entry = {
                id: Utils.uid('prov'),
                name: String(input.name || 'Novo provider').trim().slice(0, 60),
                url: String(input.url || '').trim(),
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

        function update(id, patch = {}) {
            const list = _load() || [];
            const idx = list.findIndex(p => p.id === id);
            if (idx === -1) return null;
            const cur = list[idx];
            const next = {
                ...cur,
                name: patch.name !== undefined ? String(patch.name).trim().slice(0, 60) : cur.name,
                url: patch.url !== undefined ? String(patch.url).trim() : cur.url,
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

        function resolveForRequest() {
            const primary = getActive() || { ...DEFAULT_TEMPLATE };
            const fallback = getFallback();
            const sequence = [primary].concat((fallback && fallback.id !== primary.id) ? [fallback] : []);
            return {
                primary: {
                    id: primary.id || 'default',
                    name: primary.name || 'Kilo',
                    url: String(primary.url || '').trim() || DEFAULT_PROVIDER.url,
                    model: String(primary.model || '').trim() || DEFAULT_PROVIDER.model,
                    apiKey: String(primary.apiKey || '').trim() || 'anonymous',
                    headers: { ...(DEFAULT_PROVIDER.headers || {}), ...(primary.headers || {}) },
                    builtin: !!primary.builtin,
                    fallback: !!primary.fallback
                },
                fallback: fallback && fallback.id !== primary.id ? {
                    id: fallback.id || 'fallback',
                    name: fallback.name || 'Fallback',
                    url: String(fallback.url || '').trim() || DEFAULT_PROVIDER.url,
                    model: String(fallback.model || '').trim() || DEFAULT_PROVIDER.model,
                    apiKey: String(fallback.apiKey || '').trim() || 'anonymous',
                    headers: { ...(DEFAULT_PROVIDER.headers || {}), ...(fallback.headers || {}) },
                    builtin: !!fallback.builtin,
                    fallback: !!fallback.fallback
                } : null,
                all: sequence.map((provider) => ({
                    id: provider.id || 'default',
                    name: provider.name || 'Provider',
                    url: String(provider.url || '').trim() || DEFAULT_PROVIDER.url,
                    model: String(provider.model || '').trim() || DEFAULT_PROVIDER.model,
                    apiKey: String(provider.apiKey || '').trim() || 'anonymous',
                    headers: { ...(DEFAULT_PROVIDER.headers || {}), ...(provider.headers || {}) },
                    builtin: !!provider.builtin,
                    fallback: !!provider.fallback
                }))
            };
        }

        return {
            PRESETS,
            list,
            getActive,
            getFallback,
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
