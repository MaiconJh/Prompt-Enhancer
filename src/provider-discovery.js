// ===== src/provider-discovery.js =====
    function catalogRequest(url, provider) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest !== 'function') {
                reject(new Error('GM_xmlhttpRequest indisponível'));
                return;
            }
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                timeout: CONFIG.CATALOG_FETCH_TIMEOUT_MS,
                headers: { Accept: 'application/json' },
                onload: (response) => {
                    if (response.status < 200 || response.status >= 300) {
                        reject(new Error(`HTTP ${response.status}`));
                        return;
                    }
                    try {
                        resolve(JSON.parse(response.responseText || '{}'));
                    } catch (_) {
                        reject(new Error('JSON inválido'));
                    }
                },
                onerror: () => reject(new Error('Falha de rede')),
                ontimeout: () => reject(new Error('Tempo limite excedido')),
                onabort: () => reject(new Error('Requisição cancelada'))
            });
        }).catch((err) => {
            console.warn(`[PE] discovery:${provider}`, err);
            return null;
        });
    }

    function discoveryEntry(providerId, providerLabel, baseUrl, raw, options = {}) {
        const modelId = String(options.modelId || raw?.id || raw?.model || raw?.model_id || raw?.name || '').trim();
        if (!modelId) return null;
        const features = raw?.supported_parameters || raw?.capabilities || [];
        const hasFeature = (name) => Array.isArray(features)
            ? features.includes(name)
            : !!features?.[name];
        const auth = options.auth || { type: 'bearer', key: '', headerName: null };
        return {
            id: `${providerId}:${modelId}`,
            providerId,
            providerLabel,
            baseUrl: options.baseUrl || baseUrl,
            modelId,
            label: String(options.label || raw?.name || modelId),
            auth: { type: auth.type, key: auth.key, headerName: auth.headerName || null },
            headers: { ...(options.headers || {}) },
            limits: {
                rpm: Number.isFinite(raw?.limits?.rpm) ? raw.limits.rpm : null,
                rpd: Number.isFinite(raw?.limits?.rpd) ? raw.limits.rpd : null,
                tpm: Number.isFinite(raw?.limits?.tpm) ? raw.limits.tpm : null,
                note: String(raw?.limits?.note || '')
            },
            capabilities: {
                streaming: options.streaming !== undefined ? !!options.streaming : raw?.streaming !== false,
                tools: options.tools !== undefined ? !!options.tools : hasFeature('tools'),
                jsonMode: options.jsonMode !== undefined ? !!options.jsonMode : hasFeature('json'),
            },
            contextWindow: Number.isFinite(raw?.context_length) ? raw.context_length : (Number.isFinite(raw?.contextWindow) ? raw.contextWindow : null),
            source: 'dynamic',
            virtual: !!options.virtual,
            fetchedAt: Date.now()
        };
    }

    function modelRows(payload) {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.models)) return payload.models;
        if (Array.isArray(payload?.result?.data)) return payload.result.data;
        return [];
    }

    async function discoverOpenRouter() {
        try {
            const payload = await catalogRequest('https://openrouter.ai/api/v1/models', 'openrouter');
            if (!payload) return [];
            return modelRows(payload).filter((model) => {
                const pricing = model?.pricing || {};
                return String(model?.id || '').endsWith(':free')
                    || (String(pricing.prompt) === '0' && String(pricing.completion) === '0');
            }).map((model) => discoveryEntry('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1', model, {
                label: `${model.name || model.id}${String(model.id || '').endsWith(':free') ? '' : ' (free)'}`,
                headers: { 'HTTP-Referer': 'https://github.com/EdgeTypE/better-deepseek', 'X-Title': 'Prompt-Enhancer' },
                tools: (model?.supported_parameters || []).includes?.('tools') || false
            })).filter(Boolean);
        } catch (err) {
            console.warn('[PE] discovery:openrouter', err);
            return [];
        }
    }

    async function discoverGateway() {
        try {
            const payload = await catalogRequest('https://ai-gateway.kilo.ai/api/v1/models', 'kilo');
            const freeModels = payload ? modelRows(payload).filter((model) => {
                if (typeof model?.isFree === 'boolean') return model.isFree;
                const pricing = model?.pricing || {};
                return String(model?.id || '').endsWith(':free')
                    || (String(pricing.prompt) === '0' && String(pricing.completion) === '0');
            }) : [];
            const entries = freeModels.map((model) => discoveryEntry('kilo', 'Kilo', 'https://ai-gateway.kilo.ai/api/v1', model, {
                auth: { type: 'bearer', key: 'anonymous', headerName: null },
                headers: { [CONFIG.PROVIDER_HEADER_NAME]: 'PromptEnhancer' }
            })).filter(Boolean);
            const auto = discoveryEntry('kilo', 'Kilo', 'https://ai-gateway.kilo.ai/api/v1', {}, {
                modelId: 'kilo-auto/free',
                label: 'Kilo · auto (free)',
                auth: { type: 'bearer', key: 'anonymous', headerName: null },
                headers: { [CONFIG.PROVIDER_HEADER_NAME]: 'PromptEnhancer' },
                virtual: true
            });
            if (!entries.some((entry) => entry.id === auto.id)) entries.push(auto);
            return entries;
        } catch (err) {
            console.warn('[PE] discovery:kilo', err);
            return [];
        }
    }

    async function discoverPollinations() {
        try {
            const payload = await catalogRequest('https://text.pollinations.ai/models', 'pollinations');
            const excludePattern = /flux|sdxl|dall-e|dalle|stable.?diffusion|whisper|tts|speech|embedding|rerank|audio|image/i;
            return (payload ? modelRows(payload) : []).filter((model) => {
                const modelId = String(model?.id || model?.model || model?.name || '');
                if (!modelId) return false;
                if (excludePattern.test(modelId)) return false;
                const modalities = model?.output_modalities || model?.outputModalities || model?.output;
                if (Array.isArray(modalities) && modalities.length > 0) {
                    const hasText = modalities.some((m) => String(m).toLowerCase() === 'text');
                    if (!hasText) return false;
                }
                return true;
            }).map((model) => discoveryEntry('pollinations', 'Pollinations', 'https://text.pollinations.ai', model, {
                auth: { type: 'none', key: '', headerName: null }
            })).filter(Boolean);
        } catch (err) {
            console.warn('[PE] discovery:pollinations', err);
            return [];
        }
    }

    async function discoverKeylessAI() {
        try {
            const payload = await catalogRequest('https://keylessai.thryx.workers.dev/v1/models', 'keylessai');
            return (payload ? modelRows(payload) : []).map((model) => discoveryEntry('keylessai', 'KeylessAI', 'https://keylessai.thryx.workers.dev/v1', model, {
                auth: { type: 'bearer', key: 'not-needed', headerName: null }
            })).filter(Boolean);
        } catch (err) {
            console.warn('[PE] discovery:keylessai', err);
            return [];
        }
    }

    const VIRTUAL_ROUTERS = [
        discoveryEntry('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1', {}, {
            modelId: 'openrouter/free',
            label: 'OpenRouter · auto (free)',
            auth: { type: 'bearer', key: '', headerName: null },
            headers: { 'HTTP-Referer': 'https://github.com/EdgeTypE/better-deepseek', 'X-Title': 'Prompt-Enhancer' },
            virtual: true
        }),
        discoveryEntry('kilo', 'Kilo', 'https://ai-gateway.kilo.ai/api/v1', {}, {
            modelId: 'kilo-auto/free',
            label: 'Kilo · auto (free)',
            auth: { type: 'bearer', key: 'anonymous', headerName: null },
            headers: { [CONFIG.PROVIDER_HEADER_NAME]: 'PromptEnhancer' },
            virtual: true
        })
    ];
