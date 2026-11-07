// ===== src/network-errors.js =====
    class NetError extends Error {
        constructor(code, message, meta = {}) {
            super(message || code);
            this.name = 'NetError';
            this.code = code;
            this.meta = meta;
            this.retryable = NetError.RETRYABLE.has(code);
        }
    }
    NetError.RETRYABLE = new Set(['NETWORK','PROVIDER_DOWN','TIMEOUT','NO_FIRST_BYTE','STALL']);
    NetError.AUTO_RETRY = new Set(['NETWORK','PROVIDER_DOWN','TIMEOUT']);

    const ErrorIndexer = (() => {
        const KEY_HISTORY = 'kpe_error_history';
        const HISTORY_MAX = 20;
        const HISTORY_BYTES_MAX = 65_536;
        const SNIPPET_MAX = 240;
        const CATALOG = {
            OFFLINE:{category:'connection',title:'Sem conexão',description:'Verifique sua internet e tente novamente.',retryable:false,actionKey:null},
            NETWORK:{category:'connection',title:'Falha de rede',description:'Não foi possível contatar o servidor.',retryable:true,actionKey:'retry'},
            PROVIDER_DOWN:{category:'server',title:'Provedor indisponível',description:'O servidor retornou um erro 5xx.',retryable:true,actionKey:'retry'},
            PROVIDER_RATE_LIMIT:{category:'rate',title:'Limite do provedor (429)',description:'Muitas requisições em pouco tempo.',retryable:false,actionKey:null},
            PROVIDER_QUOTA:{category:'quota',title:'Cota esgotada (402)',description:'Saldo do provedor esgotado.',retryable:false,actionKey:'open-params'},
            HTTP_CLIENT:{category:'client',title:'Erro do cliente',description:'Requisição rejeitada pelo servidor (4xx).',retryable:false,actionKey:'retry'},
            TIMEOUT:{category:'timeout',title:'Tempo limite excedido',description:'Sem resposta no tempo esperado.',retryable:true,actionKey:'retry-no-context'},
            EMPTY_RESPONSE:{category:'content',title:'Resposta vazia',description:'O provedor não retornou conteúdo útil.',retryable:false,actionKey:'open-params'},
            OUTPUT_TRUNCATED:{category:'content',title:'Resposta interrompida',description:'O modelo atingiu o limite de saída e a continuação automática não conseguiu concluir a resposta.',retryable:false,actionKey:'retry'},
            BAD_JSON:{category:'content',title:'Resposta inválida',description:'JSON malformado ou inesperado.',retryable:false,actionKey:'retry-nostream'},
            LOCAL_RATE_LIMIT:{category:'rate',title:'Limite local atingido',description:'Aguarde antes de novas chamadas.',retryable:false,actionKey:null},
            ABORTED:{category:'abort',title:'Cancelado',description:'Operação interrompida pelo usuário.',retryable:false,actionKey:null},
            NO_FIRST_BYTE:{category:'timeout',title:'Servidor não respondeu',description:'Nenhum byte recebido do servidor.',retryable:true,actionKey:'retry-no-context'},
            STALL:{category:'timeout',title:'Streaming estagnado',description:'Sem novos tokens por alguns segundos.',retryable:true,actionKey:'retry'},
            STREAM_PARSE_ERROR:{category:'content',title:'Erro no streaming',description:'Formato SSE inesperado do servidor.',retryable:false,actionKey:'retry-nostream'}
        };
        function safeJsonParse(text) { try { return JSON.parse(text); } catch (_) { return null; } }
        function truncate(text, max = SNIPPET_MAX) { if (typeof text !== 'string') return ''; const s = text.replace(/\s+/g, ' ').trim(); return s.length > max ? s.slice(0, max).trimEnd() + '…' : s; }
        function parseHeaders(rawHeaders) {
            if (typeof rawHeaders !== 'string' || !rawHeaders) return {};
            const out = {};
            rawHeaders.split(/\r?\n/).forEach(line => {
                const idx = line.indexOf(':');
                if (idx === -1) return;
                const k = line.slice(0, idx).trim().toLowerCase();
                const v = line.slice(idx + 1).trim();
                if (k) out[k] = v;
            });
            return out;
        }
        function parseRetryAfterMs(data, headers) {
            const candidates = [data?.retry_after, data?.retryAfter, data?.error?.retry_after, data?.error?.retryAfter, data?.error?.metadata?.retry_after, data?.error?.metadata?.retryAfter, data?.metadata?.retry_after];
            for (const c of candidates) {
                if (typeof c === 'number' && c > 0) return c < 1000 ? c * 1000 : c;
                if (typeof c === 'string' && /^\d+(\.\d+)?$/.test(c)) return Number(c) * 1000;
            }
            const h = headers || {};
            const retryAfter = h['retry-after'];
            if (retryAfter) {
                if (/^\d+(\.\d+)?$/.test(retryAfter)) return Number(retryAfter) * 1000;
                const date = Date.parse(retryAfter);
                if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
            }
            const xReset = h['x-ratelimit-reset'] || h['x-ratelimit-reset-requests'] || h['ratelimit-reset'];
            if (xReset && /^\d+$/.test(xReset)) { const n = Number(xReset); if (n > 1e9) return Math.max(0, n * 1000 - Date.now()); return n * 1000; }
            return null;
        }
        function extractProviderError(data) {
            if (!data) return null;
            if (data.error) {
                if (typeof data.error === 'string') return { message: data.error, type: '', provider: '', raw: '' };
                const msg = data.error.message || data.error.msg || data.error.detail;
                const type = data.error.type || data.error.code;
                const meta = data.error.metadata || {};
                return { message: typeof msg === 'string' ? msg : '', type: typeof type === 'string' ? type : '', provider: typeof meta.provider_name === 'string' ? meta.provider_name : '', raw: typeof meta.raw === 'string' ? meta.raw : '' };
            }
            if (typeof data.message === 'string') return { message: data.message, type: '', provider: '', raw: '' };
            return null;
        }
        function codeForStatus(status) { if (status === 429) return 'PROVIDER_RATE_LIMIT'; if (status === 402) return 'PROVIDER_QUOTA'; if (status >= 500) return 'PROVIDER_DOWN'; if (status >= 400) return 'HTTP_CLIENT'; return 'NETWORK'; }
        function defaultMessageFor(code, status) {
            switch (code) {
                case 'OFFLINE': return 'Você está offline.';
                case 'NETWORK': return status ? `Resposta inesperada (HTTP ${status}).` : 'Falha de rede.';
                case 'PROVIDER_DOWN': return `Servidor indisponível${status ? ` (HTTP ${status})` : ''}.`;
                case 'PROVIDER_RATE_LIMIT': return 'Limite do provedor atingido (429).';
                case 'PROVIDER_QUOTA': return 'Cota/saldo esgotado no provedor (402).';
                case 'HTTP_CLIENT': return `Requisição rejeitada${status ? ` (HTTP ${status})` : ''}.`;
                case 'TIMEOUT': return 'Tempo limite excedido.';
                case 'EMPTY_RESPONSE': return 'A API não retornou conteúdo.';
                case 'OUTPUT_TRUNCATED': return 'A resposta atingiu o limite de tokens e não pôde ser concluída automaticamente.';
                case 'BAD_JSON': return 'Resposta inválida da API.';
                case 'LOCAL_RATE_LIMIT': return 'Limite local de requisições atingido.';
                case 'ABORTED': return 'Requisição cancelada.';
                case 'NO_FIRST_BYTE': return 'Nenhum byte recebido do servidor.';
                case 'STALL': return 'Streaming estagnado.';
                case 'STREAM_PARSE_ERROR': return 'Falha ao interpretar stream SSE.';
                default: return 'Erro inesperado.';
            }
        }
        function fromHttpResponse(status, data, rawHeaders, rawText) {
            const provider = extractProviderError(data);
            const headers = parseHeaders(rawHeaders);
            const retryAfterMs = parseRetryAfterMs(data, headers);
            const snippet = truncate(rawText);
            const code = codeForStatus(status);
            const meta = { status, headers, snippet, provider, retryAfterMs, providerCode: provider?.type || '', contentType: headers['content-type'] || '' };
            const msg = provider?.message || defaultMessageFor(code, status);
            return new NetError(code, msg, meta);
        }
        function fromStreamError(evt) { const code = evt?.code || 'STREAM_PARSE_ERROR'; const meta = { streamEvent: evt, snippet: truncate(evt?.raw || '') }; return new NetError(code, evt?.message || defaultMessageFor(code), meta); }
        function build({ code, message, meta = {} } = {}) { return new NetError(code || 'NETWORK', message || defaultMessageFor(code), meta); }
        function classify(err) {
            const code = err?.code || 'UNKNOWN';
            const meta = err?.meta || {};
            const entry = CATALOG[code] || { category: 'unknown', title: 'Erro', description: 'Ocorreu um erro inesperado.', retryable: false, actionKey: null };
            const provider = meta.provider || {};
            const providerMsg = provider.message || '';
            const providerName = provider.provider || '';
            const providerCode = String(meta.providerCode || provider.type || '').toUpperCase();
            let title = entry.title, description = entry.description;
            if (meta.status && (code === 'PROVIDER_DOWN' || code === 'HTTP_CLIENT')) title = `${title} (${meta.status})`;
            if (code === 'PROVIDER_RATE_LIMIT' && meta.retryAfterMs) description = `${description} Aguarde ~${Math.ceil(meta.retryAfterMs / 1000)}s.`;
            if (code === 'LOCAL_RATE_LIMIT' && meta.retryAfterMs) description = `Aguarde ~${Math.ceil(meta.retryAfterMs / 1000)}s antes de novas chamadas.`;
            if (code === 'TIMEOUT' && meta.timeoutMs) description = `Sem resposta em ${(meta.timeoutMs / 1000).toFixed(0)}s${meta.payloadKB ? ` (payload ${meta.payloadKB.toFixed(1)} KB)` : ''}.`;
            if (code === 'EMPTY_RESPONSE') { if (meta.finishReason === 'content_filter') description = 'Conteúdo bloqueado pelo filtro de segurança do provedor.'; else if (meta.refusal) description = `Provedor recusou: ${meta.refusal}`; }
            if (code === 'BAD_JSON' && meta.contentType) description = `Recebido "${meta.contentType}" em vez de JSON.`;
            if (providerMsg) {
                if (providerCode === 'PROMOTION_MODEL_LIMIT_REACHED' || /sign up/i.test(providerMsg)) {
                    description = providerMsg;
                } else {
                    description = providerName ? `${providerName}: ${providerMsg}` : providerMsg;
                }
            }
            return {
                code, category: entry.category, title, description, retryable: entry.retryable, actionKey: entry.actionKey,
                technical: { message: err?.message, status: meta.status, snippet: meta.snippet, contentType: meta.contentType, providerCode: meta.providerCode, provider, retryAfterMs: meta.retryAfterMs, finishReason: meta.finishReason, timeoutMs: meta.timeoutMs, payloadKB: meta.payloadKB },
                at: Date.now()
            };
        }
        function record(err) {
            try {
                const entry = classify(err);
                const history = getHistory();
                history.unshift({ at: entry.at, code: entry.code, title: entry.title, description: entry.description, status: entry.technical?.status, host: location.hostname });
                const trimmed = history.slice(0, HISTORY_MAX);
                let serialized = JSON.stringify(trimmed);
                while (serialized.length > HISTORY_BYTES_MAX && trimmed.length > 1) { trimmed.pop(); serialized = JSON.stringify(trimmed); }
                GM_setValue(KEY_HISTORY, serialized);
            } catch (_) {}
        }
        function getHistory() { try { const raw = GM_getValue(KEY_HISTORY, '[]'); const arr = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(arr) ? arr : []; } catch (_) { return []; } }
        function clearHistory() { try { GM_setValue(KEY_HISTORY, '[]'); } catch (_) {} }
        return { CATALOG, fromHttpResponse, fromStreamError, build, classify, record, history: getHistory, clearHistory, defaultMessageFor, codeForStatus, safeJsonParse, truncate, parseHeaders, parseRetryAfterMs, extractProviderError };
    })();
