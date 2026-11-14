// ==UserScript==
// @name         Kilo Prompt Enhancer
// @name:pt-BR   Aprimorador de Prompt Kilo
// @namespace    https://github.com/MaiconJh/Prompt-Enhancer
// @version      4.5.7
// @description  Transparent prompt bar + guided wizard with collapsible questions, inline progress, prompt base chip, flat option lists, inline in-flow panel, optional code context, multi-file project context popover, typed network errors and selective retry, ErrorIndexer, generation parameters, user-managed system prompt with local presets and validation, enhancement run history, and streaming with adaptive feedback. Free anonymous Kilo Code API.
// @description:pt-BR  Barra de prompt transparente + assistente guiado, contexto de código opcional, erros de rede tipados, ErrorIndexer, parâmetros de geração, system prompt editável com presets locais e validação, histórico de aprimoramentos e streaming com feedback adaptativo. API gratuita e anônima do Kilo Code.
// @author       MaiconJh
// @license      MIT
// @match        *://chat.deepseek.com/*
// @match        *://chatgpt.com/*
// @match        *://chat.openai.com/*
// @match        *://claude.ai/*
// @match        *://gemini.google.com/*
// @match        *://*.perplexity.ai/*
// @exclude      *://*.bank*/*
// @exclude      *://*.banco*/*
// @exclude      *://*.gov*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @connect      api.kilo.ai
// @require      https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        API_URL: 'https://api.kilo.ai/api/openrouter/chat/completions',
        MODEL: 'kilo-auto/free',
        EDITOR_NAME: 'KiloPromptEnhancer',
        DEBOUNCE_MS: 500,
        RATE_LIMIT: { max: 10, window: 60_000 },
        MIN_TEXT_LENGTH: 3,
        MAX_FILE_SIZE: 1_048_576,
        MAX_FILE_COUNT: 5,
        AUTO_COLLAPSE_DELAY: 400,
        ACCEPTED_FILE_TYPES: '.js,.ts,.jsx,.tsx,.mjs,.cjs,.py,.java,.go,.rb,.rs,.c,.h,.cpp,.hpp,.cs,.php,.swift,.kt,.scala,.sh,.bash,.sql,.html,.css,.scss,.json,.xml,.yaml,.yml,.md,.txt,.vue,.svelte',
        MAX_CONTEXT_FILE_SIZE: 32_768,
        MAX_CONTEXT_TOTAL_SIZE: 32_768,
        CONTEXT_FILE_ACCEPT: '.md,.markdown,.mdc,.txt,text/markdown,text/plain',
        CONTEXT_KNOWN_NAMES: ['AGENTS.md','AGENT.md','CLAUDE.md','GEMINI.md','.cursorrules','.clinerules'],
        TIMEOUT_BASE_MS: 30_000,
        TIMEOUT_PER_KB_MS: 600,
        TIMEOUT_MAX_MS: 120_000,
        WATCHDOG_WARN_MS: 15_000,
        WATCHDOG_SLOW_MS: 30_000,
        RETRY_MAX: 1,
        RETRY_BACKOFF_MS: 2_500,
        STREAM: true,
        STREAM_PROGRESS_THROTTLE_MS: 80,
        ESTIMATE_BASELINE_TOK_S: 70,
        ESTIMATE_TTFT_MS: 2_500,
        ESTIMATE_OUTPUT_RATIO: 0.35,
        WATCHDOG_NO_FIRST_TOKEN_MS: 8_000,
        WATCHDOG_STALL_MS: 5_000,
        FALLBACK_TIMEOUT_MULTIPLIER: 1.5,
        HISTORY_MAX: 5,
        HISTORY_MAX_BYTES: 32_000,
        HISTORY_RUN_MAX_CHARS: 8_000,
        HISTORY_CALL_MAX_CHARS: 3_000,
        PERSONA_HINTS: {
            formal: 'Formal e profissional',
            casual: 'Casual e amigável',
            technical: 'Técnico e preciso',
            friendly: 'Amigável e encorajador',
            concise: 'Conciso e direto'
        },
        SYSTEM_PROMPT: [
            'Você é um especialista em engenharia de prompts.',
            'Reescreva o prompt do usuário para ser mais claro, específico e estruturado,',
            'mantendo a intenção original.',
            'Trate o bloco de contexto do projeto (quando presente) como regras obrigatórias e complementares.',
            'Regras:',
            '- Adicione contexto relevante quando fizer sentido.',
            '- Especifique o formato de saída desejado.',
            '- Elimine ambiguidades e termos vagos.',
            '- Não invente informações que o usuário não forneceu.',
            '- Retorne APENAS o prompt otimizado, sem explicações nem markdown ao redor.'
        ].join(' '),
        QUESTIONS_SYSTEM_PROMPT: [
            'Você é um especialista em engenharia de prompts.',
            'Trate o bloco de contexto do projeto (quando presente) como regras obrigatórias e complementares.',
            'Analise o prompt abaixo e gere de 3 a 5 perguntas de esclarecimento',
            'que ajudariam a produzir um prompt final muito mais preciso e específico.',
            'Regras OBRIGATÓRIAS:',
            '- Cada pergunta tem um "type" entre: "text", "choice" ou "multi".',
            '- "text": resposta livre. Inclua "placeholder" curto.',
            '- "choice": escolha única. Inclua "options" (2 a 5 strings curtas).',
            '- "multi": múltipla escolha. Inclua "options" (2 a 6 strings curtas).',
            '- Se a pergunta envolver debugging, revisão de código, análise de erro em lógica,',
            '  refatoração ou qualquer contexto técnico onde o usuário possa ter um trecho de código,',
            '  adicione "allowCode": true. Caso contrário, omita o campo.',
            '- No máximo 2 perguntas com "allowCode": true.',
            '- Não pergunte o que já está claro no prompt.',
            '- Perguntas curtas, objetivas, em português do Brasil.',
            'Retorne APENAS JSON válido, sem markdown, sem cercas de código,',
            'exatamente no formato:',
            '{"questions":[{"id":"q1","type":"text","question":"...","placeholder":"..."},',
            '{"id":"q2","type":"choice","question":"...","options":["a","b","c"]},',
            '{"id":"q3","type":"choice","allowCode":true,"question":"...","options":["a","b"]}]}'
        ].join(' '),
        ENHANCE_WITH_ANSWERS_SYSTEM_PROMPT: [
            'Você é um especialista em engenharia de prompts.',
            'Trate o bloco de contexto do projeto (quando presente) como regras obrigatórias e complementares.',
            'O usuário forneceu um prompt inicial e respondeu perguntas de esclarecimento.',
            'Algumas respostas podem incluir trechos de código fornecidos pelo usuário.',
            'Reescreva o prompt inicial incorporando TODAS as respostas de forma natural,',
            'mantendo a intenção original e eliminando ambiguidades.',
            'Quando houver código fornecido, incorpore-o ao prompt final de forma útil',
            '(por exemplo, indicando que o código está anexado, ou descrevendo o problema',
            'que ele apresenta) sem reproduzir o código inteiro, a menos que seja curto.',
            'Regras:',
            '- Não cite as perguntas nem as respostas literalmente; integre-as.',
            '- Especifique o formato de saída desejado quando fizer sentido.',
            '- Retorne APENAS o prompt final, sem explicações nem markdown ao redor.'
        ].join(' ')
    };

    const DUR = { instant: 0.12, fast: 0.2, base: 0.26, slow: 0.26, slower: 0.42 };
    const EASE = { enter: 'power3.out', exit: 'power3.in', spring: 'back.out(1.4)', smooth: 'power2.inOut' };

    const HostShield = (() => {
        let installed = false;
        const isInsideScope = (t) => t && t.closest && t.closest('.pe-scope');
        const findFocusable = (t) => t && t.closest && t.closest('input, textarea, [contenteditable=""], [contenteditable="true"]');
        function install() {
            if (installed) return;
            installed = true;
            ['pointerdown', 'mousedown', 'click'].forEach((evt) => {
                window.addEventListener(evt, (e) => {
                    if (!isInsideScope(e.target)) return;
                    const focusable = findFocusable(e.target);
                    if (!focusable) return;
                    e.stopPropagation();
                    if (evt !== 'click') focusable.focus({ preventScroll: true });
                }, true);
            });
            window.addEventListener('focusin', (e) => {
                if (!isInsideScope(e.target)) return;
                e.stopPropagation();
            }, true);
        }
        return { install };
    })();

    const Utils = {
        debounce(fn, wait) { let t; return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); }; },
        escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); },
        isEditable(el) { if (!el || !el.tagName) return false; if (el.tagName === 'TEXTAREA') return true; if (el.tagName === 'INPUT' && ['text','search'].includes(el.type)) return true; if (el.isContentEditable) return true; return false; },
        getText(el) { if (!el) return ''; if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value || ''; if (el.isContentEditable) return el.innerText || el.textContent || ''; return ''; },
        applyText(el, text) {
            if (!el) return;
            el.focus();
            if (el.isContentEditable) {
                const range = document.createRange();
                range.selectNodeContents(el);
                const sel = window.getSelection();
                sel.removeAllRanges(); sel.addRange(range);
                const ok = document.execCommand('insertText', false, text);
                if (!ok) el.textContent = text;
                return;
            }
            el.select();
            const ok = document.execCommand('insertText', false, text);
            if (!ok || el.value !== text) {
                const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
                const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
                if (setter) setter.call(el, text); else el.value = text;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        },
        uid(prefix = 'pe') { return `${prefix}-${Math.random().toString(36).slice(2, 9)}`; },
        parseJSON(raw) {
            if (typeof raw !== 'string') return null;
            let txt = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
            const s = txt.indexOf('{'), e = txt.lastIndexOf('}');
            if (s === -1 || e === -1 || e <= s) return null;
            try { return JSON.parse(txt.slice(s, e + 1)); } catch { return null; }
        },
        truncate(str, max = 80) { const s = String(str).replace(/\s+/g, ' ').trim(); return s.length > max ? s.slice(0, max).trimEnd() + '…' : s; },
        truncatePreserve(str, max) { if (typeof str !== 'string') return ''; return str.length > max ? str.slice(0, max).trimEnd() + '…' : str; },
        wordCount(str) { const s = String(str).trim(); if (!s) return 0; return s.split(/\s+/).length; },
        formatBytes(bytes) { if (bytes < 1024) return bytes + ' B'; if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'; return (bytes / (1024 * 1024)).toFixed(2) + ' MB'; },
        byteSize(str) { try { return new Blob([String(str)]).size; } catch (_) { try { return new TextEncoder().encode(String(str)).length; } catch (__) { return String(str).length; } } },
        shieldFromHost(el) {
            ['pointerdown','mousedown','pointerup','mouseup','click','dblclick','contextmenu','input','beforeinput','keydown','keyup','keypress'].forEach(evt => {
                el.addEventListener(evt, (e) => e.stopPropagation(), false);
            });
            return el;
        }
    };

    function truncRunText(str, max) {
        if (typeof str !== 'string') return '';
        const lim = max || CONFIG.HISTORY_RUN_MAX_CHARS || 8000;
        return str.length > lim ? str.slice(0, lim).trimEnd() + '…' : str;
    }
    function truncCallText(str, max) {
        if (typeof str !== 'string') return '';
        const lim = max || CONFIG.HISTORY_CALL_MAX_CHARS || 3000;
        return str.length > lim ? str.slice(0, lim).trimEnd() + '…' : str;
    }

    const Providers = (() => {
        function detect() {
            const host = (location.hostname || '').toLowerCase();
            if (host.includes('claude.ai')) return 'claude';
            if (host.includes('chatgpt.com') || host.includes('chat.openai.com')) return 'openai';
            if (host.includes('gemini.google.com')) return 'gemini';
            return 'generic';
        }
        function wrap(body, provider) {
            if (!body) return '';
            switch (provider) {
                case 'claude': return `<project_context>\n${body}\n</project_context>`;
                case 'openai':
                case 'gemini': return `### CONTEXTO DO PROJETO ###\n${body}\n### FIM DO CONTEXTO DO PROJETO ###`;
                default: return `--- Instruções do projeto ---\n${body}\n--- Fim das instruções do projeto ---`;
            }
        }
        return { detect, wrap };
    })();

    const ProjectContext = (() => {
        const KEY_FILES = 'pe_ctx_files';
        const KEY_GLOBAL_ENABLED = 'pe_ctx_global_enabled';
        const safeGet = (k, d) => { try { return GM_getValue(k, d); } catch (_) { return d; } };
        const safeSet = (k, v) => { try { GM_setValue(k, v); return true; } catch (e) { console.error('[PE] GM_setValue falhou:', k, e); return false; } };
        function _read() {
            const raw = safeGet(KEY_FILES, null);
            if (!raw) return [];
            try {
                const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (!Array.isArray(arr)) return [];
                return arr.filter(f => f && typeof f.content === 'string').map(f => ({
                    id: String(f.id || Utils.uid('ctx')),
                    name: String(f.name || 'AGENTS.md'),
                    path: f.path ? String(f.path) : '',
                    content: String(f.content),
                    size: Number(f.size) || String(f.content).length,
                    enabled: f.enabled !== false,
                    source: String(f.source || 'manual')
                }));
            } catch (_) { return []; }
        }
        function _write(list) { return safeSet(KEY_FILES, JSON.stringify(list)); }
        function list() { return _read(); }
        function isEnabled() { return safeGet(KEY_GLOBAL_ENABLED, true); }
        function setEnabled(v) { safeSet(KEY_GLOBAL_ENABLED, !!v); }
        function getTotalSize() { return _read().filter(f => f.enabled).reduce((s, f) => s + (f.size || f.content.length), 0); }
        function getAggregateName() { const active = _read().filter(f => f.enabled); if (!active.length) return ''; if (active.length === 1) return active[0].name; return `${active.length} arquivos`; }
        function hasContent() { return _read().some(f => f.enabled && f.content.trim()); }
        function add({ name, content, path, source }) {
            const trimmed = String(content || '').trim();
            if (!trimmed) return { ok: false, reason: 'empty' };
            if (trimmed.length > CONFIG.MAX_CONTEXT_FILE_SIZE) return { ok: false, reason: 'too-large' };
            const cur = _read();
            const total = cur.filter(f => f.enabled).reduce((s, f) => s + (f.size || 0), 0) + trimmed.length;
            if (total > CONFIG.MAX_CONTEXT_TOTAL_SIZE) return { ok: false, reason: 'total-too-large' };
            const entry = { id: Utils.uid('ctx'), name: String(name || 'AGENTS.md').slice(0, 120), path: path ? String(path) : '', content: trimmed, size: trimmed.length, enabled: true, source: source || 'manual' };
            cur.push(entry); _write(cur);
            return { ok: true, entry };
        }
        function remove(id) { _write(_read().filter(f => f.id !== id)); }
        function toggle(id, enabled) { const cur = _read(); const f = cur.find(x => x.id === id); if (f) { f.enabled = !!enabled; _write(cur); } }
        function clearAll() { _write([]); }
        function buildSystemSuffix({ skip = false } = {}) {
            if (skip) return '';
            if (!isEnabled()) return '';
            const active = _read().filter(f => f.enabled && f.content.trim());
            if (!active.length) return '';
            const parts = active.map(f => `--- ${f.name} ---\n${f.content}`);
            let body = parts.join('\n\n');
            if (body.length > CONFIG.MAX_CONTEXT_TOTAL_SIZE) body = body.slice(0, CONFIG.MAX_CONTEXT_TOTAL_SIZE) + '\n[...contexto truncado]';
            return '\n\n' + Providers.wrap(body, Providers.detect());
        }
        return { list, isEnabled, setEnabled, add, remove, toggle, clearAll, getTotalSize, getAggregateName, hasContent, buildSystemSuffix };
    })();

    function migrateLegacy() {
        const KEY_MIGRATED = 'pe_ctx_migrated';
        let migrated = false;
        try { migrated = GM_getValue(KEY_MIGRATED, false); } catch (_) {}
        if (migrated) return;
        let legacyContent = '', legacyName = 'AGENTS.md', legacyEnabled = true;
        try { legacyContent = GM_getValue('pe_agents_md', ''); } catch (_) {}
        try { legacyName = GM_getValue('pe_agents_name', 'AGENTS.md') || 'AGENTS.md'; } catch (_) {}
        try { legacyEnabled = GM_getValue('pe_agents_enabled', true); } catch (_) {}
        if (legacyContent && legacyContent !== '__PE_EMPTY__') {
            let existing = [];
            try { const raw = GM_getValue('pe_ctx_files', null); if (raw) existing = typeof raw === 'string' ? JSON.parse(raw) : raw; if (!Array.isArray(existing)) existing = []; } catch (_) { existing = []; }
            const has = existing.some(f => f && f.source === 'legacy');
            if (!has) {
                existing.push({ id: Utils.uid('ctx'), name: legacyName || 'AGENTS.md', path: '', content: String(legacyContent).trim(), size: String(legacyContent).length, enabled: !!legacyEnabled, source: 'legacy' });
                try { GM_setValue('pe_ctx_files', JSON.stringify(existing)); } catch (_) {}
            }
        }
        ['pe_agents_md','pe_agents_name','pe_agents_size','pe_agents_enabled'].forEach(k => { try { GM_deleteValue(k); } catch (_) {} });
        try { GM_setValue(KEY_MIGRATED, true); } catch (_) {}
    }

    // ===== Migração pe_history → pe_runs =====
    function _convertLegacyEntry(entry) {
        if (!entry || typeof entry !== 'object') return null;
        const at = Number(entry.at) || Date.now();
        const durationMs = Math.max(0, Number(entry.durationMs) || 0);
        const hasError = !!entry.error;
        const runId = Utils.uid('run');
        const callId = Utils.uid('call');
        return {
            id: runId,
            type: 'enhance',
            startedAt: at,
            endedAt: at + durationMs,
            durationMs,
            input: truncRunText(String(entry.input || '')),
            output: hasError ? null : truncRunText(String(entry.output || '')),
            status: hasError ? 'error' : 'success',
            outcome: hasError ? 'error' : 'applied',
            error: entry.error ? { code: entry.error.code || '', message: String(entry.error.message || ''), meta: entry.error.meta || null } : null,
            params: entry.payload?.params || {},
            contextInfo: { activeCount: 0, totalBytes: 0, enabled: false },
            calls: [{
                id: callId,
                kind: 'main',
                attempt: 1,
                retryOf: null,
                startedAt: at,
                endedAt: at + durationMs,
                durationMs,
                payload: entry.payload ? {
                    system: truncCallText(String(entry.payload.system || '')),
                    messages: Array.isArray(entry.payload.messages) ? entry.payload.messages.map(m => ({ role: m?.role, content: truncCallText(String(m?.content || '')) })) : [],
                    params: entry.payload.params || {},
                    meta: entry.payload.meta || {}
                } : null,
                output: truncCallText(String(entry.output || '')),
                error: entry.error ? { code: entry.error.code || '', message: String(entry.error.message || ''), meta: entry.error.meta || null } : null,
                streamUsed: false,
                fallbackUsed: false
            }],
            meta: { retries: 0, streamUsed: false, fallbackUsed: false, legacy: true }
        };
    }

    function migrateHistoryRuns() {
        const KEY_FLAG = 'pe_runs_migrated';
        const OLD_KEY = 'pe_history';
        const NEW_KEY = 'pe_runs';
        let alreadyMigrated = false;
        try { alreadyMigrated = GM_getValue(KEY_FLAG, false); } catch (_) {}
        if (alreadyMigrated) return;
        let runsExists = false;
        try {
            const raw = GM_getValue(NEW_KEY, null);
            if (raw !== null && raw !== undefined) runsExists = true;
        } catch (_) {}
        if (runsExists) { try { GM_setValue(KEY_FLAG, true); } catch (_) {} return; }
        try {
            let oldHistory = [];
            try {
                const raw = GM_getValue(OLD_KEY, '[]');
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                oldHistory = Array.isArray(parsed) ? parsed : [];
            } catch (_) { oldHistory = []; }
            const convertedRuns = [];
            for (const entry of oldHistory) {
                try {
                    const run = _convertLegacyEntry(entry);
                    if (run) convertedRuns.push(run);
                } catch (_) {}
            }
            try { GM_setValue(NEW_KEY, JSON.stringify(convertedRuns.slice(0, CONFIG.HISTORY_MAX))); } catch (_) {}
            try { GM_deleteValue(OLD_KEY); } catch (_) {}
            try { GM_setValue(KEY_FLAG, true); } catch (_) {}
        } catch (e) {
            try { GM_deleteValue(OLD_KEY); } catch (_) {}
            try {
                const existing = GM_getValue(NEW_KEY, null);
                if (!existing) GM_setValue(NEW_KEY, '[]');
            } catch (_) {}
            try { GM_setValue(KEY_FLAG, true); } catch (_) {}
        }
    }

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
        const KEY_HISTORY = 'pe_error_history';
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
            let title = entry.title, description = entry.description;
            if (meta.status && (code === 'PROVIDER_DOWN' || code === 'HTTP_CLIENT')) title = `${title} (${meta.status})`;
            if (code === 'PROVIDER_RATE_LIMIT' && meta.retryAfterMs) description = `${description} Aguarde ~${Math.ceil(meta.retryAfterMs / 1000)}s.`;
            if (code === 'LOCAL_RATE_LIMIT' && meta.retryAfterMs) description = `Aguarde ~${Math.ceil(meta.retryAfterMs / 1000)}s antes de novas chamadas.`;
            if (code === 'TIMEOUT' && meta.timeoutMs) description = `Sem resposta em ${(meta.timeoutMs / 1000).toFixed(0)}s${meta.payloadKB ? ` (payload ${meta.payloadKB.toFixed(1)} KB)` : ''}.`;
            if (code === 'EMPTY_RESPONSE') { if (meta.finishReason === 'content_filter') description = 'Conteúdo bloqueado pelo filtro de segurança do provedor.'; else if (meta.refusal) description = `Provedor recusou: ${meta.refusal}`; }
            if (code === 'BAD_JSON' && meta.contentType) description = `Recebido "${meta.contentType}" em vez de JSON.`;
            if (providerMsg) description = providerName ? `${providerName}: ${providerMsg}` : providerMsg;
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

    // ===== EnhancementHistory (runs) =====
    const EnhancementHistory = (() => {
        const KEY = 'pe_runs';
        const runs = new Map();

        function _loadPersisted() {
            try {
                const raw = GM_getValue(KEY, '[]');
                const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return Array.isArray(arr) ? arr : [];
            } catch (_) { return []; }
        }

        function _persist(list) {
            try {
                let trimmed = list.slice(0, CONFIG.HISTORY_MAX);
                let serialized = JSON.stringify(trimmed);
                while (serialized.length > CONFIG.HISTORY_MAX_BYTES && trimmed.length > 1) {
                    trimmed.pop();
                    serialized = JSON.stringify(trimmed);
                }
                GM_setValue(KEY, serialized);
            } catch (_) {}
        }

        function _getRun(runId) {
            if (!runId) return null;
            if (runs.has(runId)) return runs.get(runId);
            const list = _loadPersisted();
            const run = list.find(r => r && r.id === runId);
            if (run) runs.set(runId, run);
            return run || null;
        }

        function _saveRun(run) {
            if (!run || !run.id) return;
            const list = _loadPersisted().filter(r => r && r.id !== run.id);
            list.unshift(run);
            _persist(list);
        }

        function startRun({ type, input, params, contextInfo, meta } = {}) {
            const id = Utils.uid('run');
            const run = {
                id,
                type: type || 'enhance',
                startedAt: Date.now(),
                endedAt: 0,
                durationMs: 0,
                input: truncRunText(String(input || '')),
                output: null,
                status: 'aborted',
                outcome: 'pending',
                error: null,
                params: params || {},
                contextInfo: contextInfo || { activeCount: 0, totalBytes: 0, enabled: false },
                calls: [],
                meta: { retries: 0, streamUsed: false, fallbackUsed: false, ...(meta || {}) }
            };
            runs.set(id, run);
            return id;
        }

        function recordCall(runId, callData) {
            if (!runId || !callData) return null;
            let run = _getRun(runId);
            if (!run) return null;
            try {
                const callId = Utils.uid('call');
                const call = {
                    id: callId,
                    kind: callData.kind || 'main',
                    attempt: Number(callData.attempt) || 1,
                    retryOf: callData.retryOf || null,
                    startedAt: Number(callData.startedAt) || Date.now(),
                    endedAt: Number(callData.endedAt) || Date.now(),
                    durationMs: Math.max(0, Number(callData.durationMs) || 0),
                    payload: callData.payload ? {
                        system: truncCallText(String(callData.payload.system || '')),
                        messages: Array.isArray(callData.payload.messages) ? callData.payload.messages.map(m => ({ role: m?.role, content: truncCallText(String(m?.content || '')) })) : [],
                        params: callData.payload.params || {},
                        meta: callData.payload.meta || {}
                    } : null,
                    output: truncCallText(String(callData.output || '')),
                    error: callData.error ? { code: callData.error.code || '', message: String(callData.error.message || ''), meta: callData.error.meta || null } : null,
                    streamUsed: !!callData.streamUsed,
                    fallbackUsed: !!callData.fallbackUsed
                };
                run.calls = run.calls || [];
                run.calls.push(call);
                if (call.streamUsed) run.meta.streamUsed = true;
                if (call.fallbackUsed) run.meta.fallbackUsed = true;
                if (call.attempt > 1) run.meta.retries = Math.max(run.meta.retries || 0, call.attempt - 1);
                runs.set(runId, run);
                return callId;
            } catch (_) { return null; }
        }

        function endRun(runId, { status, output, error } = {}) {
            const run = _getRun(runId);
            if (!run) return;
            run.endedAt = Date.now();
            run.durationMs = Math.max(0, run.endedAt - run.startedAt);
            if (status) {
                run.status = status;
                if (status === 'error') run.outcome = 'error';
            }
            if (output !== undefined) run.output = output === null ? null : truncRunText(String(output || ''));
            if (error !== undefined) run.error = error ? { code: error.code || '', message: String(error.message || ''), meta: error.meta || null } : null;
            runs.set(runId, run);
            _saveRun(run);
        }

        function setOutcome(runId, outcome) {
            const run = _getRun(runId);
            if (!run) return;
            run.outcome = outcome;
            runs.set(runId, run);
            _saveRun(run);
        }

        function cancelRun(runId, { reason } = {}) {
            const run = _getRun(runId);
            if (!run) return;
            run.status = 'aborted';
            run.outcome = 'aborted';
            run.endedAt = run.endedAt || Date.now();
            run.durationMs = Math.max(0, (run.endedAt || Date.now()) - run.startedAt);
            if (reason) run.meta.cancelReason = reason;
            runs.set(runId, run);
            _saveRun(run);
        }

        function listRuns() {
            return _loadPersisted().slice(0, CONFIG.HISTORY_MAX);
        }

        function clear() {
            runs.clear();
            _persist([]);
        }

        function reconcilePending() {
            const list = _loadPersisted();
            let changed = false;
            for (const run of list) {
                if (!run) continue;
                if (run.meta && run.meta.legacy) continue;
                if (run.outcome === 'pending') {
                    run.outcome = 'aborted';
                    changed = true;
                }
            }
            if (changed) _persist(list);
        }

        return { startRun, recordCall, endRun, setOutcome, cancelRun, listRuns, clear, reconcilePending };
    })();

    const RateLimiter = (() => {
        const map = new Map();
        const key = () => location.hostname || 'unknown';
        function _prune() { const now = Date.now(); const k = key(); const arr = (map.get(k) || []).filter(t => now - t < CONFIG.RATE_LIMIT.window); map.set(k, arr); return arr; }
        return {
            check() { const arr = _prune(); if (arr.length < CONFIG.RATE_LIMIT.max) return { allowed: true, retryAfterMs: 0 }; const oldest = arr[0]; return { allowed: false, retryAfterMs: Math.max(0, CONFIG.RATE_LIMIT.window - (Date.now() - oldest)) }; },
            consume() { const arr = _prune(); arr.push(Date.now()); map.set(key(), arr); },
            refund() { const arr = _prune(); if (arr.length > 0) arr.pop(); map.set(key(), arr); }
        };
    })();

    // ===== ParamSchema (number | select) =====
    const ParamSchema = (() => {
        const SCHEMA = [
            { key: 'temperature', label: 'Temperatura', type: 'number', min: 0, max: 2, step: 0.1, default: 0.7, hint: '0 = determinístico · 2 = criativo' },
            { key: 'max_tokens', label: 'Máx. tokens', type: 'number', min: 64, max: 8192, step: 1, default: 2048, hint: 'Limite de tokens na resposta' },
            { key: 'top_p', label: 'Top-P', type: 'number', min: 0, max: 1, step: 0.05, default: 1.0, hint: '1.0 = desativado' },
            { key: 'frequency_penalty', label: 'Penal. frequência', type: 'number', min: -2, max: 2, step: 0.1, default: 0.0, hint: 'Reduz repetições de tokens' },
            { key: 'presence_penalty', label: 'Penal. presença', type: 'number', min: -2, max: 2, step: 0.1, default: 0.0, hint: 'Encoraja novos tópicos' },
            { key: 'seed', label: 'Seed', type: 'number', min: 0, max: 2147483647, step: 1, default: null, hint: 'Vazio = aleatório' },
            { key: 'response_language', label: 'Idioma da resposta', type: 'select', default: 'auto', hint: 'Idioma esperado na resposta do modelo', options: [
                { value: 'auto', label: 'Auto (mesmo do input)' },
                { value: 'pt-BR', label: 'Português (BR)' },
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
                { value: 'fr', label: 'Français' },
                { value: 'de', label: 'Deutsch' },
                { value: 'it', label: 'Italiano' },
                { value: 'ja', label: '日本語' },
                { value: 'zh', label: '中文' }
            ]},
            { key: 'response_persona', label: 'Personalidade', type: 'select', default: 'auto', hint: 'Tom/tipo de resposta', options: [
                { value: 'auto', label: 'Auto' },
                { value: 'formal', label: 'Formal' },
                { value: 'casual', label: 'Casual' },
                { value: 'technical', label: 'Técnico' },
                { value: 'friendly', label: 'Amigável' },
                { value: 'concise', label: 'Conciso' }
            ]}
        ];
        const PRESETS = [
            { key: 'precise', label: 'Preciso', values: { temperature: 0.2, top_p: 0.9, max_tokens: 2048 } },
            { key: 'balanced', label: 'Equilibrado', values: { temperature: 0.7, top_p: 1.0, max_tokens: 2048 } },
            { key: 'creative', label: 'Criativo', values: { temperature: 1.1, top_p: 1.0, max_tokens: 3072 } }
        ];
        function defaults() { const o = {}; SCHEMA.forEach(f => { o[f.key] = f.default; }); return o; }
        function validate(values) {
            const errors = [];
            for (const f of SCHEMA) {
                const v = values?.[f.key];
                if (v === null || v === undefined || v === '') continue;
                if (f.type === 'number') {
                    const n = Number(v);
                    if (!Number.isFinite(n)) { errors.push(`${f.label}: valor inválido`); continue; }
                    if (n < f.min || n > f.max) errors.push(`${f.label}: fora do intervalo [${f.min}, ${f.max}]`);
                } else if (f.type === 'text') {
                    if (typeof v !== 'string') errors.push(`${f.label}: deve ser texto`);
                    else if (f.maxLength && v.length > f.maxLength) errors.push(`${f.label}: máx ${f.maxLength} caracteres`);
                } else if (f.type === 'select') {
                    const opts = (f.options || []).map(o => o.value ?? o);
                    if (!opts.includes(v)) errors.push(`${f.label}: opção inválida`);
                }
            }
            return errors;
        }
        function clean(values) {
            const out = {};
            for (const f of SCHEMA) {
                const v = values?.[f.key];
                if (v === null || v === undefined || v === '') continue;
                if (f.type === 'number') { const n = Number(v); if (Number.isFinite(n)) out[f.key] = n; }
                else if (f.type === 'text') { if (typeof v === 'string') { const trimmed = v.trim(); if (trimmed) out[f.key] = f.maxLength ? trimmed.slice(0, f.maxLength) : trimmed; } }
                else if (f.type === 'select') { const opts = (f.options || []).map(o => o.value ?? o); if (opts.includes(v)) out[f.key] = v; }
            }
            return out;
        }
        function load() {
            try {
                const raw = GM_getValue('pe_params', null);
                const merged = defaults();
                if (!raw) return merged;
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                for (const f of SCHEMA) if (parsed[f.key] !== undefined) merged[f.key] = parsed[f.key];
                return merged;
            } catch (_) { return defaults(); }
        }
        function save(values) { try { GM_setValue('pe_params', JSON.stringify(values)); } catch (_) {} }
        return { SCHEMA, PRESETS, defaults, validate, clean, load, save };
    })();

    const SystemPromptManager = (() => {
        const STORAGE_KEY = 'pe_system_prompt_v1';
        const MAX_LENGTH = 12_000;
        const MAX_PRESETS = 20;
        const MAX_PRESET_NAME = 60;

        function defaultConfig() {
            return { version: 1, prompt: CONFIG.SYSTEM_PROMPT, presets: [] };
        }

        function validatePrompt(prompt) {
            const text = typeof prompt === 'string' ? prompt : '';
            const trimmed = text.trim();
            const errors = [];
            const warnings = [];
            if (!trimmed) errors.push('O system prompt não pode ficar vazio.');
            if (text.length > MAX_LENGTH) errors.push(`O limite é ${MAX_LENGTH.toLocaleString('pt-BR')} caracteres.`);
            if (trimmed && trimmed.length < 80) warnings.push('Prompt curto: confira se as instruções e o resultado esperado estão claros.');
            if (trimmed && !/[\r\n]/.test(trimmed)) warnings.push('Considere separar instruções em linhas para facilitar a leitura.');
            return { errors, warnings, charCount: text.length };
        }

        function normalize(config) {
            if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Os dados salvos do system prompt estão inválidos.');
            const prompt = typeof config.prompt === 'string' ? config.prompt : CONFIG.SYSTEM_PROMPT;
            const promptCheck = validatePrompt(prompt);
            if (promptCheck.errors.length) throw new Error(promptCheck.errors.join(' '));
            const presets = Array.isArray(config.presets) ? config.presets : [];
            if (presets.length > MAX_PRESETS) throw new Error(`O limite é ${MAX_PRESETS} presets.`);
            const names = new Set();
            const cleanPresets = presets.map((preset) => {
                if (!preset || typeof preset !== 'object') throw new Error('Há um preset inválido nos dados salvos.');
                const name = String(preset.name || '').trim();
                const value = typeof preset.prompt === 'string' ? preset.prompt : '';
                const key = name.toLocaleLowerCase();
                if (!name || name.length > MAX_PRESET_NAME) throw new Error(`O nome do preset deve ter entre 1 e ${MAX_PRESET_NAME} caracteres.`);
                if (names.has(key)) throw new Error(`Há presets duplicados com o nome "${name}".`);
                if (validatePrompt(value).errors.length) throw new Error(`O prompt do preset "${name}" é inválido.`);
                names.add(key);
                return { name, prompt: value };
            });
            return { version: 1, prompt, presets: cleanPresets };
        }

        function readLegacyPrompt() {
            try {
                const raw = GM_getValue('pe_params', null);
                const params = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (params && typeof params.system_prompt === 'string' && params.system_prompt.trim()) return params.system_prompt;
            } catch (error) {
                console.warn('[PE] Não foi possível migrar o system prompt legado:', error);
            }
            return null;
        }

        function load() {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw !== null) {
                let parsed;
                try { parsed = JSON.parse(raw); }
                catch (error) { throw new Error(`Não foi possível ler os dados do system prompt: ${error.message}`); }
                return normalize(parsed);
            }
            const initial = defaultConfig();
            const legacyPrompt = readLegacyPrompt();
            if (legacyPrompt) initial.prompt = legacyPrompt;
            save(initial);
            return initial;
        }

        function save(config) {
            const clean = normalize(config);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
            return clean;
        }

        function currentPrompt() { return load().prompt; }

        function withUserInstructions(basePrompt) {
            const custom = currentPrompt();
            if (custom.trim() === CONFIG.SYSTEM_PROMPT.trim()) return basePrompt;
            return `${basePrompt}\n\nInstruções personalizadas do usuário (complementares; preserve o formato de saída e os requisitos operacionais acima):\n${custom}`;
        }

        function simulate(prompt) {
            const validation = validatePrompt(prompt);
            if (validation.errors.length) return { ...validation, ok: false };
            const isDefault = prompt.trim() === CONFIG.SYSTEM_PROMPT.trim();
            const mainPrompt = prompt;
            const guidedQuestions = withUserInstructionsFor(prompt, CONFIG.QUESTIONS_SYSTEM_PROMPT);
            const guidedEnhance = withUserInstructionsFor(prompt, CONFIG.ENHANCE_WITH_ANSWERS_SYSTEM_PROMPT);
            const included = isDefault || [guidedQuestions, guidedEnhance].every(text => text.includes(prompt));
            return {
                ...validation,
                ok: included && mainPrompt === prompt,
                message: included ? 'Simulação local concluída: prompt selecionado no aprimoramento e compatibilidade verificada nas etapas guiadas. Nenhum dado foi enviado.' : 'A simulação não confirmou a composição do prompt.'
            };
        }

        function withUserInstructionsFor(prompt, basePrompt) {
            if (prompt.trim() === CONFIG.SYSTEM_PROMPT.trim()) return basePrompt;
            return `${basePrompt}\n\nInstruções personalizadas do usuário (complementares; preserve o formato de saída e os requisitos operacionais acima):\n${prompt}`;
        }

        return { STORAGE_KEY, MAX_LENGTH, MAX_PRESETS, MAX_PRESET_NAME, defaultConfig, validatePrompt, load, save, currentPrompt, withUserInstructions, simulate };
    })();

    const StreamParser = (() => {
        function create() {
            let buffer = '', doneEmitted = false;
            function feed(delta) {
                if (!delta) return [];
                buffer += delta;
                const events = [];
                let idx;
                while ((idx = buffer.indexOf('\n\n')) !== -1) {
                    const chunk = buffer.slice(0, idx);
                    buffer = buffer.slice(idx + 2);
                    for (const line of chunk.split('\n')) {
                        const t = line.trim();
                        if (!t || !t.startsWith('data:')) continue;
                        const data = t.slice(5).trim();
                        if (data === '[DONE]') { if (!doneEmitted) { events.push({ type: 'done' }); doneEmitted = true; } continue; }
                        let parsed;
                        try { parsed = JSON.parse(data); } catch (_) { continue; }
                        const choice = parsed?.choices?.[0];
                        if (parsed?.usage) events.push({ type: 'usage', usage: parsed.usage });
                        if (!choice) continue;
                        const deltaObj = choice.delta;
                        if (deltaObj && typeof deltaObj.content === 'string' && deltaObj.content.length) events.push({ type: 'token', text: deltaObj.content });
                        if (choice.finish_reason) events.push({ type: 'finish', reason: choice.finish_reason });
                    }
                }
                return events;
            }
            return { feed };
        }
        return { create };
    })();

    const Anim = (() => {
        const hasGsap = typeof window.gsap !== 'undefined';
        const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const dur = (d) => reduced() ? 0.001 : d;
        const enabled = () => hasGsap && !reduced();
        if (hasGsap && window.gsap.ticker) window.gsap.ticker.lagSmoothing(200, 33);
        const fadeIn = (el, opts = {}) => { if (!el) return Promise.resolve(); if (!enabled()) { el.style.opacity = '1'; return Promise.resolve(); } return new Promise(r => window.gsap.fromTo(el, { autoAlpha: 0, y: opts.y ?? 8 }, { autoAlpha: 1, y: 0, duration: dur(opts.duration ?? DUR.base), ease: opts.ease ?? EASE.enter, onComplete: r })); };
        const panelIn = (el, opts = {}) => { if (!el) return Promise.resolve(); if (!enabled()) { el.style.opacity = '1'; return Promise.resolve(); } return new Promise(r => window.gsap.fromTo(el, { autoAlpha: 0, y: opts.y ?? 6 }, { autoAlpha: 1, y: 0, duration: dur(opts.duration ?? DUR.base), ease: opts.ease ?? EASE.enter, onComplete: r })); };
        const panelOut = (el, opts = {}) => { if (!el) return Promise.resolve(); if (!enabled()) { el.style.opacity = '0'; return Promise.resolve(); } return new Promise(r => window.gsap.to(el, { autoAlpha: 0, y: opts.y ?? 4, duration: dur(opts.duration ?? DUR.fast), ease: opts.ease ?? EASE.exit, onComplete: r })); };
        const shake = (el) => { if (!el || !enabled()) return; window.gsap.fromTo(el, { x: -2 }, { x: 2, duration: 0.06, yoyo: true, repeat: 5, ease: 'power1.inOut', onComplete: () => window.gsap.set(el, { x: 0 }) }); };
        const staggerIn = (parent, step = 0.04) => { if (!parent || !enabled()) return Promise.resolve(); const kids = Array.from(parent.children); return new Promise(r => window.gsap.fromTo(kids, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power2.out', stagger: dur(step), onComplete: r })); };
        const typewriter = (el, opts = {}) => { if (!el) return Promise.resolve(); if (!enabled()) { el.style.clipPath = 'none'; return Promise.resolve(); } return new Promise(r => window.gsap.fromTo(el, { clipPath: 'inset(0 100% 0 0)', opacity: 1 }, { clipPath: 'inset(0 0% 0 0)', duration: dur(opts.duration ?? 0.85), ease: 'power2.inOut', onComplete: r })); };
        const toastIn = (el) => { if (!el || !enabled()) { if (el) el.style.opacity = '1'; return; } window.gsap.fromTo(el, { autoAlpha: 0, y: 16, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: dur(DUR.base), ease: EASE.spring }); };
        const toastOut = (el, done) => { if (!el) { done?.(); return; } if (!enabled()) { el.remove(); done?.(); return; } window.gsap.to(el, { autoAlpha: 0, y: 12, duration: dur(DUR.fast), ease: EASE.exit, onComplete: () => { el.remove(); done?.(); } }); };
        const barIn = (el) => { if (!el || !enabled()) return; window.gsap.fromTo(el, { autoAlpha: 0, y: -6, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: dur(DUR.slow), ease: EASE.enter }); };
        const barOut = (el, done) => { if (!el) { done?.(); return; } if (!enabled()) { el.remove(); done?.(); return; } window.gsap.to(el, { autoAlpha: 0, y: -6, scale: 0.985, duration: dur(DUR.fast), ease: EASE.exit, onComplete: () => { el.remove(); done?.(); } }); };
        const hoverIn = (el) => { if (el && enabled()) window.gsap.to(el, { y: -1, duration: 0.15, ease: 'power2.out', overwrite: 'auto' }); };
        const hoverOut = (el) => { if (el && enabled()) window.gsap.to(el, { y: 0, duration: 0.15, ease: 'power2.out', overwrite: 'auto' }); };
        const press = (el) => { if (!el || !enabled()) return; window.gsap.fromTo(el, { scale: 1 }, { scale: 0.97, duration: 0.08, ease: 'power2.out', onComplete: () => window.gsap.to(el, { scale: 1, duration: 0.14, ease: EASE.spring }) }); };
        const pulseSuccess = (el) => { if (!el || !enabled()) return; window.gsap.fromTo(el, { boxShadow: '0 0 0 0 rgba(16,163,127,.45)' }, { boxShadow: '0 0 0 12px rgba(16,163,127,0)', duration: 0.7, ease: 'power2.out' }); };
        const pulseSuccessClass = (el) => { if (!el) return; el.classList.add('is-new'); setTimeout(() => el.classList.remove('is-new'), 800); };
        return { enabled, reduced, hasGsap, fadeIn, panelIn, panelOut, shake, staggerIn, typewriter, toastIn, toastOut, barIn, barOut, hoverIn, hoverOut, press, pulseSuccess, pulseSuccessClass };
    })();

    // ===== Gear canvas (loading overlay) =====
    const GEAR_STATES = {
        connecting: { rgb: [124, 156, 255], rgb2: [168,  85, 247], morph: 0.0, speed: 1.0 },
        waiting:    { rgb: [148, 154, 177], rgb2: [100, 116, 139], morph: 0.25, speed: 0.6 },
        streaming:  { rgb: [ 56, 189, 248], rgb2: [124, 156, 255], morph: 0.65, speed: 1.8 },
        finalizing: { rgb: [ 16, 185, 129], rgb2: [ 52, 211, 153], morph: 1.0, speed: 1.4 },
        retrying:   { rgb: [245, 158,  11], rgb2: [239,  68,  68], morph: 0.4, speed: -0.7 }
    };

    function createGear(canvas, initialState = 'connecting') {
        if (!canvas) return null;
        const size = 48;
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = Math.round(size * dpr);
        canvas.height = Math.round(size * dpr);
        canvas.style.width  = size + 'px';
        canvas.style.height = size + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const initial = GEAR_STATES[initialState] || GEAR_STATES.connecting;
        const sim = {
            phase: 0, absTime: 0,
            speed: initial.speed,
            morphProgress: initial.morph,
            rgb: [...initial.rgb],
            rgb2: [...initial.rgb2]
        };
        let target = initial;
        let last = performance.now();
        let rafId = null;
        let stopped = false;

        function render() {
            ctx.clearRect(0, 0, size, size);
            const cx = size / 2, cy = size / 2;
            const baseR = size * 0.35;
            const [r1, g1, b1] = sim.rgb.map(Math.round);
            const [r2, g2, b2] = sim.rgb2.map(Math.round);
            const morph = sim.morphProgress;

            const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, baseR * 1.5);
            glow.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${0.2 + morph * 0.15})`);
            glow.addColorStop(1, `rgba(${r1}, ${g1}, ${b1}, 0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, baseR * 1.5, 0, Math.PI * 2);
            ctx.fill();

            if (morph < 1) {
                const alphaRing = Math.pow(1 - morph, 0.7) * 0.55;
                if (alphaRing > 0.005) {
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(sim.phase * 0.5);
                    ctx.beginPath();
                    ctx.arc(0, 0, baseR * 1.18, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${r1}, ${g1}, ${b1}, ${alphaRing})`;
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            const steps = 120;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(sim.phase * (0.4 + morph * 0.6));
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const theta = (i / steps) * Math.PI * 2;
                const fluidWave =
                    Math.sin(theta * 3 + sim.absTime * 2.5) * 0.12 +
                    Math.cos(theta * 5 - sim.absTime * 1.8) * 0.08;
                const teeth = 8;
                const gearWave = (Math.cos(teeth * theta) - 0.18 * Math.cos(3 * teeth * theta)) * 0.15;
                const combinedDeform = (1 - morph) * fluidWave + morph * gearWave;
                const r = baseR * (1 + combinedDeform);
                const x = Math.cos(theta) * r;
                const y = Math.sin(theta) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();

            const fillGrad = ctx.createLinearGradient(-baseR, -baseR, baseR, baseR);
            fillGrad.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${0.25 + morph * 0.15})`);
            fillGrad.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, ${0.08 + morph * 0.1})`);
            ctx.fillStyle = fillGrad;
            ctx.fill();

            const strokeGrad = ctx.createLinearGradient(-baseR, -baseR, baseR, baseR);
            strokeGrad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
            strokeGrad.addColorStop(0.5, '#FFFFFF');
            strokeGrad.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
            ctx.strokeStyle = strokeGrad;
            ctx.lineWidth = 1.8;
            ctx.lineJoin = 'round';
            ctx.stroke();
            ctx.restore();

            if (morph > 0.3) {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(-sim.phase * 1.2);
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${r1}, ${g1}, ${b1}, ${morph * 0.75})`;
                ctx.lineWidth = 1.1;
                ctx.setLineDash([2.5, 2.5]);
                ctx.stroke();
                ctx.restore();
            }

            const pulse = 1 + 0.12 * Math.sin(sim.absTime * 4);
            ctx.beginPath();
            ctx.arc(cx, cy, (size * 0.08) * pulse, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }

        function loop(now) {
            if (stopped) return;
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            const damp = 1 - Math.exp(-5.5 * dt);
            sim.speed += (target.speed - sim.speed) * damp;
            sim.morphProgress += (target.morph - sim.morphProgress) * damp;
            for (let i = 0; i < 3; i++) {
                sim.rgb[i]  += (target.rgb[i]  - sim.rgb[i])  * damp;
                sim.rgb2[i] += (target.rgb2[i] - sim.rgb2[i]) * damp;
            }
            sim.absTime += dt;
            sim.phase   += dt * sim.speed;
            render();
            rafId = requestAnimationFrame(loop);
        }
        rafId = requestAnimationFrame(loop);

        return {
            setState(state) {
                const s = GEAR_STATES[state];
                if (s) target = s;
            },
            destroy() {
                stopped = true;
                if (rafId) cancelAnimationFrame(rafId);
                rafId = null;
            }
        };
    }

    function injectStyles() {
        GM_addStyle(`
            :where(.pe-scope){
                --pe-surface:#ffffff;--pe-surface-2:#f5f6f8;--pe-surface-3:#ebecef;--pe-surface-code:#fbfcfd;
                --pe-text:#1a1a1a;--pe-text-muted:#6b7280;--pe-text-faint:#9ca3af;
                --pe-border:#e5e6e9;--pe-border-strong:#d1d3d9;--pe-border-soft:#e8eaee;
                --pe-success:#10a37f;--pe-error:#d1453b;--pe-warning:#946200;--pe-accent:#4d6bfe;--pe-accent-soft:#f0f2ff;--pe-accent-border:#dde3ff;
                --pe-radius-sm:6px;--pe-radius:10px;--pe-radius-lg:14px;
                --pe-gap-1:4px;--pe-gap-2:6px;--pe-gap-3:8px;
                --pe-shadow-panel:0 12px 32px rgba(16,18,24,.14),0 2px 8px rgba(16,18,24,.08);
                --pe-shadow-popover:0 12px 32px rgba(16,18,24,.14),0 2px 8px rgba(16,18,24,.08);
                --pe-focus-ring:0 0 0 3px rgba(107,114,128,.15);--pe-accent-ring:0 0 0 3px rgba(77,107,254,.10);
                --pe-font:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Helvetica Neue",Arial,sans-serif;
                --pe-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
                --pe-dur-micro:120ms;--pe-dur-fast:180ms;--pe-dur-base:260ms;--pe-dur-slow:260ms;
                --pe-ease-out:cubic-bezier(0.05,0.7,0.1,1);--pe-ease-emph:cubic-bezier(0.2,0,0,1);--pe-ease-spring:cubic-bezier(0.34,1.56,0.64,1);
            }
            @media (prefers-color-scheme: dark){:where(.pe-scope){
                --pe-surface:#1c1d21;--pe-surface-2:#26282d;--pe-surface-3:#32353b;--pe-surface-code:#202226;
                --pe-text:#eceef2;--pe-text-muted:#9ba1ad;--pe-text-faint:#6b7280;
                --pe-border:#2c2e34;--pe-border-strong:#3b3e45;--pe-border-soft:#2c2e34;
                --pe-shadow-panel:0 14px 36px rgba(0,0,0,.55),0 2px 8px rgba(0,0,0,.35);
                --pe-shadow-popover:0 14px 36px rgba(0,0,0,.55),0 2px 8px rgba(0,0,0,.35);
                --pe-focus-ring:0 0 0 3px rgba(200,200,200,.12);
                --pe-accent-soft:#1f2540;--pe-accent-border:#2f3a5f;--pe-warning:#e4b954;
            }}
            @media (prefers-reduced-motion: reduce){.pe-scope *,.pe-scope *::before,.pe-scope *::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;}}
            /* v4.5.2 — universal box-sizing on all .pe-scope descendants to prevent content-box overflow */
            :where(.pe-scope) *,:where(.pe-scope) *::before,:where(.pe-scope) *::after{box-sizing:border-box;}
        `);
        GM_addStyle(`
            .pe-scope .pe-ico{width:14px;height:14px;flex-shrink:0;display:inline-block;vertical-align:middle;}
            .pe-mount{display:block;width:100%;position:relative;font-family:var(--pe-font);box-sizing:border-box;margin-bottom:var(--pe-gap-2);}
            .pe-mount *,.pe-mount *::before,.pe-mount *::after{box-sizing:border-box;}
            .pe-actionbar{display:flex;align-items:center;gap:var(--pe-gap-2);padding:var(--pe-gap-2) var(--pe-gap-3);background:transparent;border-bottom:1px solid var(--pe-border);font-family:var(--pe-font);font-size:12px;line-height:1;min-height:34px;flex-wrap:wrap;}
            .pe-btn{position:relative;display:inline-flex;align-items:center;gap:var(--pe-gap-2);padding:6px 10px;font:inherit;font-weight:500;color:var(--pe-text-muted);background:transparent;border:1px solid transparent;border-radius:var(--pe-radius-sm);cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;isolation:isolate;transition:background-color var(--pe-dur-fast) ease,color var(--pe-dur-fast) ease,border-color var(--pe-dur-fast) ease;will-change:transform;}
            .pe-btn:hover:not([disabled]){color:var(--pe-text);background:var(--pe-surface-2);}
            .pe-btn:focus-visible{outline:none;border-color:var(--pe-border-strong);background:var(--pe-surface-2);box-shadow:var(--pe-focus-ring);}
            .pe-btn[disabled]{opacity:.5;cursor:not-allowed;}
            .pe-btn .pe-ico{width:14px;height:14px;flex-shrink:0;display:inline-block;}
            .pe-btn .pe-label{display:inline-block;}
            .pe-btn--primary{color:var(--pe-text);background:transparent;border-color:var(--pe-border-strong);}
            .pe-btn--primary:hover:not([disabled]){color:var(--pe-text);background:var(--pe-surface-2);border-color:var(--pe-border-strong);}
            .pe-btn--outline{color:var(--pe-text);background:transparent;border-color:transparent;}
            .pe-btn--outline:hover:not([disabled]){background:var(--pe-surface-2);color:var(--pe-text);border-color:var(--pe-border);}
            .pe-btn--agents .pe-status-dot{width:6px;height:6px;border-radius:50%;background:var(--pe-text-faint);flex-shrink:0;margin-left:2px;transition:background var(--pe-dur-base) ease,box-shadow var(--pe-dur-base) ease;}
            .pe-btn--agents.is-loaded{color:var(--pe-accent);border-color:var(--pe-accent-border);background:var(--pe-accent-soft);}
            .pe-btn--agents.is-loaded:hover{background:var(--pe-accent-soft);border-color:var(--pe-accent);color:var(--pe-accent);}
            .pe-btn--agents.is-loaded .pe-ico{color:var(--pe-accent);}
            .pe-btn--agents.is-loaded .pe-status-dot{background:var(--pe-accent);box-shadow:0 0 0 2px rgba(77,107,254,.2);}
            .pe-btn.is-loading{pointer-events:none;}
            .pe-btn.is-loading .pe-ico,.pe-btn.is-loading .pe-label{opacity:.55;}
            .pe-btn.is-loading::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent 20%,rgba(127,127,127,0.10) 45%,rgba(127,127,127,0.18) 50%,rgba(127,127,127,0.10) 55%,transparent 80%);background-size:220% 100%;animation:pe-shimmer 1.3s linear infinite;pointer-events:none;border-radius:inherit;}
            @keyframes pe-shimmer{from{background-position:140% 0;}to{background-position:-40% 0;}}
            .pe-spin{animation:pe-rotate 0.9s linear infinite;}
            @keyframes pe-rotate{to{transform:rotate(360deg);}}
            .pe-agents-popover{position:fixed;top:0;left:0;width:320px;background:var(--pe-surface);border:1px solid var(--pe-border-strong);border-radius:var(--pe-radius-lg);box-shadow:var(--pe-shadow-popover);opacity:0;transform:translateY(6px) scale(.98);transform-origin:bottom left;pointer-events:none;transition:opacity var(--pe-dur-fast) ease,transform var(--pe-dur-base) cubic-bezier(.34,1.4,.64,1);z-index:2147483646;overflow:hidden;font-family:var(--pe-font);font-size:12px;color:var(--pe-text);}
            .pe-agents-popover.is-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}
            .pe-pop-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--pe-border-soft);}
            .pe-pop-head-title{flex:1 1 auto;display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--pe-text);min-width:0;}
            .pe-pop-head-title .pe-ico{width:14px;height:14px;color:var(--pe-accent);flex-shrink:0;}
            .pe-pop-close{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:5px;color:var(--pe-text-faint);cursor:pointer;padding:0;flex-shrink:0;}
            .pe-pop-close:hover{background:var(--pe-surface-2);color:var(--pe-text);}
            .pe-pop-close svg{width:12px;height:12px;}
            .pe-pop-body{padding:10px 12px;}
            .pe-pop-empty{display:flex;flex-direction:column;gap:8px;}
            .pe-pop-empty-title{font-size:12px;font-weight:500;color:var(--pe-text-muted);text-align:center;line-height:1.5;}
            .pe-pop-empty-hint{font-size:10.5px;color:var(--pe-text-faint);text-align:center;line-height:1.5;}
            .pe-pop-empty-hint code{font-family:var(--pe-mono);font-size:10px;background:var(--pe-surface-2);padding:1px 4px;border-radius:3px;}
            .pe-pop-divider{height:1px;background:var(--pe-border-soft);margin:2px 0;}
            .pe-pop-action{display:flex;align-items:center;gap:9px;width:100%;padding:9px 11px;font-family:inherit;font-size:12px;font-weight:500;color:var(--pe-text);background:var(--pe-surface-code);border:1px solid var(--pe-border);border-radius:8px;cursor:pointer;text-align:left;}
            .pe-pop-action:hover{background:var(--pe-accent-soft);border-color:var(--pe-accent-border);}
            .pe-pop-action .pe-ico{width:14px;height:14px;color:var(--pe-accent);flex-shrink:0;}
            .pe-pop-action-body{flex:1 1 auto;display:flex;flex-direction:column;gap:1px;min-width:0;}
            .pe-pop-action-title{font-weight:500;color:var(--pe-text);line-height:1.3;}
            .pe-pop-action-hint{font-size:10.5px;color:var(--pe-text-faint);font-weight:400;line-height:1.3;}
            .pe-pop-paste{display:flex;flex-direction:column;gap:8px;}
            .pe-pop-paste-textarea{width:100%;padding:9px 11px;font-family:var(--pe-mono);font-size:11px;line-height:1.55;color:var(--pe-text);background:var(--pe-surface);border:1px solid var(--pe-border);border-radius:8px;outline:none;resize:vertical;min-height:100px;box-sizing:border-box;min-width:0;max-width:100%;}
            .pe-pop-paste-actions{display:flex;gap:6px;}
            .pe-pop-paste-actions button{flex:1;padding:6px 10px;font-family:inherit;font-size:11.5px;font-weight:500;border-radius:7px;cursor:pointer;border:1px solid var(--pe-border);background:var(--pe-surface);color:var(--pe-text-muted);}
            .pe-pop-paste-actions button:hover{background:var(--pe-surface-2);color:var(--pe-text);}
            .pe-pop-paste-actions button.primary{background:var(--pe-accent);border-color:var(--pe-accent);color:#fff;}
            .pe-pop-paste-actions button[disabled]{opacity:.5;cursor:not-allowed;}
            .pe-pop-toggle{display:flex;align-items:center;gap:8px;padding:6px 2px;cursor:pointer;user-select:none;}
            .pe-pop-toggle input{display:none;}
            .pe-pop-toggle-switch{width:28px;height:16px;flex-shrink:0;background:var(--pe-border-strong);border-radius:999px;position:relative;transition:background var(--pe-dur-base) ease;}
            .pe-pop-toggle-switch::after{content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform var(--pe-dur-base) cubic-bezier(.34,1.56,.64,1);}
            .pe-pop-toggle input:checked + .pe-pop-toggle-switch{background:var(--pe-accent);}
            .pe-pop-toggle input:checked + .pe-pop-toggle-switch::after{transform:translateX(12px);}
            .pe-pop-toggle-label{flex:1 1 auto;font-size:11.5px;color:var(--pe-text-muted);line-height:1.3;}
            .pe-pop-toggle-label strong{font-weight:600;color:var(--pe-text);}
            .pe-pop-foot{display:flex;gap:6px;padding:8px 12px;background:var(--pe-surface-code);border-top:1px solid var(--pe-border-soft);}
            .pe-pop-foot-btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:6px 10px;font-family:inherit;font-size:11.5px;font-weight:500;border-radius:7px;cursor:pointer;border:1px solid var(--pe-border);background:var(--pe-surface);color:var(--pe-text-muted);}
            .pe-pop-foot-btn:hover{background:var(--pe-surface-2);color:var(--pe-text);}
            .pe-pop-foot-btn.danger{color:var(--pe-error);border-color:#f0d4d2;}
            .pe-pop-foot-btn.danger:hover{background:rgba(209,69,59,.08);border-color:var(--pe-error);color:var(--pe-error);}
            .pe-inline-slot{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--pe-dur-slow) var(--pe-ease-emph);}
            .pe-inline-slot.is-open{grid-template-rows:1fr;}
            .pe-inline-clip{overflow:hidden;min-height:0;}
            .pe-panel{position:relative;margin:6px 6px 8px;max-height:min(58vh,520px);display:flex;flex-direction:column;background:var(--pe-surface);color:var(--pe-text);border:1px solid var(--pe-border-strong);border-radius:var(--pe-radius-lg);box-shadow:0 1px 3px rgba(16,18,24,.06);font-family:var(--pe-font);font-size:13.5px;overflow:hidden;opacity:0;will-change:transform,opacity;min-width:0;}
            .pe-panel__header{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--pe-border);flex-shrink:0;min-width:0;}
            .pe-panel__header h4{margin:0;font-size:14px;font-weight:600;color:var(--pe-text);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:0 1 auto;}
            .pe-panel__header-extra{display:flex;align-items:center;gap:8px;flex:1 1 auto;min-width:0;}
            .pe-panel__close{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;color:var(--pe-text-muted);background:transparent;border:1px solid transparent;border-radius:var(--pe-radius-sm);cursor:pointer;flex-shrink:0;margin-left:auto;}
            .pe-panel__close:hover{color:var(--pe-text);background:var(--pe-surface-2);}
            .pe-panel__body{position:relative;padding:14px 16px;overflow:hidden auto;flex:1 1 auto;overscroll-behavior:contain;min-height:60px;min-width:0;}
            .pe-panel__footer{display:flex;justify-content:space-between;align-items:center;gap:var(--pe-gap-3);padding:10px 16px;border-top:1px solid var(--pe-border);flex-shrink:0;}
            .pe-panel__expand{font-size:11.5px;color:var(--pe-text-muted);background:transparent;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;font-weight:500;font-family:inherit;}
            .pe-panel__expand:hover{background:var(--pe-surface-2);color:var(--pe-text);}
            .pe-panel__actions{display:flex;gap:var(--pe-gap-3);}
            .pe-progress-inline{display:flex;align-items:center;gap:8px;flex:1 1 auto;min-width:0;}
            .pe-progress-inline .pe-progress-track{flex:1 1 auto;height:4px;background:var(--pe-surface-2);border-radius:999px;overflow:hidden;min-width:40px;}
            .pe-progress-inline .pe-progress-fill{height:100%;width:0;background:var(--pe-text-muted);border-radius:999px;transition:width var(--pe-dur-slow) var(--pe-ease-emph);}
            .pe-progress-inline .pe-progress-label{font-size:11.5px;font-weight:600;color:var(--pe-text-muted);white-space:nowrap;flex-shrink:0;font-variant-numeric:tabular-nums;}
            .pe-section-label{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--pe-text-faint);margin:14px 0 6px;}
            .pe-section-label:first-child{margin-top:0;}
            .pe-section-label svg{width:12px;height:12px;flex-shrink:0;}
            .pe-agents-indicator{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--pe-accent-soft);border:1px solid var(--pe-accent-border);border-radius:var(--pe-radius);font-size:11.5px;color:var(--pe-accent);}
            .pe-agents-indicator .pe-ico{width:14px;height:14px;flex-shrink:0;}
            .pe-agents-indicator__body{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;}
            .pe-agents-indicator__title{font-weight:600;color:var(--pe-accent);}
            .pe-agents-indicator__meta{font-size:10.5px;opacity:.8;font-variant-numeric:tabular-nums;}
            .pe-field{margin-bottom:14px;}
            .pe-field:last-child{margin-bottom:0;}
            .pe-field-label{display:block;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--pe-text-faint);margin-bottom:6px;}
            .pe-field-text{max-height:240px;overflow:auto;padding:12px 14px;background:var(--pe-surface-2);border:1px solid var(--pe-border);border-radius:var(--pe-radius);white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;line-height:1.55;font-size:13px;color:var(--pe-text);min-width:0;max-width:100%;}
            .pe-prompt-base{margin-bottom:12px;border:1px solid var(--pe-border);border-radius:var(--pe-radius);background:var(--pe-surface-2);overflow:hidden;}
            .pe-prompt-base__trigger{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;font-family:inherit;font-size:12px;font-weight:500;color:var(--pe-text-muted);background:transparent;border:none;cursor:pointer;text-align:left;}
            .pe-prompt-base__trigger:hover{background:var(--pe-surface-3);color:var(--pe-text);}
            .pe-prompt-base__icon{width:14px;height:14px;flex-shrink:0;color:var(--pe-text-faint);}
            .pe-prompt-base__label{flex-shrink:0;font-weight:600;color:var(--pe-text);}
            .pe-prompt-base__meta{flex:1 1 auto;font-size:11.5px;font-weight:400;color:var(--pe-text-faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
            .pe-prompt-base__count{flex-shrink:0;padding:2px 6px;font-size:10.5px;font-weight:600;color:var(--pe-text-muted);background:var(--pe-surface-3);border-radius:4px;font-variant-numeric:tabular-nums;}
            .pe-prompt-base__chevron{width:14px;height:14px;flex-shrink:0;color:var(--pe-text-faint);transition:transform var(--pe-dur-base) var(--pe-ease-emph);}
            .pe-prompt-base.is-expanded .pe-prompt-base__chevron{transform:rotate(90deg);}
            .pe-prompt-base__content{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--pe-dur-base) var(--pe-ease-emph);}
            .pe-prompt-base.is-expanded .pe-prompt-base__content{grid-template-rows:1fr;}
            .pe-prompt-base__content > div{overflow:hidden;min-height:0;}
            .pe-prompt-base__text{padding:10px 12px 12px;font-size:12.5px;line-height:1.55;color:var(--pe-text);white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;border-top:1px solid var(--pe-border);max-height:200px;overflow-y:auto;min-width:0;max-width:100%;}
            .pe-q-item{border:1px solid var(--pe-border);border-radius:var(--pe-radius);margin-bottom:8px;background:var(--pe-surface);overflow:hidden;}
            .pe-q-item.is-open{border-color:var(--pe-border-strong);}
            .pe-q-header{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;cursor:pointer;user-select:none;background:transparent;width:100%;text-align:left;border:none;font-family:inherit;position:relative;overflow:hidden;}
            .pe-q-header:hover{background:var(--pe-surface-2);}
            .pe-ripple{position:absolute;border-radius:50%;background:rgba(107,114,128,.18);transform:scale(0);opacity:1;animation:pe-ripple var(--pe-dur-slow) var(--pe-ease-out) forwards;pointer-events:none;}
            @keyframes pe-ripple{to{transform:scale(2.6);opacity:0;}}
            .pe-q-num{flex-shrink:0;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--pe-text-muted);background:var(--pe-surface);border:1px solid var(--pe-border-strong);border-radius:50%;margin-top:1px;position:relative;}
            .pe-q-num svg{width:12px;height:12px;stroke:currentColor;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:20;stroke-dashoffset:20;display:none;}
            .pe-q-item.is-answered .pe-q-num{background:var(--pe-text-muted);color:var(--pe-surface);border-color:var(--pe-text-muted);}
            .pe-q-item.is-answered .pe-q-num span{display:none;}
            .pe-q-item.is-answered .pe-q-num svg{display:block;animation:pe-draw-check var(--pe-dur-slow) var(--pe-ease-out) forwards;}
            @keyframes pe-draw-check{to{stroke-dashoffset:0;}}
            .pe-q-header-main{flex:1;min-width:0;}
            .pe-q-text{font-size:13px;font-weight:500;color:var(--pe-text);line-height:1.45;}
            .pe-q-hint{display:block;font-size:11px;font-weight:500;color:var(--pe-text-faint);margin-top:3px;max-height:30px;}
            .pe-q-hint--code{display:inline-flex !important;align-items:center;gap:5px;margin-top:4px;padding:2px 8px 2px 6px;background:var(--pe-accent-soft);border:1px solid var(--pe-accent-border);border-radius:6px;color:var(--pe-accent);font-size:10.5px;font-weight:500;max-height:24px;width:fit-content;}
            .pe-q-hint--code svg{width:10px;height:10px;flex-shrink:0;}
            .pe-q-summary{display:block;font-size:12px;color:var(--pe-text-muted);margin-top:4px;line-height:1.4;opacity:0;max-height:0;overflow:hidden;transition:opacity var(--pe-dur-base) var(--pe-ease-out),max-height var(--pe-dur-base) var(--pe-ease-out);}
            .pe-q-summary__value{color:var(--pe-text);font-weight:600;}
            .pe-q-item.is-answered:not(.is-open) .pe-q-hint{opacity:0;max-height:0;overflow:hidden;}
            .pe-q-item.is-answered:not(.is-open) .pe-q-summary{opacity:1;max-height:60px;}
            .pe-q-chevron{flex-shrink:0;width:16px;height:16px;color:var(--pe-text-faint);margin-top:3px;transition:transform var(--pe-dur-base) var(--pe-ease-emph);}
            .pe-q-item.is-open .pe-q-chevron{transform:rotate(180deg);color:var(--pe-text-muted);}
            .pe-q-content{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--pe-dur-base) var(--pe-ease-emph);}
            .pe-q-item.is-open .pe-q-content{grid-template-rows:1fr;}
            .pe-q-content > div{overflow:hidden;min-height:0;}
            .pe-q-content-inner{padding:0 14px 12px 46px;min-width:0;}
            .pe-options-group{display:flex;flex-direction:column;gap:1px;min-width:0;}
            .pe-option{display:flex;align-items:center;gap:9px;padding:8px 10px;font-size:12.5px;color:var(--pe-text);background:transparent;border:none;border-left:2px solid transparent;border-radius:0 6px 6px 0;cursor:pointer;user-select:none;}
            .pe-option:hover{background:var(--pe-surface-2);}
            .pe-option.is-checked{background:var(--pe-surface-3);border-left-color:var(--pe-text-muted);}
            .pe-radio,.pe-checkbox{width:14px;height:14px;flex-shrink:0;position:relative;}
            .pe-radio{border-radius:50%;border:1.5px solid var(--pe-border-strong);}
            .pe-checkbox{border-radius:4px;border:1.5px solid var(--pe-border-strong);}
            .pe-option.is-checked .pe-radio{border-color:var(--pe-text-muted);}
            .pe-option.is-checked .pe-radio::after{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--pe-text-muted);}
            .pe-option.is-checked .pe-checkbox{border-color:var(--pe-text-muted);background:var(--pe-text-muted);}
            .pe-option.is-checked .pe-checkbox::after{content:'';position:absolute;left:3.5px;top:1px;width:5px;height:8px;border:solid var(--pe-surface);border-width:0 2px 2px 0;transform:rotate(45deg);}
            .pe-options-divider{display:flex;align-items:center;gap:8px;padding:8px 10px 6px;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--pe-text-faint);}
            .pe-options-divider::before,.pe-options-divider::after{content:'';flex:1;height:1px;background:var(--pe-border);}
            .pe-free-text{display:flex;flex-direction:column;gap:0;padding:0;min-width:0;}
            .pe-free-text__row{display:flex;align-items:center;gap:9px;padding:8px 10px;border-left:2px solid transparent;border-radius:0 6px 6px 0;cursor:pointer;user-select:none;font-size:12.5px;color:var(--pe-text);}
            .pe-free-text__row:hover{background:var(--pe-surface-2);}
            .pe-free-text.is-active .pe-free-text__row{background:var(--pe-surface-3);border-left-color:var(--pe-text-muted);}
            .pe-free-text.is-active .pe-radio::after{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--pe-text-muted);}
            .pe-free-text.is-active .pe-checkbox{border-color:var(--pe-text-muted);background:var(--pe-text-muted);}
            .pe-free-text.is-active .pe-checkbox::after{content:'';position:absolute;left:3.5px;top:1px;width:5px;height:8px;border:solid var(--pe-surface);border-width:0 2px 2px 0;transform:rotate(45deg);}
            .pe-free-text__label{font-weight:500;}
            .pe-free-text__input-wrap{max-height:0;overflow:hidden;transition:max-height var(--pe-dur-base) var(--pe-ease-emph);}
            .pe-free-text.is-active .pe-free-text__input-wrap{max-height:200px;}
            .pe-free-text__input-wrap > div{padding:0 10px 8px 35px;min-width:0;}
            .pe-free-text__input{width:100%;padding:8px 10px;margin-top:4px;font-family:inherit;font-size:12.5px;color:var(--pe-text);background:var(--pe-surface);border:1px solid var(--pe-border-strong);border-radius:8px;outline:none;box-sizing:border-box;min-width:0;max-width:100%;}
            .pe-textarea{width:100%;padding:9px 12px;font-family:inherit;font-size:13px;color:var(--pe-text);background:var(--pe-surface-2);border:1px solid var(--pe-border-strong);border-radius:var(--pe-radius);outline:none;resize:vertical;min-height:68px;line-height:1.5;box-sizing:border-box;min-width:0;max-width:100%;}
            .pe-textarea:focus{border-color:var(--pe-text-muted);background:var(--pe-surface);box-shadow:var(--pe-focus-ring);}
            .pe-code-wrap{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--pe-dur-base) var(--pe-ease-emph);margin-top:8px;min-width:0;}
            .pe-code-wrap.is-visible{grid-template-rows:1fr;}
            .pe-code-clip{overflow:hidden;min-height:0;}
            .pe-code-area{position:relative;background:var(--pe-surface-code);border-radius:var(--pe-radius);padding:10px 10px 8px;min-width:0;}
            .pe-code-actions{position:absolute;top:6px;right:6px;display:flex;gap:2px;padding:2px;background:var(--pe-surface);border:1px solid var(--pe-border);border-radius:7px;opacity:0;transform:translateY(-2px);pointer-events:none;transition:opacity var(--pe-dur-fast) ease,transform var(--pe-dur-fast) ease;z-index:2;}
            .pe-code-area:hover .pe-code-actions{opacity:1;transform:translateY(0);pointer-events:auto;}
            .pe-code-action{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;font-family:inherit;font-size:11px;font-weight:500;color:var(--pe-text-muted);background:transparent;border:none;border-radius:5px;cursor:pointer;}
            .pe-code-action:hover{background:var(--pe-surface-2);color:var(--pe-text);}
            .pe-code-action svg{width:11px;height:11px;flex-shrink:0;}
            .pe-code-tabs{display:flex;padding:3px;margin:0 0 8px;background:var(--pe-surface-2);border-radius:7px;gap:2px;width:fit-content;}
            .pe-code-tab{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:5px 12px;font-family:inherit;font-size:11.5px;font-weight:500;color:var(--pe-text-muted);background:transparent;border:none;border-radius:5px;cursor:pointer;}
            .pe-code-tab:hover{color:var(--pe-text);}
            .pe-code-tab.is-active{background:var(--pe-surface);color:var(--pe-text);box-shadow:0 1px 2px rgba(16,18,24,.06);}
            .pe-code-tab svg{width:12px;height:12px;flex-shrink:0;}
            .pe-code-pane{padding:0;min-width:0;}
            .pe-code-pane[hidden]{display:none;}
            .pe-code-textarea{width:100%;padding:10px 12px;font-family:var(--pe-mono);font-size:11.5px;line-height:1.55;color:var(--pe-text);background:var(--pe-surface);border:1px solid transparent;border-radius:8px;outline:none;resize:vertical;min-height:100px;box-sizing:border-box;min-width:0;max-width:100%;}
            .pe-code-textarea.is-error{border-color:var(--pe-error);}
            .pe-code-textarea-footer{display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding:0 4px;font-size:11px;color:var(--pe-text-faint);gap:8px;flex-wrap:wrap;min-width:0;}
            .pe-code-lang{font-family:inherit;font-size:11px;font-weight:500;color:var(--pe-text-muted);background:var(--pe-surface);border:1px solid var(--pe-border);border-radius:6px;padding:4px 8px;cursor:pointer;outline:none;box-sizing:border-box;max-width:100%;}
            .pe-code-count{font-variant-numeric:tabular-nums;}
            .pe-code-count.is-error{color:var(--pe-error);font-weight:600;}
            .pe-code-error{display:flex;align-items:center;gap:5px;margin-top:6px;padding:0 4px;font-size:11px;color:var(--pe-error);font-weight:500;max-height:0;overflow:hidden;transition:max-height var(--pe-dur-base) ease;}
            .pe-code-error.is-visible{max-height:30px;}
            .pe-code-error svg{flex-shrink:0;width:12px;height:12px;}
            .pe-dropzone{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:20px 16px 16px;border:1.5px dashed var(--pe-border-strong);border-radius:var(--pe-radius);background:var(--pe-surface);text-align:center;cursor:pointer;}
            .pe-dropzone:hover{border-color:var(--pe-text-faint);background:var(--pe-surface-2);}
            .pe-dropzone__icon svg{width:22px;height:22px;}
            .pe-dropzone__title{font-size:12px;font-weight:500;color:var(--pe-text-muted);}
            .pe-dropzone__hint{font-size:11px;color:var(--pe-text-faint);line-height:1.5;}
            .pe-dropzone__hint code{font-family:var(--pe-mono);font-size:10.5px;background:var(--pe-surface-2);padding:1px 4px;border-radius:3px;color:var(--pe-text-muted);}
            .pe-dropzone__btn{display:inline-flex;align-items:center;gap:5px;margin-top:6px;padding:6px 12px;font-family:inherit;font-size:11.5px;font-weight:500;color:var(--pe-accent);background:var(--pe-surface);border:1px solid var(--pe-accent-border);border-radius:7px;cursor:pointer;}
            .pe-file-list{margin-top:8px;display:flex;flex-direction:column;gap:5px;}
            .pe-file-list:empty{display:none;}
            .pe-file-chip{display:flex;align-items:center;gap:9px;padding:7px 10px;background:var(--pe-surface);border:1px solid var(--pe-border);border-radius:8px;font-size:11.5px;}
            .pe-file-chip.is-new{animation:pe-file-pulse 0.7s cubic-bezier(.2,0,0,1);}
            @keyframes pe-file-pulse{0%{box-shadow:0 0 0 0 rgba(16,163,127,.45);border-color:var(--pe-success);}100%{box-shadow:0 0 0 12px rgba(16,163,127,0);border-color:var(--pe-border);}}
            .pe-file-chip svg{width:14px;height:14px;color:var(--pe-text-muted);flex-shrink:0;}
            .pe-file-chip__name{flex:1 1 auto;min-width:0;font-weight:500;color:var(--pe-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .pe-file-chip__size{font-size:10.5px;color:var(--pe-text-faint);font-variant-numeric:tabular-nums;flex-shrink:0;}
            .pe-file-chip__remove{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:5px;color:var(--pe-text-faint);cursor:pointer;padding:0;flex-shrink:0;}
            .pe-file-chip__remove:hover{background:var(--pe-surface-2);color:var(--pe-error);}
            .pe-file-chip__remove svg{width:12px;height:12px;}

            /* ===== Loading Overlay — organic machine with gear top-right ===== */
            .pe-panel-loading{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:5;padding:16px;background:color-mix(in srgb,var(--pe-surface) 94%,transparent);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);border-radius:inherit;overflow:hidden;--pe-loader-accent:#7C9CFF;--pe-loader-glow:rgba(124,156,255,.4);}
            .pe-panel-loading.is-active{display:flex;}
            .pe-panel-loading__card{position:relative;width:100%;max-width:380px;border-radius:22px;padding:12px 16px;background:radial-gradient(120% 160% at 20% -10%,color-mix(in srgb,var(--pe-loader-accent) 8%,transparent) 0%,transparent 55%),radial-gradient(120% 160% at 100% 110%,rgba(255,255,255,.02) 0%,transparent 50%),var(--pe-surface);border:1px solid var(--pe-border);box-shadow:0 24px 56px -8px rgba(0,0,0,.7),0 8px 16px -4px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.05);overflow:hidden;isolation:isolate;transition:background 600ms var(--pe-ease-emph);min-width:0;}
            @media (prefers-color-scheme: light){.pe-panel-loading__card{background:radial-gradient(120% 160% at 20% -10%,color-mix(in srgb,var(--pe-loader-accent) 8%,transparent) 0%,transparent 55%),radial-gradient(120% 160% at 100% 110%,rgba(0,0,0,.02) 0%,transparent 50%),var(--pe-surface);box-shadow:0 24px 56px -8px rgba(16,18,24,.18),0 8px 16px -4px rgba(16,18,24,.08),inset 0 1px 0 rgba(255,255,255,.9);}}
            .pe-panel-loading__halo{position:absolute;top:-16px;right:-16px;width:110px;height:110px;border-radius:50%;background:radial-gradient(circle,var(--pe-loader-glow) 0%,transparent 65%);opacity:.35;pointer-events:none;filter:blur(20px);transition:opacity 600ms var(--pe-ease-emph),background 600ms var(--pe-ease-emph);z-index:0;}
            .pe-panel-loading__top{display:flex;justify-content:flex-end;margin-bottom:2px;position:relative;z-index:1;}
            .pe-gear-wrap{width:48px;height:48px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
            .pe-gear-wrap canvas{width:48px;height:48px;display:block;position:relative;z-index:1;}
            .pe-panel-loading__body{position:relative;z-index:1;min-width:0;}
            .pe-panel-loading__title-wrap{position:relative;min-height:1.3em;}
            .pe-panel-loading__title{font-size:14px;font-weight:600;letter-spacing:-.015em;color:var(--pe-text);margin:0;line-height:1.3;transition:opacity 220ms var(--pe-ease-emph),transform 220ms var(--pe-ease-emph);will-change:opacity,transform;}
            .pe-panel-loading__title.is-swapping{opacity:0;transform:translateY(-3px);}
            .pe-panel-loading__sub-wrap{position:relative;min-height:1.35em;margin-top:2px;}
            .pe-panel-loading__sub{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px;color:var(--pe-text-muted);line-height:1.35;transition:opacity 220ms var(--pe-ease-emph),transform 220ms var(--pe-ease-emph);will-change:opacity,transform;}
            .pe-panel-loading__sub.is-swapping{opacity:0;transform:translateY(-3px);}
            .pe-dots{display:inline-flex;gap:3px;align-items:center;}
            .pe-dots span{width:3px;height:3px;border-radius:50%;background:var(--pe-text-muted);opacity:.4;animation:pe-dot-pulse 1.6s ease-in-out infinite;will-change:transform,opacity;}
            .pe-dots span:nth-child(2){animation-delay:.16s;}
            .pe-dots span:nth-child(3){animation-delay:.32s;}
            @keyframes pe-dot-pulse{0%,60%,100%{opacity:.3;transform:scale(1);}30%{opacity:1;transform:scale(1.2);}}
            .pe-token-pill,.pe-retry-pill{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;font-family:var(--pe-mono);font-size:10.5px;font-weight:500;border-radius:99px;font-variant-numeric:tabular-nums;line-height:1.4;will-change:opacity;}
            .pe-token-pill{color:var(--pe-loader-accent);background:color-mix(in srgb,var(--pe-loader-accent) 10%,transparent);border:1px solid color-mix(in srgb,var(--pe-loader-accent) 25%,transparent);}
            .pe-token-pill::before{content:'';width:4px;height:4px;border-radius:50%;background:var(--pe-loader-accent);opacity:.8;}
            .pe-retry-pill{color:#F5B94C;background:rgba(245,185,76,.1);border:1px solid rgba(245,185,76,.28);}
            .pe-retry-pill::before{content:'';width:4px;height:4px;border-radius:50%;background:#F5B94C;opacity:.9;}
            .pe-shimmer{position:relative;height:2px;margin:12px 0;border-radius:99px;background:rgba(127,127,127,.06);overflow:hidden;z-index:1;}
            .pe-shimmer::after{content:'';position:absolute;top:0;left:0;height:100%;width:35%;background:linear-gradient(90deg,transparent 0%,var(--pe-loader-accent) 50%,transparent 100%);opacity:.65;animation:pe-shimmer-run 2.2s var(--pe-ease-emph) infinite;will-change:transform;}
            @keyframes pe-shimmer-run{0%{transform:translateX(-100%);}100%{transform:translateX(320%);}}
            .pe-panel-loading__meta{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;color:var(--pe-text-faint);flex-wrap:wrap;}
            .pe-panel-loading__meta-l,.pe-panel-loading__meta-r{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
            .pe-time{display:inline-flex;align-items:center;gap:6px;font-family:var(--pe-mono);font-size:10.5px;font-variant-numeric:tabular-nums;color:var(--pe-text-muted);}
            .pe-time__label{font-family:var(--pe-font);font-size:10px;font-weight:600;color:var(--pe-text-faint);letter-spacing:.08em;text-transform:uppercase;}
            .pe-debug-toggle{appearance:none;display:inline-flex;align-items:center;gap:5px;background:transparent;border:1px solid var(--pe-border);color:var(--pe-text-muted);font-family:var(--pe-font);font-size:11px;font-weight:500;padding:4px 10px;border-radius:99px;cursor:pointer;transition:background var(--pe-dur-fast) ease,border-color var(--pe-dur-fast) ease,color var(--pe-dur-fast) ease;}
            .pe-debug-toggle:hover{background:var(--pe-surface-2);border-color:var(--pe-border-strong);color:var(--pe-text);}
            .pe-debug-toggle:focus-visible{outline:none;border-color:var(--pe-accent);box-shadow:var(--pe-accent-ring);}
            .pe-debug-toggle svg{width:10px;height:10px;flex-shrink:0;transition:transform 220ms var(--pe-ease-emph);}
            .pe-debug-toggle[aria-expanded="true"] svg{transform:rotate(180deg);}
            .pe-cancel{appearance:none;background:transparent;border:1px solid var(--pe-border-strong);color:var(--pe-text-muted);font-family:var(--pe-font);font-size:11px;font-weight:500;padding:4px 12px;border-radius:99px;cursor:pointer;transition:background var(--pe-dur-fast) ease,border-color var(--pe-dur-fast) ease,color var(--pe-dur-fast) ease,opacity var(--pe-dur-fast) ease;}
            .pe-cancel:hover{background:var(--pe-surface-2);border-color:var(--pe-text-faint);color:var(--pe-text);}
            .pe-cancel:focus-visible{outline:none;border-color:var(--pe-accent);box-shadow:var(--pe-accent-ring);}
            .pe-cancel[disabled]{opacity:.6;cursor:wait;}
            .pe-debug{display:grid;grid-template-rows:0fr;transition:grid-template-rows 260ms var(--pe-ease-emph);margin:0 -16px;position:relative;z-index:1;}
            .pe-debug.is-open{grid-template-rows:1fr;}
            .pe-debug__clip{overflow:hidden;min-height:0;}
            .pe-debug__inner{margin:14px 16px 0 16px;padding-top:12px;border-top:1px dashed var(--pe-border-strong);display:flex;flex-direction:column;gap:12px;min-width:0;}
            .pe-debug__grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:11px;min-width:0;}
            .pe-debug__row{display:flex;align-items:baseline;gap:6px;min-width:0;}
            .pe-debug__key{flex-shrink:0;min-width:64px;font-family:var(--pe-font);font-size:10px;font-weight:500;color:var(--pe-text-faint);text-transform:uppercase;letter-spacing:.05em;}
            .pe-debug__val{font-family:var(--pe-mono);font-size:10.5px;color:var(--pe-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;transition:color 200ms var(--pe-ease-emph);}
            .pe-debug__val.is-muted{color:var(--pe-text-faint);}
            .pe-debug__val.is-accent{color:var(--pe-loader-accent);}
            .pe-debug__val.is-warn{color:#F5B94C;}
            .pe-debug__val.is-err{color:var(--pe-error);}
            .pe-debug__val.is-ok{color:var(--pe-success);}
            .pe-debug__log{max-height:130px;overflow-y:auto;background:var(--pe-surface-code);border:1px solid var(--pe-border);border-radius:10px;padding:6px 8px;font-family:var(--pe-mono);font-size:10.5px;line-height:1.55;scrollbar-width:thin;scrollbar-color:var(--pe-border-strong) transparent;}
            .pe-debug__log::-webkit-scrollbar{width:6px;}
            .pe-debug__log::-webkit-scrollbar-thumb{background:var(--pe-border-strong);border-radius:3px;}
            .pe-debug__log-line{display:flex;align-items:baseline;gap:6px;color:var(--pe-text-muted);animation:pe-log-in 260ms var(--pe-ease-emph);}
            @keyframes pe-log-in{from{opacity:0;transform:translateY(-2px);}to{opacity:1;transform:translateY(0);}}
            .pe-debug__log-line + .pe-debug__log-line{margin-top:1px;}
            .pe-debug__log-time{color:var(--pe-text-faint);flex-shrink:0;min-width:42px;}
            .pe-debug__log-ev{color:var(--pe-loader-accent);flex-shrink:0;}
            .pe-debug__log-detail{color:var(--pe-text-muted);min-width:0;overflow-wrap:anywhere;word-break:break-word;}
            .pe-debug__log-line.is-warn .pe-debug__log-ev{color:#F5B94C;}
            .pe-debug__log-line.is-err .pe-debug__log-ev{color:var(--pe-error);}
            .pe-debug__log-line.is-ok .pe-debug__log-ev{color:var(--pe-success);}
            .pe-panel-loading[data-state="connecting"]{--pe-loader-accent:#7C9CFF;--pe-loader-glow:rgba(124,156,255,.4);}
            .pe-panel-loading[data-state="waiting"]{--pe-loader-accent:#9BA1AD;--pe-loader-glow:rgba(155,161,173,.3);}
            .pe-panel-loading[data-state="streaming"]{--pe-loader-accent:#4D8BFF;--pe-loader-glow:rgba(77,139,255,.5);}
            .pe-panel-loading[data-state="finalizing"]{--pe-loader-accent:#10A37F;--pe-loader-glow:rgba(16,163,127,.45);}
            .pe-panel-loading[data-state="retrying"]{--pe-loader-accent:#F5B94C;--pe-loader-glow:rgba(245,185,76,.45);}
            .pe-panel-loading.is-float{position:relative;inset:auto;display:flex;align-items:stretch;justify-content:flex-start;padding:0;background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;border-radius:0;overflow:visible;}
            .pe-panel-loading.is-float .pe-panel-loading__card{min-width:0;max-width:400px;flex:1 1 auto;}
            .pe-float-wrap{position:fixed;bottom:24px;right:24px;z-index:2147483645;max-width:400px;font-family:var(--pe-font);}
            @media (prefers-reduced-motion: reduce){
                .pe-dots span{animation:none;opacity:.6;}
                .pe-shimmer::after{animation:none;transform:translateX(35%);opacity:.5;}
                .pe-debug,.pe-debug-toggle svg,.pe-panel-loading__title,.pe-panel-loading__sub{transition:none;}
                .pe-debug__log-line{animation:none;}
                .pe-panel-loading__halo{transition:none;}
            }

            /* ===== Error block ===== */
            .pe-panel-error{padding:11px 13px;border-radius:var(--pe-radius);background:var(--pe-surface-2);border:1px solid var(--pe-border-strong);border-left:3px solid var(--pe-error);color:var(--pe-text);font-size:12.5px;font-weight:500;line-height:1.45;margin-bottom:12px;}
            .pe-panel-error-slot:empty{display:none;}
            .pe-panel-error-slot{margin-bottom:10px;}
            .pe-panel-error__title{font-weight:600;color:var(--pe-text);margin-bottom:3px;}
            .pe-panel-error__desc{font-weight:400;color:var(--pe-text-muted);font-size:12px;line-height:1.4;}
            .pe-panel-error__details{margin-top:8px;font-size:11px;}
            .pe-panel-error__details summary{cursor:pointer;color:var(--pe-accent);font-weight:500;user-select:none;}
            .pe-panel-error__details pre{margin:6px 0 0;padding:8px 10px;background:var(--pe-surface-code);border:1px solid var(--pe-border);border-radius:6px;font-family:var(--pe-mono);font-size:10.5px;line-height:1.4;color:var(--pe-text-muted);white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;max-height:180px;overflow:auto;min-width:0;max-width:100%;}
            .pe-param-body{display:flex;flex-direction:column;min-width:0;}
            .pe-param-presets{display:flex;gap:6px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--pe-border-soft);}
            .pe-param-preset{flex:1;padding:6px 10px;font-family:inherit;font-size:11.5px;font-weight:500;color:var(--pe-text-muted);background:var(--pe-surface);border:1px solid var(--pe-border);border-radius:7px;cursor:pointer;}
            .pe-param-preset:hover{background:var(--pe-accent-soft);border-color:var(--pe-accent-border);color:var(--pe-accent);}
            .pe-param-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;min-width:0;}
            .pe-param-label{flex:0 0 130px;font-size:11.5px;font-weight:600;color:var(--pe-text-muted);padding-top:6px;}
            .pe-param-control{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px;max-width:100%;}
            .pe-param-input{width:100%;max-width:200px;padding:6px 8px;font-family:var(--pe-mono);font-size:12px;color:var(--pe-text);background:var(--pe-surface-2);border:1px solid var(--pe-border);border-radius:6px;outline:none;font-variant-numeric:tabular-nums;box-sizing:border-box;min-width:0;}
            .pe-param-input:focus{border-color:var(--pe-text-muted);background:var(--pe-surface);box-shadow:var(--pe-focus-ring);}
            select.pe-param-input{max-width:240px;font-family:var(--pe-font);}
            .pe-param-hint{font-size:10.5px;color:var(--pe-text-faint);line-height:1.4;overflow-wrap:anywhere;}
            .pe-param-row--full{flex-direction:column;align-items:stretch;gap:6px;min-width:0;}
            .pe-param-row--full .pe-param-label{flex:0 0 auto;padding-top:0;}
            .pe-param-row--full .pe-param-input{max-width:100%;}
            .pe-pop-list{max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;margin-top:8px;}
            .pe-pop-item{display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--pe-surface-code);border:1px solid var(--pe-border);border-radius:7px;font-size:11.5px;min-width:0;}
            .pe-pop-item__checkbox{display:inline-flex;align-items:center;cursor:pointer;flex-shrink:0;}
            .pe-pop-item__checkbox input{display:none;}
            .pe-pop-item__checkbox input:not(:checked) + .pe-checkbox{background:transparent;border-color:var(--pe-border-strong);}
            .pe-pop-item__checkbox input:not(:checked) + .pe-checkbox::after{display:none;}
            .pe-pop-item__meta{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;}
            .pe-pop-item__name{font-weight:500;color:var(--pe-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .pe-pop-item__size{font-size:10.5px;color:var(--pe-text-faint);font-variant-numeric:tabular-nums;}
            .pe-pop-item__remove{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:5px;color:var(--pe-text-faint);cursor:pointer;padding:0;flex-shrink:0;}
            .pe-pop-item__remove:hover{background:var(--pe-surface-2);color:var(--pe-error);}
            .pe-pop-item__remove svg{width:12px;height:12px;}
            .pe-pop-total{margin-top:10px;padding:8px 10px;background:var(--pe-surface-2);border-radius:7px;font-size:11px;color:var(--pe-text-muted);font-variant-numeric:tabular-nums;text-align:center;}
            .pe-pop-total.is-over{color:var(--pe-error);border:1px solid var(--pe-error);}
            .pe-pop-paste-name{width:100%;padding:8px 10px;font-family:var(--pe-mono);font-size:11.5px;color:var(--pe-text);background:var(--pe-surface);border:1px solid var(--pe-border);border-radius:7px;outline:none;box-sizing:border-box;min-width:0;max-width:100%;}
            .pe-toast{position:fixed;right:18px;bottom:18px;z-index:2147483647;max-width:360px;padding:11px 15px;font-family:var(--pe-font);font-size:13px;font-weight:500;color:var(--pe-text);background:var(--pe-surface);border:1px solid var(--pe-border-strong);border-left:3px solid var(--pe-text-muted);border-radius:var(--pe-radius);box-shadow:var(--pe-shadow-panel);word-break:break-word;pointer-events:none;}
            .pe-toast.is-error{border-left-color:var(--pe-error);}
            .pe-toast.is-success{border-left-color:var(--pe-success);}
            .pe-toast.has-action,.pe-toast.has-details{pointer-events:auto;}
            .pe-toast__row{display:flex;align-items:flex-start;gap:10px;}
            .pe-toast__msg{flex:1 1 auto;min-width:0;}
            .pe-toast__msg.is-multiline{display:flex;flex-direction:column;gap:3px;}
            .pe-toast__line--headline{font-weight:600;color:var(--pe-text);}
            .pe-toast__line--detail{font-weight:400;font-size:12px;color:var(--pe-text-muted);line-height:1.4;}
            .pe-toast__action{flex-shrink:0;padding:4px 10px;font-family:inherit;font-size:11.5px;font-weight:600;color:var(--pe-accent);background:var(--pe-accent-soft);border:1px solid var(--pe-accent-border);border-radius:6px;cursor:pointer;}
            .pe-toast__action:hover{background:var(--pe-accent);color:#fff;border-color:var(--pe-accent);}
            .pe-toast__details{margin-top:8px;font-size:10.5px;}
            .pe-toast__details summary{cursor:pointer;color:var(--pe-text-faint);font-weight:500;user-select:none;}
            .pe-toast__details pre{margin:6px 0 0;padding:8px 10px;background:var(--pe-surface-2);border:1px solid var(--pe-border);border-radius:6px;font-family:var(--pe-mono);font-size:10px;line-height:1.4;color:var(--pe-text-muted);white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;max-height:200px;overflow:auto;min-width:0;max-width:100%;}

            /* Settings modal */
            .pe-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2147483644;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;opacity:0;transition:opacity var(--pe-dur-base) ease;}
            .pe-modal-backdrop.is-open{opacity:1;}
            /* Fixed outer dimensions prevent tab content from resizing the dialog. */
            .pe-modal{position:relative;box-sizing:border-box;width:min(760px,100%);height:min(680px,calc(100vh - 32px));height:min(680px,calc(100dvh - 32px));max-width:100%;max-height:min(680px,calc(100vh - 32px));max-height:min(680px,calc(100dvh - 32px));min-height:0;margin:0;opacity:1;transform:scale(0.96);transition:transform var(--pe-dur-base) var(--pe-ease-spring);min-width:0;}
            .pe-modal-backdrop.is-open .pe-modal{transform:scale(1);}
            /* Scroll only the active tab content; keep header, tabs and footer fixed. */
            .pe-scope .pe-modal .pe-panel__body{flex:1 1 0;min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;}
            .pe-modal-tabs{display:flex;gap:2px;padding:0 12px;border-bottom:1px solid var(--pe-border);flex:0 0 auto;overflow-x:auto;scrollbar-width:none;}
            .pe-modal-tabs::-webkit-scrollbar{display:none;}
            .pe-modal-tab{padding:10px 14px;font-family:inherit;font-size:12.5px;font-weight:500;color:var(--pe-text-muted);background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;margin-bottom:-1px;transition:color var(--pe-dur-fast) ease,border-color var(--pe-dur-fast) ease;white-space:nowrap;}
            .pe-modal-tab:hover{color:var(--pe-text);}
            .pe-modal-tab.is-active{color:var(--pe-accent);border-bottom-color:var(--pe-accent);}
            .pe-settings-errors{margin-bottom:10px;}
            /* History */
            .pe-history-item{border:1px solid var(--pe-border);border-radius:var(--pe-radius);margin-bottom:8px;background:var(--pe-surface);overflow:hidden;min-width:0;}
            .pe-history-item:last-child{margin-bottom:0;}
            .pe-history-item__header{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;background:transparent;border:none;font-family:inherit;text-align:left;cursor:pointer;min-width:0;}
            .pe-history-item__header:hover{background:var(--pe-surface-2);}
            .pe-history-item__status{flex-shrink:0;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-size:11px;font-weight:700;background:var(--pe-surface-2);}
            .pe-history-item__status.is-success{color:var(--pe-success);}
            .pe-history-item__status.is-error{color:var(--pe-error);}
            .pe-history-item__status.is-aborted{color:#b45309;}
            .pe-history-item__main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px;}
            .pe-history-item__preview{font-size:12.5px;color:var(--pe-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .pe-history-item__meta{font-size:10.5px;color:var(--pe-text-faint);font-variant-numeric:tabular-nums;display:flex;flex-wrap:wrap;gap:4px;align-items:center;}
            .pe-history-item__chevron{width:14px;height:14px;flex-shrink:0;color:var(--pe-text-faint);transition:transform var(--pe-dur-base) var(--pe-ease-emph);}
            .pe-history-item.is-expanded .pe-history-item__chevron{transform:rotate(180deg);}
            .pe-history-item__details{display:none;padding:10px 12px;border-top:1px solid var(--pe-border);background:var(--pe-surface-code);min-width:0;}
            .pe-history-item.is-expanded .pe-history-item__details{display:block;}
            .pe-history-badge{display:inline-block;padding:1px 6px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--pe-text-muted);background:var(--pe-surface-2);border-radius:4px;margin-right:6px;}
            .pe-history-legacy-badge{display:inline-block;padding:1px 5px;font-size:9.5px;font-weight:600;color:var(--pe-text-faint);background:var(--pe-surface-3);border-radius:3px;margin-right:6px;}
            .pe-history-outcome{padding:1px 6px;border-radius:3px;font-weight:600;font-size:10px;}
            .pe-outcome-applied{color:var(--pe-success);background:rgba(16,163,127,.1);}
            .pe-outcome-cancelled{color:var(--pe-text-muted);background:var(--pe-surface-3);}
            .pe-outcome-error{color:var(--pe-error);background:rgba(209,69,59,.1);}
            .pe-outcome-aborted{color:#b45309;background:rgba(180,83,9,.1);}
            .pe-outcome-pending{color:var(--pe-accent);background:var(--pe-accent-soft);}
            .pe-history-section{margin-bottom:10px;min-width:0;}
            .pe-history-section:last-child{margin-bottom:0;}
            .pe-history-section__label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--pe-text-faint);margin-bottom:4px;}
            .pe-history-pre{margin:0;padding:8px 10px;background:var(--pe-surface-2);border:1px solid var(--pe-border);border-radius:6px;font-family:var(--pe-mono);font-size:11px;line-height:1.5;color:var(--pe-text-muted);white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;max-height:220px;overflow:auto;min-width:0;max-width:100%;}
            .pe-history-pre.is-error{background:rgba(209,69,59,0.06);border-color:rgba(209,69,59,0.3);color:var(--pe-error);}
            .pe-history-kv{font-size:12px;font-family:var(--pe-mono);color:var(--pe-text-muted);font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}
            .pe-history-empty{padding:24px;text-align:center;color:var(--pe-text-faint);font-size:12.5px;line-height:1.5;}
            .pe-history-call{border:1px solid var(--pe-border);border-radius:6px;margin-bottom:6px;background:var(--pe-surface);overflow:hidden;min-width:0;}
            .pe-history-call:last-child{margin-bottom:0;}
            .pe-history-call__header{display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;background:transparent;border:none;font-family:inherit;text-align:left;cursor:pointer;font-size:11.5px;min-width:0;}
            .pe-history-call__header:hover{background:var(--pe-surface-2);}
            .pe-history-call__status{flex-shrink:0;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-size:10px;font-weight:700;background:var(--pe-surface-2);}
            .pe-history-call__status.is-success{color:var(--pe-success);}
            .pe-history-call__status.is-error{color:var(--pe-error);}
            .pe-history-call__main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;}
            .pe-history-call__title{font-weight:500;color:var(--pe-text);}
            .pe-history-call__meta{font-size:10px;color:var(--pe-text-faint);font-variant-numeric:tabular-nums;}
            .pe-history-call__chevron{width:12px;height:12px;flex-shrink:0;color:var(--pe-text-faint);transition:transform var(--pe-dur-base) var(--pe-ease-emph);}
            .pe-history-call.is-expanded .pe-history-call__chevron{transform:rotate(180deg);}
            .pe-history-call__details{display:none;padding:8px 10px;border-top:1px solid var(--pe-border);background:var(--pe-surface-code);min-width:0;}
            .pe-history-call.is-expanded .pe-history-call__details{display:block;}
            .pe-context-info{padding:12px 14px;background:var(--pe-surface-2);border:1px solid var(--pe-border);border-radius:var(--pe-radius);margin-bottom:14px;}
            .pe-context-info__title{font-size:12.5px;font-weight:600;color:var(--pe-text);margin-bottom:4px;}
            .pe-context-info__text{font-size:12px;color:var(--pe-text-muted);font-variant-numeric:tabular-nums;margin-bottom:6px;}
            .pe-context-info__hint{font-size:11px;color:var(--pe-text-faint);line-height:1.4;margin-bottom:10px;}
            .pe-context-manage{padding:6px 12px;font-family:inherit;font-size:11.5px;font-weight:500;color:var(--pe-accent);background:var(--pe-accent-soft);border:1px solid var(--pe-accent-border);border-radius:7px;cursor:pointer;}
            .pe-context-manage:hover{background:var(--pe-accent);color:#fff;border-color:var(--pe-accent);}
            @media (max-width:720px){
                .pe-btn .pe-label{display:none;}
                .pe-btn{padding:7px 9px;}
                .pe-actionbar{padding:6px;}
                .pe-panel{margin:4px 4px 6px;max-height:min(65vh,460px);}
                .pe-panel__header{gap:8px;padding:10px 12px;}
                .pe-panel__header h4{font-size:12.5px;}
                .pe-prompt-base__meta{display:none;}
                .pe-q-content-inner{padding:0 12px 12px 12px;}
                .pe-code-textarea{min-height:88px;font-size:11px;}
                .pe-agents-popover{width:290px;}
                .pe-param-label{flex:0 0 100px;}
            }
            .pe-scope .pe-system-prompt{gap:14px;}
            .pe-scope .pe-system-prompt__intro{padding:2px 2px 0;}
            .pe-scope .pe-system-prompt__title{margin:0 0 4px;font-size:16px;line-height:1.35;font-weight:650;letter-spacing:-.01em;color:var(--pe-text);}
            .pe-scope .pe-system-prompt__description{margin:0;max-width:680px;font-size:12px;line-height:1.55;color:var(--pe-text-muted);}
            .pe-scope .pe-system-prompt__card{padding:16px;background:var(--pe-surface);border:1px solid var(--pe-border);border-radius:var(--pe-radius-lg);min-width:0;}
            .pe-scope .pe-system-prompt__editor-card{border-color:var(--pe-accent-border);box-shadow:0 1px 3px rgba(16,18,24,.04);}
            .pe-scope .pe-system-prompt__section-heading{margin-bottom:14px;}
            .pe-scope .pe-system-prompt__section-heading h6{margin:0;font-size:13px;font-weight:650;line-height:1.4;color:var(--pe-text);}
            .pe-scope .pe-system-prompt__section-heading p{margin:4px 0 0;font-size:11.5px;line-height:1.45;color:var(--pe-text-muted);}
            .pe-scope .pe-system-prompt__label{display:block;margin:0 0 6px;font-size:11.5px;font-weight:600;color:var(--pe-text-muted);}
            .pe-scope .pe-system-prompt__textarea{display:block;width:100%;min-height:230px;padding:12px 13px;font-family:var(--pe-mono);font-size:12px;line-height:1.6;tab-size:2;background:var(--pe-surface-code);border-color:var(--pe-border-strong);resize:vertical;}
            .pe-scope .pe-system-prompt__textarea:focus{border-color:var(--pe-accent);box-shadow:var(--pe-accent-ring);}
            .pe-scope .pe-system-prompt__textarea[aria-invalid="true"]{border-color:var(--pe-error);}
            .pe-scope .pe-system-prompt__meta{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-top:8px;min-width:0;}
            .pe-scope .pe-system-prompt__count{flex:0 0 auto;font-size:10.5px;font-variant-numeric:tabular-nums;color:var(--pe-text-faint);}
            .pe-scope .pe-system-prompt__feedback{flex:1 1 auto;min-width:0;text-align:right;font-size:11px;line-height:1.45;color:var(--pe-text-muted);overflow-wrap:anywhere;}
            .pe-scope .pe-system-prompt__feedback.is-error{color:var(--pe-error);font-weight:600;}
            .pe-scope .pe-system-prompt__feedback.is-warning{color:var(--pe-warning);}
            .pe-scope .pe-system-prompt__feedback.is-valid{color:var(--pe-success);}
            .pe-scope .pe-system-prompt__editor-controls{display:flex;justify-content:flex-end;margin-top:12px;padding-top:10px;border-top:1px solid var(--pe-border-soft);}
            .pe-scope .pe-system-prompt__preset-fields{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;}
            .pe-scope .pe-system-prompt__field{display:flex;flex-direction:column;align-items:stretch;min-width:0;}
            .pe-scope .pe-system-prompt__select,.pe-scope .pe-system-prompt__name{width:100%;max-width:none;min-height:36px;font-family:var(--pe-font);font-size:12px;}
            .pe-scope .pe-system-prompt__helper{margin:5px 0 0;font-size:10.5px;line-height:1.4;color:var(--pe-text-faint);}
            .pe-scope .pe-system-prompt__preset-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;padding-top:12px;border-top:1px solid var(--pe-border-soft);}
            .pe-scope .pe-system-prompt__preset-actions .pe-btn{min-height:32px;padding:6px 9px;font-size:11.5px;}
            .pe-scope .pe-system-prompt__preset-actions .pe-btn[disabled]{opacity:.42;cursor:not-allowed;}
            .pe-scope .pe-system-prompt__default{border:1px solid var(--pe-border);border-radius:var(--pe-radius);background:var(--pe-surface-2);overflow:hidden;}
            .pe-scope .pe-system-prompt__default summary{padding:11px 13px;font-size:11.5px;font-weight:600;color:var(--pe-text-muted);cursor:pointer;list-style-position:inside;}
            .pe-scope .pe-system-prompt__default summary:hover{color:var(--pe-text);}
            .pe-scope .pe-system-prompt__default[open] summary{border-bottom:1px solid var(--pe-border);}
            .pe-scope .pe-system-prompt__default .pe-system-prompt__helper{margin:12px 13px 8px;}
            .pe-scope .pe-system-prompt__default-textarea{display:block;width:calc(100% - 26px);max-width:none;min-height:120px;margin:0 13px 13px;padding:10px 11px;font-family:var(--pe-mono);font-size:11px;line-height:1.55;background:var(--pe-surface-code);color:var(--pe-text-muted);resize:vertical;}
            .pe-scope .pe-system-prompt__default-textarea:focus{border-color:var(--pe-border-strong);box-shadow:var(--pe-focus-ring);}
            .pe-scope .pe-system-prompt__default-textarea:read-only{cursor:text;}
            @media (max-width:600px){
                .pe-modal-backdrop{padding:12px;}
                .pe-modal{width:100%;height:min(680px,calc(100vh - 24px));height:min(680px,calc(100dvh - 24px));max-height:min(680px,calc(100vh - 24px));max-height:min(680px,calc(100dvh - 24px));}
            }
            .pe-scope .pe-modal .pe-panel__footer{justify-content:flex-end;gap:8px;}
            .pe-scope .pe-modal .pe-panel__footer .pe-btn:first-child{margin-right:auto;}
            .pe-scope .pe-modal .pe-panel__footer .pe-btn--primary{color:#fff;background:var(--pe-accent);border-color:var(--pe-accent);}
            .pe-scope .pe-modal .pe-panel__footer .pe-btn--primary:hover:not([disabled]){color:#fff;background:#3d5ce6;border-color:#3d5ce6;}
            .pe-scope .pe-modal .pe-panel__footer .pe-btn--primary .pe-ico{color:inherit;}
            @media (max-width:600px){
                .pe-scope .pe-system-prompt{gap:10px;}
                .pe-scope .pe-system-prompt__card{padding:12px;}
                .pe-scope .pe-system-prompt__textarea{min-height:190px;font-size:11px;}
                .pe-scope .pe-system-prompt__meta{flex-direction:column;gap:4px;}
                .pe-scope .pe-system-prompt__feedback{text-align:left;}
                .pe-scope .pe-system-prompt__preset-fields{grid-template-columns:minmax(0,1fr);}
                .pe-scope .pe-system-prompt__preset-actions .pe-btn{flex:1 1 calc(50% - 6px);justify-content:center;}
                .pe-scope .pe-modal .pe-panel__footer{padding:9px 10px;gap:5px;}
                .pe-scope .pe-modal .pe-panel__footer .pe-btn{padding:7px 8px;font-size:11px;}
            }
            @media (max-width:720px){
                .pe-scope .pe-system-prompt .pe-btn .pe-label,
                .pe-scope .pe-modal .pe-panel__footer .pe-btn .pe-label{display:inline-block;}
            }
        `);
    }

    const ICONS = {
        sparkles:`<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>`,
        guide:`<path d="M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01"/>`,
        undo:`<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-4"/>`,
        check:`<path d="M20 6L9 17l-5-5"/>`,
        x:`<path d="M18 6L6 18M6 6l12 12"/>`,
        loader:`<path d="M21 12a9 9 0 1 1-6.219-8.56"/>`,
        arrow:`<path d="M5 12h14M12 5l7 7-7 7"/>`,
        doc:`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>`,
        chevron:`<path d="M9 18l6-6-6-6"/>`,
        chevronD:`<path d="M6 9l6 6 6-6"/>`,
        codeSpark:`<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>`,
        paste:`<path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><path d="M14 3h7v7"/><path d="M10 14L21 3"/>`,
        clip:`<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48"/>`,
        copy:`<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`,
        trash:`<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>`,
        upload:`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>`,
        download:`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>`,
        alert:`<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>`,
        folder:`<path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"/>`,
        agentDoc:`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15l3-3 3 3"/>`,
        sliders:`<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>`,
        gear:`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`
    };

    const Atoms = {
        icon(name, extraClass = '') {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('width', '14');
            svg.setAttribute('height', '14');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '2');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('class', `pe-ico ${extraClass}`.trim());
            svg.innerHTML = ICONS[name] || '';
            return svg;
        },
        button({ icon, label, ariaLabel, variant = 'ghost', onClick }) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `pe-btn pe-btn--${variant}`;
            btn.setAttribute('aria-label', ariaLabel);
            btn.title = ariaLabel;
            btn.appendChild(Atoms.icon(icon));
            if (label) { const span = document.createElement('span'); span.className = 'pe-label'; span.textContent = label; btn.appendChild(span); }
            btn.addEventListener('pointerenter', () => Anim.hoverIn(btn));
            btn.addEventListener('pointerleave', () => Anim.hoverOut(btn));
            btn.addEventListener('pointerdown', () => Anim.press(btn));
            btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onClick?.(btn); });
            return btn;
        },
        buttonNode({ label, ariaLabel, variant = 'ghost', onClick }) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `pe-btn pe-btn--${variant}`;
            btn.setAttribute('aria-label', ariaLabel);
            btn.title = ariaLabel;
            if (label) { const span = document.createElement('span'); span.className = 'pe-label'; span.textContent = label; btn.appendChild(span); }
            btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onClick?.(btn); });
            return btn;
        }
    };

    function codeAttachment({ q, onUpdate } = {}) {
        const root = document.createElement('div');
        root.className = 'pe-code-wrap';
        const clip = document.createElement('div');
        clip.className = 'pe-code-clip';
        const area = document.createElement('div');
        area.className = 'pe-code-area';
        const actions = document.createElement('div');
        actions.className = 'pe-code-actions';
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button'; copyBtn.className = 'pe-code-action';
        copyBtn.innerHTML = `${Atoms.icon('copy').outerHTML}<span>Copiar</span>`;
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button'; clearBtn.className = 'pe-code-action';
        clearBtn.innerHTML = `${Atoms.icon('trash').outerHTML}<span>Limpar</span>`;
        actions.appendChild(copyBtn); actions.appendChild(clearBtn);
        const tabs = document.createElement('div');
        tabs.className = 'pe-code-tabs';
        const tabPaste = document.createElement('button');
        tabPaste.type = 'button'; tabPaste.className = 'pe-code-tab is-active';
        tabPaste.innerHTML = `${Atoms.icon('paste').outerHTML}<span>Colar trecho</span>`;
        const tabFile = document.createElement('button');
        tabFile.type = 'button'; tabFile.className = 'pe-code-tab';
        tabFile.innerHTML = `${Atoms.icon('clip').outerHTML}<span>Anexar arquivo</span>`;
        tabs.appendChild(tabPaste); tabs.appendChild(tabFile);
        const pastePane = document.createElement('div');
        pastePane.className = 'pe-code-pane';
        const ta = document.createElement('textarea');
        ta.className = 'pe-code-textarea';
        ta.placeholder = 'Cole a função ou o trecho onde ocorre o problema…';
        ta.rows = 4;
        const err = document.createElement('div');
        err.className = 'pe-code-error';
        err.innerHTML = `${Atoms.icon('alert').outerHTML}<span>Adicione pelo menos 3 caracteres para usar este contexto.</span>`;
        const footer = document.createElement('div');
        footer.className = 'pe-code-textarea-footer';
        const langSelect = document.createElement('select');
        langSelect.className = 'pe-code-lang';
        ['JavaScript','TypeScript','Python','Java','Go','Rust','C','C++','C#','PHP','Ruby','Swift','Kotlin','SQL','Shell','HTML','CSS','JSON','YAML','Outro'].forEach(lang => { const o = document.createElement('option'); o.textContent = lang; langSelect.appendChild(o); });
        const count = document.createElement('span');
        count.className = 'pe-code-count';
        count.textContent = '0 caracteres';
        footer.appendChild(langSelect); footer.appendChild(count);
        pastePane.appendChild(ta); pastePane.appendChild(err); pastePane.appendChild(footer);
        const filePane = document.createElement('div');
        filePane.className = 'pe-code-pane';
        filePane.hidden = true;
        const dropzone = document.createElement('div');
        dropzone.className = 'pe-dropzone';
        dropzone.innerHTML = `
            <span class="pe-dropzone__icon">${Atoms.icon('upload').outerHTML}</span>
            <span class="pe-dropzone__title">Arraste um arquivo ou escolha um abaixo</span>
            <span class="pe-dropzone__hint"><code>.js</code> <code>.ts</code> <code>.py</code> · máx ${Utils.formatBytes(CONFIG.MAX_FILE_SIZE)} · até ${CONFIG.MAX_FILE_COUNT} arquivos</span>
        `;
        const pickBtn = document.createElement('button');
        pickBtn.type = 'button'; pickBtn.className = 'pe-dropzone__btn';
        pickBtn.innerHTML = `${Atoms.icon('doc').outerHTML}<span>Escolher arquivo</span>`;
        dropzone.appendChild(pickBtn);
        const fileInput = document.createElement('input');
        fileInput.type = 'file'; fileInput.multiple = true;
        fileInput.accept = CONFIG.ACCEPTED_FILE_TYPES;
        fileInput.style.display = 'none';
        const fileList = document.createElement('div');
        fileList.className = 'pe-file-list';
        filePane.appendChild(dropzone); filePane.appendChild(fileInput); filePane.appendChild(fileList);
        area.appendChild(actions); area.appendChild(tabs); area.appendChild(pastePane); area.appendChild(filePane);
        clip.appendChild(area); root.appendChild(clip);
        const state = { mode: 'paste', codeText: '', language: 'JavaScript', files: [] };
        function emit() { onUpdate?.(); }
        function updateCount() {
            const n = ta.value.length;
            count.textContent = `${n} ${n === 1 ? 'caractere' : 'caracteres'}`;
            const hasError = n > 0 && n < 3;
            ta.classList.toggle('is-error', hasError);
            count.classList.toggle('is-error', hasError);
            err.classList.toggle('is-visible', hasError);
        }
        function setMode(mode) {
            state.mode = mode;
            tabPaste.classList.toggle('is-active', mode === 'paste');
            tabFile.classList.toggle('is-active', mode === 'file');
            pastePane.hidden = mode !== 'paste';
            filePane.hidden = mode !== 'file';
        }
        function renderFiles() {
            fileList.innerHTML = '';
            state.files.forEach((file, idx) => {
                const chip = document.createElement('div');
                chip.className = 'pe-file-chip';
                chip.innerHTML = `${Atoms.icon('doc').outerHTML}<span class="pe-file-chip__name" title="${Utils.escapeHtml(file.name)}">${Utils.escapeHtml(file.name)}</span><span class="pe-file-chip__size">${Utils.formatBytes(file.size)}</span>`;
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button'; removeBtn.className = 'pe-file-chip__remove';
                removeBtn.innerHTML = Atoms.icon('x').outerHTML;
                removeBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); state.files.splice(idx, 1); renderFiles(); emit(); });
                chip.appendChild(removeBtn);
                fileList.appendChild(chip);
            });
        }
        async function readFiles(fileListIn) {
            const incoming = Array.from(fileListIn);
            const remaining = CONFIG.MAX_FILE_COUNT - state.files.length;
            if (remaining <= 0) { Molecules.toast(`Máximo de ${CONFIG.MAX_FILE_COUNT} arquivos atingido.`, 'error'); return; }
            for (const file of incoming.slice(0, remaining)) {
                if (file.size > CONFIG.MAX_FILE_SIZE) { Molecules.toast(`"${file.name}" excede ${Utils.formatBytes(CONFIG.MAX_FILE_SIZE)}.`, 'error'); continue; }
                try {
                    const content = await file.text();
                    state.files.push({ name: file.name, size: file.size, content });
                    renderFiles();
                    const chips = fileList.querySelectorAll('.pe-file-chip');
                    if (chips.length) Anim.pulseSuccessClass(chips[chips.length - 1]);
                    emit();
                } catch (e) { Molecules.toast(`Falha ao ler "${file.name}".`, 'error'); }
            }
        }
        tabPaste.addEventListener('click', () => setMode('paste'));
        tabFile.addEventListener('click', () => setMode('file'));
        ta.addEventListener('input', () => { state.codeText = ta.value; updateCount(); emit(); });
        langSelect.addEventListener('change', () => { state.language = langSelect.value; emit(); });
        copyBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const txt = state.mode === 'paste' ? ta.value : ''; if (!txt) return; try { ta.select(); document.execCommand('copy'); } catch (_) {} const lbl = copyBtn.querySelector('span'); if (lbl) { const old = lbl.textContent; lbl.textContent = 'Copiado!'; setTimeout(() => { lbl.textContent = old; }, 1200); } });
        clearBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); state.codeText = ''; state.files = []; ta.value = ''; renderFiles(); updateCount(); emit(); });
        pickBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fileInput.click(); });
        dropzone.addEventListener('click', (e) => { if (e.target.closest('.pe-dropzone__btn')) return; fileInput.click(); });
        fileInput.addEventListener('change', (e) => { readFiles(e.target.files); fileInput.value = ''; });
        ['dragenter', 'dragover'].forEach(evt => { dropzone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); }); });
        dropzone.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer?.files?.length) readFiles(e.dataTransfer.files); });
        return {
            root, show() { root.classList.add('is-visible'); }, hide() { root.classList.remove('is-visible'); },
            getValue() {
                const pasted = state.codeText.trim();
                if (!pasted && !state.files.length) return null;
                let combined = pasted;
                for (const f of state.files) combined += (combined ? '\n\n' : '') + `// --- arquivo: ${f.name} ---\n${f.content}`;
                return { code: combined, language: state.language, files: state.files.map(f => ({ name: f.name, size: f.size })) };
            },
            clear() { state.codeText = ''; state.files = []; ta.value = ''; renderFiles(); updateCount(); setMode('paste'); emit(); }
        };
    }

    function contextPopover({ anchor, onChange } = {}) {
        const root = document.createElement('div');
        root.className = 'pe-agents-popover pe-scope';
        root.setAttribute('role', 'dialog');
        root.hidden = true;
        const fileInput = document.createElement('input');
        fileInput.type = 'file'; fileInput.accept = CONFIG.CONTEXT_FILE_ACCEPT; fileInput.style.display = 'none';
        root.appendChild(fileInput);
        const head = document.createElement('div');
        head.className = 'pe-pop-head';
        head.innerHTML = `<span class="pe-pop-head-title">${Atoms.icon('agentDoc').outerHTML}<span>Contexto do projeto</span></span>`;
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button'; closeBtn.className = 'pe-pop-close';
        closeBtn.innerHTML = Atoms.icon('x').outerHTML;
        closeBtn.addEventListener('click', () => close());
        head.appendChild(closeBtn); root.appendChild(head);
        const body = document.createElement('div');
        body.className = 'pe-pop-body'; root.appendChild(body);
        const foot = document.createElement('div');
        foot.className = 'pe-pop-foot'; foot.hidden = true; root.appendChild(foot);
        let isOpen = false;
        function renderEmpty() {
            foot.hidden = true; body.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.className = 'pe-pop-empty';
            wrap.innerHTML = `<div class="pe-pop-empty-title">Nenhum arquivo de contexto carregado</div><div class="pe-pop-empty-hint">Aceita <code>.md</code> <code>.txt</code> · máx ${Utils.formatBytes(CONFIG.MAX_CONTEXT_FILE_SIZE)} por arquivo<br>Nomes comuns: ${Utils.escapeHtml(CONFIG.CONTEXT_KNOWN_NAMES.join(' · '))}</div><div class="pe-pop-divider"></div>`;
            const loadBtn = document.createElement('button');
            loadBtn.type = 'button'; loadBtn.className = 'pe-pop-action';
            loadBtn.innerHTML = `${Atoms.icon('upload').outerHTML}<span class="pe-pop-action-body"><span class="pe-pop-action-title">Carregar arquivo</span><span class="pe-pop-action-hint">Selecione um arquivo de contexto</span></span>`;
            loadBtn.addEventListener('click', () => fileInput.click());
            const pasteBtn = document.createElement('button');
            pasteBtn.type = 'button'; pasteBtn.className = 'pe-pop-action';
            pasteBtn.innerHTML = `${Atoms.icon('paste').outerHTML}<span class="pe-pop-action-body"><span class="pe-pop-action-title">Colar conteúdo</span><span class="pe-pop-action-hint">Cole o conteúdo diretamente</span></span>`;
            pasteBtn.addEventListener('click', () => renderPaste());
            wrap.appendChild(loadBtn); wrap.appendChild(pasteBtn);
            body.appendChild(wrap);
        }
        function renderList() {
            foot.hidden = false; body.innerHTML = '';
            const files = ProjectContext.list();
            const total = ProjectContext.getTotalSize();
            const masterLabel = document.createElement('label');
            masterLabel.className = 'pe-pop-toggle';
            masterLabel.innerHTML = `<input type="checkbox" ${ProjectContext.isEnabled() ? 'checked' : ''}><span class="pe-pop-toggle-switch"></span><span class="pe-pop-toggle-label"><strong>Ativar injeção de contexto</strong><br>Anexar ao system prompt</span>`;
            masterLabel.querySelector('input').addEventListener('change', (e) => { ProjectContext.setEnabled(e.target.checked); onChange?.(); refresh(); });
            body.appendChild(masterLabel);
            const list = document.createElement('div');
            list.className = 'pe-pop-list';
            files.forEach(f => {
                const item = document.createElement('div');
                item.className = 'pe-pop-item';
                if (!f.enabled) item.style.opacity = '0.65';
                const cbLabel = document.createElement('label');
                cbLabel.className = 'pe-pop-item__checkbox';
                cbLabel.innerHTML = `<input type="checkbox" ${f.enabled ? 'checked' : ''}><span class="pe-checkbox"></span>`;
                cbLabel.querySelector('input').addEventListener('change', (e) => { ProjectContext.toggle(f.id, e.target.checked); onChange?.(); refresh(); });
                const meta = document.createElement('div');
                meta.className = 'pe-pop-item__meta';
                meta.innerHTML = `<span class="pe-pop-item__name" title="${Utils.escapeHtml(f.path || f.name)}">${Utils.escapeHtml(f.name)}</span><span class="pe-pop-item__size">${Utils.formatBytes(f.size || f.content.length)}${f.source === 'legacy' ? ' · legado' : ''}</span>`;
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button'; removeBtn.className = 'pe-pop-item__remove';
                removeBtn.innerHTML = Atoms.icon('x').outerHTML;
                removeBtn.addEventListener('click', () => { ProjectContext.remove(f.id); onChange?.(); refresh(); });
                item.appendChild(cbLabel); item.appendChild(meta); item.appendChild(removeBtn);
                list.appendChild(item);
            });
            body.appendChild(list);
            const totalEl = document.createElement('div');
            totalEl.className = 'pe-pop-total' + (total > CONFIG.MAX_CONTEXT_TOTAL_SIZE ? ' is-over' : '');
            const activeCount = files.filter(f => f.enabled).length;
            totalEl.textContent = `${activeCount} ativo${activeCount === 1 ? '' : 's'} · ${Utils.formatBytes(total)} / ${Utils.formatBytes(CONFIG.MAX_CONTEXT_TOTAL_SIZE)}`;
            body.appendChild(totalEl);
            foot.innerHTML = '';
            const addBtn = document.createElement('button');
            addBtn.type = 'button'; addBtn.className = 'pe-pop-foot-btn';
            addBtn.innerHTML = `${Atoms.icon('upload').outerHTML}<span>Adicionar</span>`;
            addBtn.addEventListener('click', () => fileInput.click());
            const exportBtn = document.createElement('button');
            exportBtn.type = 'button'; exportBtn.className = 'pe-pop-foot-btn';
            exportBtn.innerHTML = `${Atoms.icon('download').outerHTML}<span>Exportar</span>`;
            exportBtn.addEventListener('click', () => {
                try {
                    const payload = { files: ProjectContext.list(), exportedAt: new Date().toISOString() };
                    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `pe-context-${Date.now()}.json`;
                    document.body.appendChild(a); a.click(); a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (e) { Molecules.toast('Falha ao exportar contexto.', 'error'); }
            });
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button'; clearBtn.className = 'pe-pop-foot-btn danger';
            clearBtn.innerHTML = `${Atoms.icon('trash').outerHTML}<span>Limpar</span>`;
            clearBtn.addEventListener('click', () => { ProjectContext.clearAll(); Molecules.toast('Arquivos de contexto removidos.', 'info'); onChange?.(); refresh(); });
            foot.appendChild(addBtn); foot.appendChild(exportBtn); foot.appendChild(clearBtn);
        }
        function renderPaste() {
            foot.hidden = true; body.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.className = 'pe-pop-paste';
            const nameInput = document.createElement('input');
            nameInput.type = 'text'; nameInput.className = 'pe-pop-paste-name';
            nameInput.placeholder = 'Nome do arquivo (ex: AGENTS.md)'; nameInput.value = 'AGENTS.md';
            const ta = document.createElement('textarea');
            ta.className = 'pe-pop-paste-textarea'; ta.rows = 6;
            ta.placeholder = '# AGENTS.md\n\nCole aqui o conteúdo…';
            const actions = document.createElement('div');
            actions.className = 'pe-pop-paste-actions';
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button'; cancelBtn.textContent = 'Cancelar';
            cancelBtn.addEventListener('click', () => { if (ProjectContext.list().length) renderList(); else renderEmpty(); });
            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button'; confirmBtn.className = 'primary';
            confirmBtn.textContent = 'Adicionar'; confirmBtn.disabled = true;
            ta.addEventListener('input', () => { confirmBtn.disabled = ta.value.trim().length < 3; });
            confirmBtn.addEventListener('click', () => {
                const v = ta.value.trim();
                if (v.length < 3) return;
                const res = ProjectContext.add({ name: nameInput.value.trim() || 'AGENTS.md', content: v, source: 'manual' });
                if (!res.ok) { if (res.reason === 'total-too-large') Molecules.toast(`Total excede ${Utils.formatBytes(CONFIG.MAX_CONTEXT_TOTAL_SIZE)}.`, 'error'); else Molecules.toast('Falha ao adicionar.', 'error'); return; }
                Molecules.toast('Arquivo adicionado.', 'success'); onChange?.(); renderList();
            });
            actions.appendChild(cancelBtn); actions.appendChild(confirmBtn);
            wrap.appendChild(nameInput); wrap.appendChild(ta); wrap.appendChild(actions);
            body.appendChild(wrap);
            setTimeout(() => ta.focus(), 60);
        }
        function refresh() { if (!isOpen) return; if (ProjectContext.list().length) renderList(); else renderEmpty(); }
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0]; fileInput.value = '';
            if (!file) return;
            if (file.size > CONFIG.MAX_CONTEXT_FILE_SIZE) { Molecules.toast(`"${file.name}" excede ${Utils.formatBytes(CONFIG.MAX_CONTEXT_FILE_SIZE)}.`, 'error'); return; }
            try {
                const text = await file.text();
                const res = ProjectContext.add({ name: file.name || 'AGENTS.md', content: text, source: 'manual' });
                if (!res.ok) { Molecules.toast('Falha ao adicionar arquivo.', 'error'); return; }
                Molecules.toast('Arquivo adicionado.', 'success'); onChange?.(); refresh();
            } catch (err) { Molecules.toast(`Falha ao ler "${file.name}".`, 'error'); }
        });
        function positionNearAnchor() {
            if (!anchor || !document.body.contains(anchor)) return;
            const rect = anchor.getBoundingClientRect();
            const gap = 8, margin = 12;
            const width = Math.min(320, window.innerWidth - margin * 2);
            root.style.width = width + 'px';
            let left = rect.left;
            if (left + width + margin > window.innerWidth) left = window.innerWidth - width - margin;
            if (left < margin) left = margin;
            const bottom = window.innerHeight - rect.top + gap;
            root.style.left = left + 'px';
            root.style.bottom = bottom + 'px';
            root.style.top = 'auto';
        }
        function open() { if (isOpen) return; isOpen = true; root.hidden = false; positionNearAnchor(); void root.offsetWidth; root.classList.add('is-open'); refresh(); }
        function close() { if (!isOpen) return; isOpen = false; root.classList.remove('is-open'); setTimeout(() => { if (!isOpen) root.hidden = true; }, 220); }
        function toggle() { if (isOpen) close(); else open(); }
        document.addEventListener('pointerdown', (e) => { if (!isOpen) return; if (root.contains(e.target)) return; if (anchor && anchor.contains(e.target)) return; close(); }, true);
        document.addEventListener('keydown', (e) => { if (!isOpen) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } }, true);
        window.addEventListener('scroll', () => { if (isOpen) positionNearAnchor(); }, { passive: true, capture: true });
        window.addEventListener('resize', () => { if (isOpen) positionNearAnchor(); }, { passive: true });
        document.body.appendChild(root);
        return { root, open, close, toggle, refresh, destroy() { root.remove(); } };
    }

    const State = {
        activeInput: null, activeComposer: null, previousText: null,
        isProcessing: false, isGuiding: false, preview: null, wizard: null,
        _currentRequest: null, pendingAbort: null, lastError: null,
        params: null, paramsDraft: null,
        stream: { active: false, startedAt: 0, firstTokenAt: 0, tokenCount: 0, lastTokenAt: 0, observedTokS: 0, fullText: '' }
    };

    // ===== Settings Modal (Histórico + Parâmetros + Contexto/Idioma + System prompt) =====
    function settingsModal({ initialTab = 'params', onSave, onClose } = {}) {
        const previouslyFocused = document.activeElement;
        const draft = { ...ParamSchema.defaults(), ...(State.params || ParamSchema.load()) };
        let systemPromptDraft;
        try {
            systemPromptDraft = SystemPromptManager.load();
        } catch (error) {
            systemPromptDraft = SystemPromptManager.defaultConfig();
            console.error('[PE] Falha ao carregar o system prompt:', error);
            Molecules.toast('Não foi possível carregar o system prompt salvo. Redefina-o ou tente novamente.', 'error', { details: error.message });
        }
        let activeTab = initialTab;
        let selectedSystemPreset = '';
        let closed = false;

        const backdrop = document.createElement('div');
        backdrop.className = 'pe-modal-backdrop pe-scope';

        const panel = document.createElement('div');
        panel.className = 'pe-panel pe-modal';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-label', 'Configurações');

        const header = document.createElement('div');
        header.className = 'pe-panel__header';
        const h4 = document.createElement('h4');
        h4.textContent = 'Configurações';
        header.appendChild(h4);
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'pe-panel__close';
        closeBtn.setAttribute('aria-label', 'Fechar');
        closeBtn.appendChild(Atoms.icon('x'));
        closeBtn.addEventListener('click', close);
        header.appendChild(closeBtn);
        panel.appendChild(header);

        const tabsBar = document.createElement('div');
        tabsBar.className = 'pe-modal-tabs';
        tabsBar.setAttribute('role', 'tablist');
        tabsBar.setAttribute('aria-label', 'Abas de configurações');
        const tabDefs = [
            { key: 'params', label: 'Parâmetros' },
            { key: 'context', label: 'Contexto & Idioma' },
            { key: 'systemPrompt', label: 'System prompt' },
            { key: 'history', label: 'Histórico' }
        ];
        const tabButtons = {};
        tabDefs.forEach(t => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'pe-modal-tab';
            b.textContent = t.label;
            b.id = `pe-settings-tab-${t.key}`;
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-controls', 'pe-settings-panel-body');
            b.addEventListener('click', () => { if (activeTab !== t.key) { activeTab = t.key; render(); } });
            tabsBar.appendChild(b);
            tabButtons[t.key] = b;
        });
        panel.appendChild(tabsBar);

        const bodyEl = document.createElement('div');
        bodyEl.className = 'pe-panel__body';
        bodyEl.id = 'pe-settings-panel-body';
        bodyEl.setAttribute('role', 'tabpanel');
        bodyEl.tabIndex = 0;
        panel.appendChild(bodyEl);

        const footerEl = document.createElement('div');
        footerEl.className = 'pe-panel__footer';
        panel.appendChild(footerEl);

        backdrop.appendChild(panel);
        document.body.appendChild(backdrop);
        Utils.shieldFromHost(panel);

        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
            if (e.key === 'Tab') {
                const focusable = [...panel.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
                    .filter(el => el.getClientRects().length);
                if (!focusable.length) { e.preventDefault(); panel.focus(); return; }
                const first = focusable[0], last = focusable[focusable.length - 1];
                if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
            } else if (e.target.closest('[role="tab"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                e.preventDefault();
                const keys = tabDefs.map(tab => tab.key);
                const current = keys.indexOf(activeTab);
                const next = e.key === 'Home' ? 0 : e.key === 'End' ? keys.length - 1 : (current + (e.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length;
                activeTab = keys[next];
                render();
                tabButtons[activeTab].focus();
            }
        };
        const onBackdropClick = (e) => { if (e.target === backdrop) close(); };
        document.addEventListener('keydown', onKey, true);
        backdrop.addEventListener('click', onBackdropClick);

        requestAnimationFrame(() => { backdrop.classList.add('is-open'); closeBtn.focus(); });

        function close() {
            if (closed) return;
            closed = true;
            document.removeEventListener('keydown', onKey, true);
            backdrop.removeEventListener('click', onBackdropClick);
            backdrop.classList.remove('is-open');
            setTimeout(() => {
                backdrop.remove();
                if (previouslyFocused?.isConnected) previouslyFocused.focus();
            }, 220);
            try { onClose?.(); } catch (_) {}
        }

        function applyAndClose() {
            const cleaned = ParamSchema.clean(draft);
            const errors = ParamSchema.validate(cleaned);
            errors.push(...SystemPromptManager.validatePrompt(systemPromptDraft.prompt).errors);
            if (errors.length) { showErrors(errors); return; }
            try {
                systemPromptDraft = SystemPromptManager.save(systemPromptDraft);
            } catch (error) {
                Molecules.toast('Não foi possível salvar o system prompt.', 'error', { details: error.message });
                return;
            }
            ParamSchema.save(cleaned);
            State.params = cleaned;
            try { GM_setValue('pe_params_configured', true); } catch (_) {}
            Molecules.toast('Configurações salvas.', 'success');
            try { onSave?.(cleaned); } catch (_) {}
            close();
        }

        function showErrors(errors) {
            const existing = bodyEl.querySelector('.pe-settings-errors');
            if (existing) existing.remove();
            const box = document.createElement('div');
            box.className = 'pe-settings-errors';
            errors.forEach(err => {
                const el = document.createElement('div');
                el.className = 'pe-panel-error';
                el.textContent = err;
                box.appendChild(el);
            });
            bodyEl.insertBefore(box, bodyEl.firstChild);
            Anim.shake(panel);
        }

        function persistSystemPromptPresets(presets) {
            const config = SystemPromptManager.load();
            config.presets = presets;
            const saved = SystemPromptManager.save(config);
            systemPromptDraft.presets = saved.presets;
        }

        function render() {
            Object.entries(tabButtons).forEach(([k, b]) => {
                const selected = k === activeTab;
                b.classList.toggle('is-active', selected);
                b.setAttribute('aria-selected', String(selected));
                b.tabIndex = selected ? 0 : -1;
            });
            bodyEl.setAttribute('aria-labelledby', `pe-settings-tab-${activeTab}`);
            bodyEl.innerHTML = '';
            bodyEl.scrollTop = 0;
            footerEl.innerHTML = '';
            if (activeTab === 'params') renderParams();
            else if (activeTab === 'context') renderContext();
            else if (activeTab === 'systemPrompt') renderSystemPrompt();
            else renderHistory();
        }

        function renderParams() {
            const form = document.createElement('div');
            form.className = 'pe-param-body';
            const presetsRow = document.createElement('div');
            presetsRow.className = 'pe-param-presets';
            ParamSchema.PRESETS.forEach(p => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'pe-param-preset';
                b.textContent = p.label;
                b.addEventListener('click', () => {
                    Object.assign(draft, p.values);
                    ParamSchema.SCHEMA.filter(f => f.type === 'number').forEach(f => {
                        const inp = form.querySelector(`#pe-param-${f.key}`);
                        if (inp) inp.value = draft[f.key] == null ? '' : String(draft[f.key]);
                    });
                });
                presetsRow.appendChild(b);
            });
            form.appendChild(presetsRow);

            ParamSchema.SCHEMA.filter(f => f.type === 'number').forEach(f => {
                const row = document.createElement('div');
                row.className = 'pe-param-row';
                row.innerHTML = `<label class="pe-param-label" for="pe-param-${f.key}">${Utils.escapeHtml(f.label)}</label><div class="pe-param-control"><input type="number" id="pe-param-${f.key}" class="pe-param-input" min="${f.min}" max="${f.max}" step="${f.step}" value="${draft[f.key] == null ? '' : String(draft[f.key])}" placeholder="${f.default == null ? '—' : f.default}">${f.hint ? `<div class="pe-param-hint">${Utils.escapeHtml(f.hint)}</div>` : ''}</div>`;
                form.appendChild(row);
                row.querySelector('input').addEventListener('input', (e) => { const v = e.target.value.trim(); draft[f.key] = v === '' ? null : Number(v); });
            });

            bodyEl.appendChild(form);
            const cancelBtn = Atoms.button({ icon: 'x', label: 'Cancelar', ariaLabel: 'Cancelar', variant: 'outline', onClick: close });
            const saveBtn = Atoms.button({ icon: 'check', label: 'Salvar', ariaLabel: 'Salvar', variant: 'primary', onClick: applyAndClose });
            footerEl.appendChild(cancelBtn);
            footerEl.appendChild(saveBtn);
        }

        function renderContext() {
            const form = document.createElement('div');
            form.className = 'pe-param-body';

            const infoBox = document.createElement('div');
            infoBox.className = 'pe-context-info';
            const activeFiles = ProjectContext.list().filter(f => f.enabled);
            infoBox.innerHTML = `<div class="pe-context-info__title">Contexto do projeto</div><div class="pe-context-info__text">${activeFiles.length} arquivo(s) ativo(s) · ${Utils.formatBytes(ProjectContext.getTotalSize())} · ${ProjectContext.isEnabled() ? 'injeção ON' : 'injeção OFF'}</div><div class="pe-context-info__hint">Anexado automaticamente ao final do system prompt (quando ativado).</div>`;
            const manageBtn = document.createElement('button');
            manageBtn.type = 'button';
            manageBtn.className = 'pe-context-manage';
            manageBtn.textContent = 'Gerenciar arquivos';
            manageBtn.addEventListener('click', () => { close(); setTimeout(() => State.activeComposer?.actionbar?.contextBtn?.click(), 250); });
            infoBox.appendChild(manageBtn);
            form.appendChild(infoBox);

            ['response_language', 'response_persona'].forEach(key => {
                const f = ParamSchema.SCHEMA.find(x => x.key === key);
                const row = document.createElement('div');
                row.className = 'pe-param-row';
                const opts = f.options.map(o => `<option value="${o.value}" ${draft[key] === o.value ? 'selected' : ''}>${Utils.escapeHtml(o.label)}</option>`).join('');
                row.innerHTML = `<label class="pe-param-label" for="pe-param-${key}">${Utils.escapeHtml(f.label)}</label><div class="pe-param-control"><select id="pe-param-${key}" class="pe-param-input">${opts}</select><div class="pe-param-hint">${Utils.escapeHtml(f.hint)}</div></div>`;
                form.appendChild(row);
                row.querySelector('select').addEventListener('change', (e) => { draft[key] = e.target.value; });
            });

            bodyEl.appendChild(form);
            const cancelBtn = Atoms.button({ icon: 'x', label: 'Cancelar', ariaLabel: 'Cancelar', variant: 'outline', onClick: close });
            const saveBtn = Atoms.button({ icon: 'check', label: 'Salvar', ariaLabel: 'Salvar', variant: 'primary', onClick: applyAndClose });
            footerEl.appendChild(cancelBtn);
            footerEl.appendChild(saveBtn);
        }

        function renderSystemPrompt() {
            const form = document.createElement('div');
            form.className = 'pe-param-body pe-system-prompt';

            const intro = document.createElement('div');
            intro.className = 'pe-system-prompt__intro';
            const title = document.createElement('h5');
            title.className = 'pe-system-prompt__title';
            title.textContent = 'Instruções de aprimoramento';
            const description = document.createElement('p');
            description.className = 'pe-system-prompt__description';
            description.textContent = 'Complementa o aprimoramento direto e o fluxo guiado. Contexto do projeto, idioma e personalidade são configurados separadamente.';
            intro.append(title, description);
            form.appendChild(intro);

            const editorCard = document.createElement('section');
            editorCard.className = 'pe-system-prompt__card pe-system-prompt__editor-card';
            editorCard.setAttribute('aria-labelledby', 'pe-system-prompt-heading');
            const editorHeading = document.createElement('div');
            editorHeading.className = 'pe-system-prompt__section-heading';
            const editorTitle = document.createElement('h6');
            editorTitle.id = 'pe-system-prompt-heading';
            editorTitle.textContent = 'Prompt ativo';
            const editorHint = document.createElement('p');
            editorHint.textContent = 'Edite as instruções usadas pelo script.';
            editorHeading.append(editorTitle, editorHint);

            const editorLabel = document.createElement('label');
            editorLabel.className = 'pe-system-prompt__label';
            editorLabel.htmlFor = 'pe-system-prompt-editor';
            editorLabel.textContent = 'Conteúdo do system prompt';
            const editor = document.createElement('textarea');
            editor.id = 'pe-system-prompt-editor';
            editor.className = 'pe-textarea pe-system-prompt__textarea';
            editor.rows = 12;
            editor.maxLength = SystemPromptManager.MAX_LENGTH;
            editor.value = systemPromptDraft.prompt;
            editor.setAttribute('aria-describedby', 'pe-system-prompt-feedback pe-system-prompt-count');
            const count = document.createElement('div');
            count.id = 'pe-system-prompt-count';
            count.className = 'pe-system-prompt__count';
            const feedback = document.createElement('div');
            feedback.id = 'pe-system-prompt-feedback';
            feedback.className = 'pe-system-prompt__feedback';
            feedback.setAttribute('role', 'status');
            feedback.setAttribute('aria-live', 'polite');
            const updateValidation = () => {
                const result = SystemPromptManager.validatePrompt(systemPromptDraft.prompt);
                count.textContent = `${result.charCount.toLocaleString('pt-BR')} / ${SystemPromptManager.MAX_LENGTH.toLocaleString('pt-BR')} caracteres`;
                const state = result.errors.length ? 'error' : (result.warnings.length ? 'warning' : 'valid');
                feedback.className = `pe-system-prompt__feedback is-${state}`;
                editor.setAttribute('aria-invalid', String(result.errors.length > 0));
                feedback.textContent = result.errors.length
                    ? result.errors.join(' ')
                    : (result.warnings.length ? result.warnings.join(' ') : 'Prompt válido.');
            };
            editor.addEventListener('input', () => {
                systemPromptDraft.prompt = editor.value;
                updateValidation();
            });
            const editorMeta = document.createElement('div');
            editorMeta.className = 'pe-system-prompt__meta';
            editorMeta.append(count, feedback);
            const editorControls = document.createElement('div');
            editorControls.className = 'pe-system-prompt__editor-controls';

            const resetBtn = Atoms.button({
                icon: 'undo', label: 'Redefinir para o padrão', ariaLabel: 'Redefinir para o system prompt padrão',
                variant: 'outline', onClick: () => {
                    systemPromptDraft.prompt = CONFIG.SYSTEM_PROMPT;
                    editor.value = systemPromptDraft.prompt;
                    updateValidation();
                    Molecules.toast('Prompt padrão restaurado no editor. Salve para aplicar.', 'info');
                }
            });
            editorControls.appendChild(resetBtn);
            editorCard.append(editorHeading, editorLabel, editor, editorMeta, editorControls);
            form.appendChild(editorCard);

            const presetCard = document.createElement('section');
            presetCard.className = 'pe-system-prompt__card pe-system-prompt__presets';
            presetCard.setAttribute('aria-labelledby', 'pe-system-presets-heading');
            const presetHeading = document.createElement('div');
            presetHeading.className = 'pe-system-prompt__section-heading';
            const presetTitle = document.createElement('h6');
            presetTitle.id = 'pe-system-presets-heading';
            presetTitle.textContent = 'Presets pessoais';
            const presetHint = document.createElement('p');
            presetHint.textContent = `Guarde até ${SystemPromptManager.MAX_PRESETS} versões para reutilizar. As alterações são persistidas ao salvar as configurações.`;
            presetHeading.append(presetTitle, presetHint);

            const presetSelectLabel = document.createElement('label');
            presetSelectLabel.className = 'pe-system-prompt__label';
            presetSelectLabel.htmlFor = 'pe-system-preset-select';
            presetSelectLabel.textContent = 'Preset salvo';
            const presetSelect = document.createElement('select');
            presetSelect.id = 'pe-system-preset-select';
            presetSelect.className = 'pe-param-input pe-system-prompt__select';
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Selecione um preset';
            presetSelect.appendChild(emptyOption);
            systemPromptDraft.presets.forEach((preset) => {
                const option = document.createElement('option');
                option.value = preset.name;
                option.textContent = preset.name;
                presetSelect.appendChild(option);
            });
            if (systemPromptDraft.presets.some(preset => preset.name === selectedSystemPreset)) {
                presetSelect.value = selectedSystemPreset;
            } else {
                selectedSystemPreset = '';
            }

            const presetNameLabel = document.createElement('label');
            presetNameLabel.className = 'pe-system-prompt__label';
            presetNameLabel.htmlFor = 'pe-system-preset-name';
            presetNameLabel.textContent = 'Nome do preset';
            const presetName = document.createElement('input');
            presetName.id = 'pe-system-preset-name';
            presetName.className = 'pe-param-input pe-system-prompt__name';
            presetName.type = 'text';
            presetName.maxLength = SystemPromptManager.MAX_PRESET_NAME;
            presetName.autocomplete = 'off';
            presetName.placeholder = 'Ex.: Revisão de código';
            presetName.setAttribute('aria-describedby', 'pe-system-preset-name-hint');
            presetName.value = presetSelect.value;
            const presetNameHint = document.createElement('div');
            presetNameHint.id = 'pe-system-preset-name-hint';
            presetNameHint.className = 'pe-system-prompt__helper';
            presetNameHint.textContent = 'Use um nome novo para criar ou o nome selecionado para atualizar.';
            presetSelect.addEventListener('change', () => {
                selectedSystemPreset = presetSelect.value;
                presetName.value = presetSelect.value;
                const hasSelection = Boolean(presetSelect.value);
                loadPresetBtn.disabled = !hasSelection;
                renamePresetBtn.disabled = !hasSelection;
                deletePresetBtn.disabled = !hasSelection;
            });

            const presetFields = document.createElement('div');
            presetFields.className = 'pe-system-prompt__preset-fields';
            const selectField = document.createElement('div');
            selectField.className = 'pe-system-prompt__field';
            selectField.append(presetSelectLabel, presetSelect);
            const nameField = document.createElement('div');
            nameField.className = 'pe-system-prompt__field';
            nameField.append(presetNameLabel, presetName, presetNameHint);
            presetFields.append(selectField, nameField);

            const presetActions = document.createElement('div');
            presetActions.className = 'pe-system-prompt__preset-actions';
            const loadPresetBtn = Atoms.button({ icon: 'check', label: 'Carregar', ariaLabel: 'Carregar preset selecionado', variant: 'outline', onClick: () => {
                const selected = systemPromptDraft.presets.find(p => p.name === presetSelect.value);
                if (!selected) { Molecules.toast('Selecione um preset para carregar.', 'error'); return; }
                systemPromptDraft.prompt = selected.prompt;
                editor.value = selected.prompt;
                updateValidation();
                Molecules.toast(`Preset "${selected.name}" carregado. Salve para aplicar.`, 'success');
                editor.focus();
            }});
            const savePresetBtn = Atoms.button({ icon: 'check', label: 'Salvar preset', ariaLabel: 'Salvar ou atualizar preset', variant: 'outline', onClick: () => {
                const name = presetName.value.trim();
                const check = SystemPromptManager.validatePrompt(systemPromptDraft.prompt);
                if (check.errors.length) { Molecules.toast(check.errors.join(' '), 'error'); editor.focus(); return; }
                if (!name || name.length > SystemPromptManager.MAX_PRESET_NAME) {
                    Molecules.toast(`Informe um nome de até ${SystemPromptManager.MAX_PRESET_NAME} caracteres.`, 'error');
                    presetName.focus();
                    return;
                }
                const existing = systemPromptDraft.presets.find(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase());
                if (existing && !confirm(`O preset "${existing.name}" já existe. Substituí-lo?`)) return;
                if (!existing && systemPromptDraft.presets.length >= SystemPromptManager.MAX_PRESETS) {
                    Molecules.toast(`Limite de ${SystemPromptManager.MAX_PRESETS} presets atingido.`, 'error');
                    return;
                }
                const presets = systemPromptDraft.presets.map(preset => ({ ...preset }));
                const existingPreset = presets.find(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase());
                if (existingPreset) { existingPreset.name = name; existingPreset.prompt = systemPromptDraft.prompt; }
                else presets.push({ name, prompt: systemPromptDraft.prompt });
                try {
                    persistSystemPromptPresets(presets);
                } catch (error) {
                    Molecules.toast('Não foi possível salvar o preset.', 'error', { details: error.message });
                    return;
                }
                selectedSystemPreset = name;
                render();
                Molecules.toast(`Preset "${name}" salvo.`, 'success');
            }});
            const renamePresetBtn = Atoms.button({ icon: 'doc', label: 'Renomear', ariaLabel: 'Renomear preset selecionado', variant: 'outline', onClick: () => {
                const selectedIndex = systemPromptDraft.presets.findIndex(p => p.name === presetSelect.value);
                const name = presetName.value.trim();
                if (selectedIndex < 0) { Molecules.toast('Selecione um preset para renomear.', 'error'); return; }
                if (!name || name.length > SystemPromptManager.MAX_PRESET_NAME) { Molecules.toast(`Informe um nome de até ${SystemPromptManager.MAX_PRESET_NAME} caracteres.`, 'error'); return; }
                const duplicateIndex = systemPromptDraft.presets.findIndex((p, i) => i !== selectedIndex && p.name.toLocaleLowerCase() === name.toLocaleLowerCase());
                const presets = systemPromptDraft.presets.map(preset => ({ ...preset }));
                if (duplicateIndex >= 0) {
                    if (!confirm(`O preset "${systemPromptDraft.presets[duplicateIndex].name}" já existe. Substituí-lo e excluir o preset renomeado?`)) return;
                    presets.splice(duplicateIndex, 1);
                    const adjustedIndex = selectedIndex > duplicateIndex ? selectedIndex - 1 : selectedIndex;
                    presets.splice(adjustedIndex, 1, { name, prompt: presets[adjustedIndex].prompt });
                } else {
                    presets[selectedIndex].name = name;
                }
                try {
                    persistSystemPromptPresets(presets);
                } catch (error) {
                    Molecules.toast('Não foi possível renomear o preset.', 'error', { details: error.message });
                    return;
                }
                selectedSystemPreset = name;
                render();
                Molecules.toast('Preset renomeado.', 'success');
            }});
            const deletePresetBtn = Atoms.button({ icon: 'trash', label: 'Excluir', ariaLabel: 'Excluir preset selecionado', variant: 'outline', onClick: () => {
                const selectedIndex = systemPromptDraft.presets.findIndex(p => p.name === presetSelect.value);
                if (selectedIndex < 0) { Molecules.toast('Selecione um preset para excluir.', 'error'); return; }
                const name = systemPromptDraft.presets[selectedIndex].name;
                if (!confirm(`Excluir o preset "${name}"?`)) return;
                const presets = systemPromptDraft.presets.map(preset => ({ ...preset }));
                presets.splice(selectedIndex, 1);
                try {
                    persistSystemPromptPresets(presets);
                } catch (error) {
                    Molecules.toast('Não foi possível excluir o preset.', 'error', { details: error.message });
                    return;
                }
                selectedSystemPreset = '';
                render();
                Molecules.toast('Preset excluído.', 'success');
            }});
            [loadPresetBtn, savePresetBtn, renamePresetBtn, deletePresetBtn].forEach(button => presetActions.appendChild(button));
            const hasSelection = Boolean(presetSelect.value);
            loadPresetBtn.disabled = !hasSelection;
            renamePresetBtn.disabled = !hasSelection;
            deletePresetBtn.disabled = !hasSelection;
            presetCard.append(presetHeading, presetFields, presetActions);
            form.appendChild(presetCard);

            const defaultDetails = document.createElement('details');
            defaultDetails.className = 'pe-system-prompt__default';
            const defaultSummary = document.createElement('summary');
            defaultSummary.textContent = 'Ver prompt padrão original';
            const defaultDescription = document.createElement('p');
            defaultDescription.className = 'pe-system-prompt__helper';
            defaultDescription.textContent = 'Referência somente leitura; redefinir copia este conteúdo para o editor.';
            const defaultEditor = document.createElement('textarea');
            defaultEditor.id = 'pe-system-prompt-default';
            defaultEditor.className = 'pe-textarea pe-system-prompt__default-textarea';
            defaultEditor.rows = 6;
            defaultEditor.readOnly = true;
            defaultEditor.setAttribute('aria-label', 'System prompt padrão original do script, somente leitura');
            defaultEditor.value = CONFIG.SYSTEM_PROMPT;
            defaultDetails.append(defaultSummary, defaultDescription, defaultEditor);
            form.appendChild(defaultDetails);

            bodyEl.appendChild(form);
            updateValidation();
            const cancelBtn = Atoms.button({ icon: 'x', label: 'Cancelar', ariaLabel: 'Cancelar', variant: 'outline', onClick: close });
            const testBtn = Atoms.button({ icon: 'check', label: 'Testar localmente', ariaLabel: 'Validar e simular o system prompt localmente', variant: 'outline', onClick: () => {
                const result = SystemPromptManager.simulate(systemPromptDraft.prompt);
                if (!result.ok) {
                    feedback.className = 'pe-system-prompt__feedback is-error';
                    feedback.textContent = result.errors.join(' ') || result.message;
                    Molecules.toast(result.errors.join(' ') || result.message, 'error');
                    Anim.shake(editor);
                    return;
                }
                feedback.className = `pe-system-prompt__feedback is-${result.warnings.length ? 'warning' : 'valid'}`;
                feedback.textContent = [result.message, ...result.warnings].join(' ');
                Molecules.toast(result.message, 'success');
            }});
            const saveBtn = Atoms.button({ icon: 'check', label: 'Salvar', ariaLabel: 'Salvar system prompt e configurações', variant: 'primary', onClick: applyAndClose });
            footerEl.appendChild(cancelBtn);
            footerEl.appendChild(testBtn);
            footerEl.appendChild(saveBtn);
        }

        function renderHistory() {
            const runs = EnhancementHistory.listRuns();
            if (!runs.length) {
                bodyEl.innerHTML = '<div class="pe-history-empty">Nenhuma execução registrada ainda. Cada execução (Aprimorar ou Guiado) aparecerá aqui com suas chamadas à API aninhadas.</div>';
                const closeBtn = Atoms.button({ icon: 'x', label: 'Fechar', ariaLabel: 'Fechar', variant: 'primary', onClick: close });
                footerEl.appendChild(closeBtn);
                return;
            }
            const container = document.createElement('div');
            const statusIconMap = { success: '✓', error: '✗', aborted: '⏸', pending: '○' };
            const outcomeLabels = { applied: 'Aplicado', cancelled: 'Cancelado', error: 'Erro', aborted: 'Abortado', pending: 'Pendente' };
            runs.forEach((run) => {
                const card = document.createElement('div');
                card.className = 'pe-history-item';

                const header = document.createElement('button');
                header.type = 'button';
                header.className = 'pe-history-item__header';
                header.setAttribute('aria-expanded', 'false');

                const statusIcon = statusIconMap[run.status] || '○';
                const statusClass = run.status === 'success' ? 'is-success' : run.status === 'error' ? 'is-error' : run.status === 'aborted' ? 'is-aborted' : '';
                const typeBadge = run.type === 'guided' ? 'Guiado' : 'Aprimorar';
                const preview = Utils.truncate(run.input || '', 100);
                const time = new Date(run.startedAt).toLocaleString('pt-BR');
                const dur = run.durationMs >= 1000 ? `${(run.durationMs / 1000).toFixed(2)}s` : `${run.durationMs}ms`;
                const callsCount = (run.calls && run.calls.length) || 0;
                const outcomeLabel = outcomeLabels[run.outcome] || run.outcome || '—';
                const outcomeClass = `pe-outcome-${run.outcome || 'pending'}`;
                const legacyBadge = run.meta && run.meta.legacy ? '<span class="pe-history-legacy-badge">legado</span>' : '';

                header.innerHTML = `
                    <span class="pe-history-item__status ${statusClass}">${statusIcon}</span>
                    <span class="pe-history-item__main">
                        <span class="pe-history-item__preview">
                            <span class="pe-history-badge">${Utils.escapeHtml(typeBadge)}</span>${legacyBadge}
                            ${Utils.escapeHtml(preview)}
                        </span>
                        <span class="pe-history-item__meta">
                            <span>${Utils.escapeHtml(time)}</span>
                            <span>· ${dur}</span>
                            <span>· ${callsCount} chamada(s)</span>
                            <span class="pe-history-outcome ${outcomeClass}">${Utils.escapeHtml(outcomeLabel)}</span>
                        </span>
                    </span>
                    <span class="pe-history-item__chevron">${Atoms.icon('chevronD').outerHTML}</span>
                `;
                header.addEventListener('click', () => {
                    const isExpanded = card.classList.toggle('is-expanded');
                    header.setAttribute('aria-expanded', String(isExpanded));
                });
                card.appendChild(header);

                const details = document.createElement('div');
                details.className = 'pe-history-item__details';

                const addSection = (label, content, opts = {}) => {
                    const sec = document.createElement('div');
                    sec.className = 'pe-history-section';
                    const lbl = document.createElement('div');
                    lbl.className = 'pe-history-section__label';
                    lbl.textContent = label;
                    sec.appendChild(lbl);
                    if (opts.isKV) {
                        const kv = document.createElement('div');
                        kv.className = 'pe-history-kv';
                        kv.textContent = content;
                        sec.appendChild(kv);
                    } else {
                        const pre = document.createElement('pre');
                        pre.className = 'pe-history-pre' + (opts.isError ? ' is-error' : '');
                        pre.textContent = content;
                        sec.appendChild(pre);
                    }
                    details.appendChild(sec);
                };

                addSection('Entrada', run.input || '(vazio)');

                const ctx = run.contextInfo;
                if (ctx && (ctx.activeCount || ctx.totalBytes || ctx.enabled)) {
                    addSection('Contexto', `${ctx.activeCount || 0} arquivo(s) · ${Utils.formatBytes(ctx.totalBytes || 0)} · ${ctx.enabled ? 'injeção ON' : 'injeção OFF'}`, { isKV: true });
                } else {
                    addSection('Contexto', '—', { isKV: true });
                }

                addSection('Parâmetros', JSON.stringify(run.params || {}, null, 2));

                if (run.error) {
                    addSection('Resultado final — Erro', JSON.stringify(run.error, null, 2), { isError: true });
                } else if (run.output) {
                    addSection('Resultado final', run.output);
                } else {
                    addSection('Resultado final', '(sem saída)', { isKV: true });
                }

                if (run.calls && run.calls.length) {
                    const callsLabel = document.createElement('div');
                    callsLabel.className = 'pe-history-section__label';
                    callsLabel.textContent = `Chamadas à API (${run.calls.length})`;
                    details.appendChild(callsLabel);

                    run.calls.forEach((call) => {
                        const callEl = document.createElement('div');
                        callEl.className = 'pe-history-call';
                        const callHeader = document.createElement('button');
                        callHeader.type = 'button';
                        callHeader.className = 'pe-history-call__header';
                        callHeader.setAttribute('aria-expanded', 'false');

                        const callStatus = call.error ? 'is-error' : 'is-success';
                        const callStatusIcon = call.error ? '✗' : '✓';
                        const callDur = call.durationMs >= 1000 ? `${(call.durationMs / 1000).toFixed(2)}s` : `${call.durationMs}ms`;
                        const kindLabel = call.kind === 'questions' ? 'Perguntas' : call.kind === 'enhance-with-answers' ? 'Aprimorar c/ respostas' : 'Principal';
                        const retryTag = call.retryOf ? ' · retry' : '';
                        const streamTag = call.streamUsed ? ' · stream' : '';
                        const fbTag = call.fallbackUsed ? ' · fallback' : '';

                        callHeader.innerHTML = `
                            <span class="pe-history-call__status ${callStatus}">${callStatusIcon}</span>
                            <span class="pe-history-call__main">
                                <span class="pe-history-call__title">${Utils.escapeHtml(kindLabel)} · tentativa ${call.attempt}${retryTag}</span>
                                <span class="pe-history-call__meta">${callDur}${streamTag}${fbTag}</span>
                            </span>
                            <span class="pe-history-call__chevron">${Atoms.icon('chevronD').outerHTML}</span>
                        `;
                        callHeader.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const isExp = callEl.classList.toggle('is-expanded');
                            callHeader.setAttribute('aria-expanded', String(isExp));
                        });
                        callEl.appendChild(callHeader);

                        const callDetails = document.createElement('div');
                        callDetails.className = 'pe-history-call__details';

                        const addCallSection = (label, content, opts = {}) => {
                            const sec = document.createElement('div');
                            sec.className = 'pe-history-section';
                            const lbl = document.createElement('div');
                            lbl.className = 'pe-history-section__label';
                            lbl.textContent = label;
                            sec.appendChild(lbl);
                            if (opts.isKV) {
                                const kv = document.createElement('div');
                                kv.className = 'pe-history-kv';
                                kv.textContent = content;
                                sec.appendChild(kv);
                            } else {
                                const pre = document.createElement('pre');
                                pre.className = 'pe-history-pre' + (opts.isError ? ' is-error' : '');
                                pre.textContent = content;
                                sec.appendChild(pre);
                            }
                            callDetails.appendChild(sec);
                        };

                        if (call.payload) {
                            if (call.payload.system) addCallSection('System prompt', call.payload.system);
                            if (call.payload.messages && call.payload.messages.length) addCallSection('Mensagens', JSON.stringify(call.payload.messages, null, 2));
                            if (call.payload.params) addCallSection('Parâmetros', JSON.stringify(call.payload.params, null, 2));
                            if (call.payload.meta) addCallSection('Metadados', JSON.stringify(call.payload.meta, null, 2));
                        }
                        if (call.output) addCallSection('Saída', call.output);
                        else addCallSection('Saída', '(vazio)', { isKV: true });
                        if (call.error) addCallSection('Erro', JSON.stringify(call.error, null, 2), { isError: true });

                        callEl.appendChild(callDetails);
                        details.appendChild(callEl);
                    });
                }

                card.appendChild(details);
                container.appendChild(card);
            });
            bodyEl.appendChild(container);

            const clearBtn = Atoms.button({ icon: 'trash', label: 'Limpar histórico', ariaLabel: 'Limpar histórico', variant: 'outline', onClick: () => {
                if (confirm('Limpar todo o histórico de aprimoramentos?')) { EnhancementHistory.clear(); render(); }
            }});
            const closeBtn = Atoms.button({ icon: 'x', label: 'Fechar', ariaLabel: 'Fechar', variant: 'primary', onClick: close });
            footerEl.appendChild(clearBtn);
            footerEl.appendChild(closeBtn);
        }

        render();
        return { close };
    }

    // ===== wireOverlayToEvents (shared) =====
    function wireOverlayToEvents(overlay) {
        let isFirstMeta = true;
        return (evt) => {
            if (!evt || !evt.type) return;
            switch (evt.type) {
                case '__meta':
                    if (evt.meta) overlay.setMeta(evt.meta);
                    if (isFirstMeta) {
                        isFirstMeta = false;
                        if (evt.meta) overlay.logEvent('dispatch', `· ${evt.meta.payloadKB.toFixed(1)} KB · tentativa ${evt.meta.attempt}`);
                    } else {
                        const att = evt.meta ? evt.meta.attempt : 1;
                        overlay.logEvent('redispatch', `· tentativa ${att}`, 'ok');
                        overlay.setState('connecting');
                    }
                    break;
                case 'first_byte':
                    overlay.setState('waiting');
                    overlay.logEvent('first_byte', `· HTTP ${evt.status || 200}`, 'ok');
                    overlay.setMetric('status', String(evt.status || 200), 'ok');
                    if (evt.bytes != null) overlay.setMetric('bytes', evt.bytes + ' B');
                    break;
                case 'first_token':
                    overlay.setState('streaming');
                    overlay.logEvent('first_token', '', 'ok');
                    break;
                case 'token':
                    overlay.attachStream({ tokens: evt.count });
                    break;
                case 'stream_done':
                    overlay.setState('finalizing');
                    overlay.logEvent('stream_done', evt.tokens != null ? `· ${evt.tokens} tok` : '', 'ok');
                    break;
                case 'retry': {
                    const nextAttempt = (evt.attempt || 0) + 1;
                    const total = CONFIG.RETRY_MAX + 1;
                    overlay.setState('retrying', { attempt: nextAttempt, total, backoffMs: evt.delayMs });
                    overlay.logEvent('retry_sched', `· backoff ${(evt.delayMs / 1000).toFixed(1)}s`, 'warn');
                    overlay.setMetric('attempt', `${nextAttempt} / ${total}`, 'warn');
                    overlay.setMetric('retry', `backoff ${(evt.delayMs / 1000).toFixed(1)}s`, 'warn');
                    overlay.setMetric('status', '—', 'muted');
                    overlay.setMetric('bytes', '0 B');
                    break;
                }
                case 'warning':
                    overlay.warn(evt.code);
                    break;
                case 'fallback':
                    overlay.setState('waiting');
                    overlay.note('Fallback para resposta completa');
                    break;
                case 'error':
                    overlay.logEvent('error', `· ${evt.code}`, 'err');
                    break;
            }
        };
    }

    const Molecules = {
        codeAttachment, contextPopover, settingsModal,

        actionBar({ onEnhance, onGuided, onUndo, onParams, onSettings }) {
            const bar = document.createElement('div');
            bar.className = 'pe-actionbar';
            bar.setAttribute('role', 'toolbar');
            bar.setAttribute('aria-label', 'Ações do prompt');

            const enhanceBtn = Atoms.button({ icon: 'sparkles', label: 'Aprimorar', ariaLabel: 'Aprimorar prompt com Kilo Code', variant: 'primary', onClick: () => onEnhance(enhanceBtn) });
            const guidedBtn = Atoms.button({ icon: 'guide', label: 'Guiado', ariaLabel: 'Iniciar aprimoramento guiado', variant: 'outline', onClick: () => onGuided(guidedBtn) });
            const contextBtn = Atoms.button({ icon: 'agentDoc', label: 'Contexto', ariaLabel: 'Gerenciar arquivos de contexto', variant: 'ghost', onClick: () => contextPopoverInst?.toggle() });
            contextBtn.classList.add('pe-btn--agents');
            contextBtn.appendChild(Object.assign(document.createElement('span'), { className: 'pe-status-dot' }));

            let contextPopoverInst = Molecules.contextPopover({ anchor: contextBtn, onChange: () => refreshContextBtn() });
            function refreshContextBtn() {
                const active = ProjectContext.list().filter(f => f.enabled);
                const has = active.length > 0 && ProjectContext.isEnabled();
                contextBtn.classList.toggle('is-loaded', has);
                const lbl = contextBtn.querySelector('.pe-label');
                if (lbl) {
                    if (!has) lbl.textContent = 'Contexto';
                    else if (active.length === 1) lbl.textContent = active[0].name;
                    else lbl.textContent = `Contexto (${active.length})`;
                }
            }
            refreshContextBtn();

            const paramsBtn = Atoms.button({ icon: 'sliders', label: 'Parâmetros', ariaLabel: 'Configurar parâmetros de geração', variant: 'ghost', onClick: () => onParams?.(paramsBtn) });
            const settingsBtn = Atoms.button({ icon: 'gear', label: 'Config', ariaLabel: 'Abrir configurações (histórico, parâmetros, contexto)', variant: 'ghost', onClick: () => onSettings?.(settingsBtn) });
            const undoBtn = Atoms.button({ icon: 'undo', label: 'Desfazer', ariaLabel: 'Desfazer último aprimoramento', variant: 'ghost', onClick: () => onUndo() });
            undoBtn.disabled = true;

            bar.appendChild(enhanceBtn);
            bar.appendChild(guidedBtn);
            bar.appendChild(contextBtn);
            bar.appendChild(paramsBtn);
            bar.appendChild(settingsBtn);
            bar.appendChild(undoBtn);

            return {
                root: bar, enhanceBtn, guidedBtn, contextBtn, paramsBtn, settingsBtn,
                setBusy(isBusy) {
                    enhanceBtn.disabled = isBusy;
                    enhanceBtn.replaceChildren(Atoms.icon(isBusy ? 'loader' : 'sparkles', isBusy ? 'pe-spin' : ''));
                    const lbl = Object.assign(document.createElement('span'), { className: 'pe-label', textContent: isBusy ? 'Aprimorando…' : 'Aprimorar' });
                    enhanceBtn.appendChild(lbl);
                    enhanceBtn.setAttribute('aria-busy', String(!!isBusy));
                    enhanceBtn.classList.toggle('is-loading', !!isBusy);
                },
                setGuidedBusy(isBusy, customLabel) {
                    guidedBtn.disabled = isBusy;
                    guidedBtn.replaceChildren(Atoms.icon(isBusy ? 'loader' : 'guide', isBusy ? 'pe-spin' : ''));
                    const lbl = Object.assign(document.createElement('span'), { className: 'pe-label', textContent: customLabel || (isBusy ? 'Analisando…' : 'Guiado') });
                    guidedBtn.appendChild(lbl);
                    guidedBtn.setAttribute('aria-busy', String(!!isBusy));
                    guidedBtn.classList.toggle('is-loading', !!isBusy);
                },
                setUndoEnabled(enabled) { undoBtn.disabled = !enabled; },
                refreshContextBtn, refreshAgentsBtn: refreshContextBtn,
                destroy() { try { contextPopoverInst?.destroy?.(); } catch (_) {} }
            };
        },

        loadingOverlay({ text = '', subtext = '' } = {}) {
            const root = document.createElement('div');
            root.className = 'pe-panel-loading pe-scope';
            root.setAttribute('role', 'status');
            root.setAttribute('aria-live', 'polite');
            root.dataset.state = 'connecting';

            root.innerHTML = `
                <div class="pe-panel-loading__card">
                    <div class="pe-panel-loading__halo" aria-hidden="true"></div>
                    <div class="pe-panel-loading__top">
                        <div class="pe-gear-wrap"><canvas data-gear width="48" height="48"></canvas></div>
                    </div>
                    <div class="pe-panel-loading__body">
                        <div class="pe-panel-loading__title-wrap">
                            <div class="pe-panel-loading__title" data-title>Conectando</div>
                        </div>
                        <div class="pe-panel-loading__sub-wrap">
                            <div class="pe-panel-loading__sub" data-sub>
                                <span data-subtext>Estabelecendo conexão</span>
                                <span class="pe-dots" aria-hidden="true" data-dots><span></span><span></span><span></span></span>
                                <span class="pe-token-pill" data-tokpill hidden>0 tok</span>
                                <span class="pe-retry-pill" data-retrypill hidden></span>
                            </div>
                        </div>
                    </div>
                    <div class="pe-shimmer" aria-hidden="true"></div>
                    <div class="pe-panel-loading__meta">
                        <div class="pe-panel-loading__meta-l">
                            <span class="pe-time">
                                <span class="pe-time__label">decorrido</span>
                                <span data-elapsed>0.0s</span>
                            </span>
                        </div>
                        <div class="pe-panel-loading__meta-r">
                            <button type="button" class="pe-debug-toggle" aria-expanded="false" data-dtoggle>
                                <span>detalhes</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <button type="button" class="pe-cancel" data-cancel>Cancelar</button>
                        </div>
                    </div>
                    <div class="pe-debug" data-dpanel>
                        <div class="pe-debug__clip">
                            <div class="pe-debug__inner">
                                <div class="pe-debug__grid" data-dgrid></div>
                                <div class="pe-debug__log" data-dlog></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const titleEl = root.querySelector('[data-title]');
            const subtextEl = root.querySelector('[data-subtext]');
            const dotsEl = root.querySelector('[data-dots]');
            const tokPill = root.querySelector('[data-tokpill]');
            const retryPill = root.querySelector('[data-retrypill]');
            const elapsedEl = root.querySelector('[data-elapsed]');
            const debugToggle = root.querySelector('[data-dtoggle]');
            const debugPanel = root.querySelector('[data-dpanel]');
            const debugGrid = root.querySelector('[data-dgrid]');
            const debugLog = root.querySelector('[data-dlog]');
            const cancelBtn = root.querySelector('[data-cancel]');
            const gearCanvas = root.querySelector('[data-gear]');

            const METRIC_DEFS = [
                ['model', 'Modelo'], ['endpoint', 'Endpoint'],
                ['stream', 'Stream'], ['timeout', 'Timeout'],
                ['payload', 'Payload'], ['attempt', 'Tentativa'],
                ['status', 'Status'], ['bytes', 'Bytes'],
                ['first_token', '1º token'], ['tokens', 'Tokens'],
                ['rate', 'Taxa'], ['retry', 'Retry']
            ];
            const metricEls = {};
            METRIC_DEFS.forEach(([key, label]) => {
                const row = document.createElement('div');
                row.className = 'pe-debug__row';
                const k = document.createElement('span');
                k.className = 'pe-debug__key';
                k.textContent = label;
                const v = document.createElement('span');
                v.className = 'pe-debug__val is-muted';
                v.textContent = '—';
                row.appendChild(k); row.appendChild(v);
                debugGrid.appendChild(row);
                metricEls[key] = v;
            });

            const STATE_LABELS = {
                connecting: { title: 'Conectando', sub: 'Estabelecendo conexão' },
                waiting: { title: 'Aguardando dados', sub: 'Nenhum byte recebido ainda' },
                streaming: { title: 'Recebendo conteúdo', sub: 'Tokens chegando' },
                finalizing: { title: 'Processando resultado', sub: 'Preparando saída' },
                retrying: { title: 'Retentando', sub: 'Falha de rede · backoff' }
            };
            const PHASE_TO_STATE = {
                routing: 'connecting', connecting: 'connecting',
                waiting: 'waiting', streaming: 'streaming',
                finalizing: 'finalizing', retrying: 'retrying'
            };

            let startedAt = 0;
            let timer = null;
            let cancelFn = null;
            let firstTokenAt = 0;
            let tokenCount = 0;
            let gear = null;
            const events = [];
            let currentState = 'connecting';

            function tick() {
                if (!startedAt) return;
                const elapsed = (Date.now() - startedAt) / 1000;
                elapsedEl.textContent = elapsed >= 60
                    ? `${Math.floor(elapsed / 60)}m${Math.round(elapsed % 60)}s`
                    : elapsed.toFixed(1) + 's';
            }
            function startTimer() { if (timer) return; startedAt = Date.now(); timer = setInterval(tick, 100); tick(); }
            function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

            function applyStateLabels(state, opts = {}) {
                const labels = STATE_LABELS[state] || STATE_LABELS.connecting;
                let title = labels.title;
                let sub = labels.sub;
                if (state === 'retrying' && opts.backoffMs != null) {
                    sub = `Falha de rede · backoff ${(opts.backoffMs / 1000).toFixed(1)}s`;
                }
                if (titleEl.textContent !== title) {
                    titleEl.classList.add('is-swapping');
                    setTimeout(() => {
                        titleEl.textContent = title;
                        titleEl.classList.remove('is-swapping');
                    }, 180);
                } else {
                    titleEl.textContent = title;
                }
                if (subtextEl.textContent !== sub) {
                    subtextEl.classList.add('is-swapping');
                    setTimeout(() => {
                        subtextEl.textContent = sub;
                        subtextEl.classList.remove('is-swapping');
                    }, 180);
                } else {
                    subtextEl.textContent = sub;
                }
                dotsEl.hidden = (state === 'streaming' || state === 'retrying');
                retryPill.hidden = (state !== 'retrying');
                if (state === 'retrying') {
                    const total = (opts.total != null) ? opts.total : (CONFIG.RETRY_MAX + 1);
                    const att = (opts.attempt != null) ? opts.attempt : 2;
                    retryPill.textContent = `tentativa ${att} / ${total}`;
                }
                if (state !== 'streaming' && state !== 'finalizing') tokPill.hidden = true;
            }

            function setState(state, opts = {}) {
                const s = PHASE_TO_STATE[state] || state;
                if (!STATE_LABELS[s]) return;
                currentState = s;
                root.dataset.state = s;
                if (gear) gear.setState(s);
                applyStateLabels(s, opts);
                if (s === 'streaming' && !firstTokenAt) {
                    firstTokenAt = Date.now();
                    if (startedAt) setMetric('first_token', ((firstTokenAt - startedAt) / 1000).toFixed(1) + 's', 'accent');
                }
            }

            function setMetric(key, val, tone = '') {
                const el = metricEls[key];
                if (!el) return;
                el.textContent = val;
                el.className = 'pe-debug__val' + (tone ? ' is-' + tone : '');
            }

            function logEvent(kind, detail = '', tone = '') {
                const t = startedAt ? (Date.now() - startedAt) / 1000 : 0;
                let cls = '';
                if (tone === 'err' || kind === 'error') cls = 'is-err';
                else if (tone === 'warn' || kind === 'retry_sched' || kind === 'warning') cls = 'is-warn';
                else if (tone === 'ok' || kind === 'first_byte' || kind === 'first_token' || kind === 'stream_done' || kind === 'redispatch') cls = 'is-ok';
                events.push({ t, kind, detail, cls });
                if (events.length > 12) events.shift();
                debugLog.innerHTML = events.map(ev => `<div class="pe-debug__log-line ${ev.cls}"><span class="pe-debug__log-time">${ev.t.toFixed(1)}s</span><span class="pe-debug__log-ev">${Utils.escapeHtml(ev.kind)}</span>${ev.detail ? `<span class="pe-debug__log-detail">${Utils.escapeHtml(ev.detail)}</span>` : ''}</div>`).join('');
                debugLog.scrollTop = debugLog.scrollHeight;
            }

            function ensureGear() {
                if (gear || !gearCanvas) return;
                gear = createGear(gearCanvas, currentState);
            }

            function show() {
                if (!root.classList.contains('is-active')) {
                    root.classList.add('is-active');
                }
                ensureGear();
                startTimer();
                applyStateLabels(currentState);
            }

            function hide() {
                stopTimer();
                root.classList.remove('is-active');
                if (gear) { gear.destroy(); gear = null; }
            }

            debugToggle.addEventListener('click', () => {
                const open = debugToggle.getAttribute('aria-expanded') === 'true';
                debugToggle.setAttribute('aria-expanded', String(!open));
                debugPanel.classList.toggle('is-open', !open);
            });

            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (cancelBtn.disabled) return;
                cancelBtn.textContent = 'Cancelando…';
                cancelBtn.disabled = true;
                try { if (cancelFn) cancelFn(); else KiloApi.abort(); } catch (_) {}
            });

            return {
                root,
                show,
                hide,
                setState,
                setPhase(p) { setState(PHASE_TO_STATE[p] || p); },
                setMetric,
                setMeta(meta) {
                    if (!meta) return;
                    if (meta.model) setMetric('model', meta.model);
                    if (meta.endpoint) {
                        const short = String(meta.endpoint).replace(/^https?:\/\//, '').replace(/\/.*$/, '/…');
                        setMetric('endpoint', short);
                    }
                    if (meta.stream != null) setMetric('stream', meta.stream ? 'ON' : 'OFF', meta.stream ? 'accent' : '');
                    if (meta.timeoutMs) setMetric('timeout', (meta.timeoutMs / 1000).toFixed(0) + 's');
                    if (meta.payloadKB) setMetric('payload', meta.payloadKB.toFixed(1) + ' KB');
                    if (meta.attempt != null) {
                        const total = CONFIG.RETRY_MAX + 1;
                        setMetric('attempt', `${meta.attempt} / ${total}`, meta.attempt > 1 ? 'warn' : '');
                    }
                },
                logEvent,
                attachStream({ tokens = 0, tokS = 0 } = {}) {
                    tokenCount = tokens;
                    if (!firstTokenAt && tokens > 0) firstTokenAt = Date.now();
                    if (tokens > 0) {
                        tokPill.hidden = false;
                        tokPill.textContent = `${tokens} tok`;
                        setMetric('tokens', String(tokens), 'accent');
                        if (tokS > 0) {
                            setMetric('rate', Math.round(tokS) + ' tok/s');
                        } else if (firstTokenAt > 0 && tokens > 1) {
                            const elapsedS = (Date.now() - firstTokenAt) / 1000;
                            if (elapsedS > 0.5) setMetric('rate', Math.round(tokens / elapsedS) + ' tok/s');
                        }
                    }
                },
                setEstimate() { /* no-op (indeterminate by design) */ },
                warn(code) {
                    logEvent('warning', '· ' + code, 'warn');
                    if (code === 'NO_FIRST_BYTE') {
                        setMetric('status', 'aguardando 1º byte', 'warn');
                        subtextEl.textContent = 'Servidor ainda não respondeu';
                    } else if (code === 'STALL') {
                        setMetric('status', 'streaming estagnado', 'warn');
                        subtextEl.textContent = 'Sem novos tokens há alguns segundos';
                    }
                },
                note(txt) { logEvent('note', '· ' + txt); },
                onCancel(fn) { cancelFn = fn; }
            };
        },

        panel({ title, anchor, ariaLabel, headerExtra, children, footer, onClose }) {
            const panel = document.createElement('div');
            panel.className = 'pe-panel pe-scope';
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-modal', 'false');
            panel.setAttribute('aria-label', ariaLabel || title);
            const header = document.createElement('div');
            header.className = 'pe-panel__header';
            const h4 = document.createElement('h4');
            h4.textContent = title;
            header.appendChild(h4);
            if (headerExtra) { const slot = document.createElement('div'); slot.className = 'pe-panel__header-extra'; slot.appendChild(headerExtra); header.appendChild(slot); }
            const close = document.createElement('button');
            close.type = 'button'; close.className = 'pe-panel__close';
            close.appendChild(Atoms.icon('x'));
            close.addEventListener('click', () => closeFn());
            header.appendChild(close);
            const body = document.createElement('div');
            body.className = 'pe-panel__body';
            if (children) body.appendChild(children);
            const footerEl = document.createElement('div');
            footerEl.className = 'pe-panel__footer';
            if (footer) footer.forEach(el => footerEl.appendChild(el));
            panel.appendChild(header); panel.appendChild(body); panel.appendChild(footerEl);
            const clip = document.createElement('div');
            clip.className = 'pe-inline-clip';
            clip.appendChild(panel);
            const slot = document.createElement('div');
            slot.className = 'pe-inline-slot';
            slot.appendChild(clip);
            Utils.shieldFromHost(slot);
            const parent = anchor?.parentElement;
            if (parent && parent.contains(anchor)) parent.insertBefore(slot, anchor);
            else document.body.appendChild(slot);
            requestAnimationFrame(() => { slot.classList.add('is-open'); Anim.panelIn(panel); });
            let closed = false;
            const closeFn = async (silent = false) => {
                if (closed) return;
                closed = true;
                slot.classList.remove('is-open');
                await Promise.all([Anim.panelOut(panel), new Promise(r => setTimeout(r, 300))]);
                slot.remove();
                if (!silent) onClose?.();
            };
            return { panel, body, footerEl, close: closeFn };
        },

        preview({ original, enhanced, anchor, onApply, onCancel, trigger }) {
            const prevActive = document.activeElement;
            const body = document.createElement('div');
            body.innerHTML = `<div class="pe-field"><span class="pe-field-label">Original</span><div class="pe-field-text">${Utils.escapeHtml(original)}</div></div><div class="pe-field"><span class="pe-field-label">Aprimorado</span><div class="pe-field-text" data-pe-stream>${Utils.escapeHtml(enhanced)}</div></div>`;
            const cancelBtn = Atoms.button({ icon: 'x', label: 'Cancelar', ariaLabel: 'Cancelar', variant: 'outline', onClick: () => handleCancel() });
            const applyBtn = Atoms.button({ icon: 'check', label: 'Aplicar', ariaLabel: 'Aplicar', variant: 'primary', onClick: () => handleApply() });
            const { panel, close } = Molecules.panel({ title: 'Pré-visualização do prompt', anchor, children: body, footer: [cancelBtn, applyBtn], onClose: () => { try { (trigger || prevActive)?.focus?.(); } catch (_) {} onCancel?.(); } });
            Anim.staggerIn(body, 0.06);
            setTimeout(() => { const stream = panel.querySelector('[data-pe-stream]'); if (stream) Anim.typewriter(stream, { duration: 0.85 }); }, 180);
            function handleCancel() { close(); }
            function handleApply() { Anim.pulseSuccess(applyBtn); try { onApply?.(); } finally { close(); } }
            return { close: handleCancel, apply: handleApply };
        },

        promptBaseChip(prompt) {
            const root = document.createElement('div');
            root.className = 'pe-prompt-base';
            const wc = Utils.wordCount(prompt);
            root.innerHTML = `<button type="button" class="pe-prompt-base__trigger" aria-expanded="false">${Atoms.icon('doc', 'pe-prompt-base__icon').outerHTML}<span class="pe-prompt-base__label">Prompt base</span><span class="pe-prompt-base__meta">${Utils.escapeHtml(Utils.truncate(prompt, 100))}</span><span class="pe-prompt-base__count">${wc} ${wc === 1 ? 'palavra' : 'palavras'}</span>${Atoms.icon('chevron', 'pe-prompt-base__chevron').outerHTML}</button><div class="pe-prompt-base__content"><div><div class="pe-prompt-base__text">${Utils.escapeHtml(prompt)}</div></div></div>`;
            root.querySelector('.pe-prompt-base__trigger').addEventListener('click', (e) => { e.preventDefault(); const expanded = root.classList.toggle('is-expanded'); root.querySelector('.pe-prompt-base__trigger').setAttribute('aria-expanded', String(expanded)); });
            return root;
        },

        contextIndicator() {
            const root = document.createElement('div');
            root.className = 'pe-agents-indicator';
            function refresh() {
                root.innerHTML = '';
                if (!ProjectContext.hasContent() || !ProjectContext.isEnabled()) { root.style.display = 'none'; return; }
                root.style.display = 'flex';
                const active = ProjectContext.list().filter(f => f.enabled);
                const title = active.length === 1 ? active[0].name : `${active.length} arquivos de contexto`;
                root.innerHTML = `${Atoms.icon('check').outerHTML}<div class="pe-agents-indicator__body"><span class="pe-agents-indicator__title">${Utils.escapeHtml(title)}</span><span class="pe-agents-indicator__meta">${Utils.formatBytes(ProjectContext.getTotalSize())} · injetado em cada chamada</span></div>`;
            }
            refresh();
            return { root, refresh };
        },

        guidedWizard({ questions, prompt, anchor, trigger, onSubmit, onCancel }) {
            const prevActive = document.activeElement;
            const progressInline = document.createElement('div');
            progressInline.className = 'pe-progress-inline';
            progressInline.innerHTML = `<div class="pe-progress-track"><div class="pe-progress-fill"></div></div><span class="pe-progress-label">0 de ${questions.length}</span>`;
            const progressFill = progressInline.querySelector('.pe-progress-fill');
            const progressLabel = progressInline.querySelector('.pe-progress-label');
            const bodyContent = document.createElement('div');
            const errorSlot = document.createElement('div');
            errorSlot.setAttribute('aria-live', 'assertive');
            const contextInd = Molecules.contextIndicator();
            const promptLabel = document.createElement('div');
            promptLabel.className = 'pe-section-label';
            promptLabel.innerHTML = `${Atoms.icon('doc').outerHTML}<span>Prompt base</span>`;
            const chip = Molecules.promptBaseChip(prompt);
            const questionsLabel = document.createElement('div');
            questionsLabel.className = 'pe-section-label';
            questionsLabel.innerHTML = `${Atoms.icon('guide').outerHTML}<span>Perguntas de esclarecimento</span>`;
            const list = document.createElement('div');
            bodyContent.appendChild(errorSlot); bodyContent.appendChild(contextInd.root);
            bodyContent.appendChild(promptLabel); bodyContent.appendChild(chip);
            bodyContent.appendChild(questionsLabel); bodyContent.appendChild(list);
            const state = new Map();
            questions.forEach(q => { state.set(q.id, { type: q.type, value: q.type === 'multi' ? null : '', values: q.type === 'multi' ? new Set() : null, freeActive: false, freeText: '', answered: false }); });
            const items = new Map();
            questions.forEach((q, idx) => {
                const qs = state.get(q.id);
                const item = document.createElement('div');
                item.className = 'pe-q-item';
                item.dataset.qid = q.id;
                if (idx === 0) item.classList.add('is-open');
                const header = document.createElement('button');
                header.type = 'button'; header.className = 'pe-q-header';
                header.setAttribute('aria-expanded', String(idx === 0));
                const num = document.createElement('span');
                num.className = 'pe-q-num';
                num.innerHTML = `<span>${idx + 1}</span><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>`;
                const main = document.createElement('div');
                main.className = 'pe-q-header-main';
                const text = document.createElement('div');
                text.className = 'pe-q-text';
                text.textContent = q.question || `Pergunta ${idx + 1}`;
                main.appendChild(text);
                const hint = document.createElement('span');
                if (q.allowCode) { hint.className = 'pe-q-hint pe-q-hint--code'; hint.innerHTML = `${Atoms.icon('codeSpark').outerHTML}<span>Contexto de código útil aqui</span>`; }
                else { hint.className = 'pe-q-hint'; hint.textContent = q.type === 'multi' ? 'Pode selecionar mais de uma opção' : (q.type === 'choice' ? 'Escolha uma opção' : 'Digite sua resposta'); }
                main.appendChild(hint);
                const summary = document.createElement('span');
                summary.className = 'pe-q-summary';
                summary.innerHTML = 'Resposta: <span class="pe-q-summary__value">—</span>';
                const summaryValue = summary.querySelector('.pe-q-summary__value');
                main.appendChild(summary);
                const chevron = Atoms.icon('chevronD');
                chevron.setAttribute('class', 'pe-q-chevron');
                header.appendChild(num); header.appendChild(main); header.appendChild(chevron);
                header.addEventListener('click', () => { const isOpen = item.classList.toggle('is-open'); header.setAttribute('aria-expanded', String(isOpen)); });
                const content = document.createElement('div');
                content.className = 'pe-q-content';
                const contentInnerWrap = document.createElement('div');
                const contentInner = document.createElement('div');
                contentInner.className = 'pe-q-content-inner';
                const group = document.createElement('div');
                group.className = 'pe-options-group';
                if (q.type === 'choice' && Array.isArray(q.options)) {
                    group.setAttribute('role', 'radiogroup');
                    q.options.forEach(opt => {
                        const lab = document.createElement('label');
                        lab.className = 'pe-option';
                        lab.innerHTML = `<span class="pe-radio"></span><span>${Utils.escapeHtml(opt)}</span>`;
                        lab.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); group.querySelectorAll('.pe-option').forEach(o => o.classList.remove('is-checked')); lab.classList.add('is-checked'); qs.value = String(opt); qs.freeActive = false; setAnswered(q, qs, String(opt), { collapse: true }); });
                        group.appendChild(lab);
                    });
                    group.appendChild(Object.assign(document.createElement('div'), { className: 'pe-options-divider', innerHTML: '<span>ou</span>' }));
                    group.appendChild(buildFreeText({ q, qs, kind: 'radio', items, onActivate: () => { qs.freeActive = true; qs.value = ''; group.querySelectorAll('.pe-option').forEach(o => o.classList.remove('is-checked')); }, onInput: (v) => { qs.freeText = v; if (v) setAnswered(q, qs, v, { collapse: false }); else if (!qs.value) unsetAnswered(q, qs); } }));
                } else if (q.type === 'multi' && Array.isArray(q.options)) {
                    group.setAttribute('role', 'group');
                    q.options.forEach(opt => {
                        const lab = document.createElement('label');
                        lab.className = 'pe-option';
                        lab.innerHTML = `<span class="pe-checkbox"></span><span>${Utils.escapeHtml(opt)}</span>`;
                        lab.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); lab.classList.toggle('is-checked'); if (lab.classList.contains('is-checked')) qs.values.add(String(opt)); else qs.values.delete(String(opt)); updateMultiAnswer(q, qs); });
                        group.appendChild(lab);
                    });
                    group.appendChild(Object.assign(document.createElement('div'), { className: 'pe-options-divider', innerHTML: '<span>e/ou</span>' }));
                    group.appendChild(buildFreeText({ q, qs, kind: 'checkbox', items, onActivate: () => { qs.freeActive = true; }, onInput: (v) => { qs.freeText = v; updateMultiAnswer(q, qs); } }));
                } else {
                    const ta = document.createElement('textarea');
                    ta.className = 'pe-textarea'; ta.rows = 2;
                    ta.placeholder = q.placeholder || 'Sua resposta…';
                    ta.addEventListener('input', () => { qs.value = ta.value.trim(); if (qs.value) setAnswered(q, qs, qs.value, { collapse: false }); else unsetAnswered(q, qs); });
                    ta.addEventListener('click', (e) => e.stopPropagation());
                    group.appendChild(ta);
                }
                contentInner.appendChild(group);
                let codeAttach = null;
                if (q.allowCode === true) {
                    codeAttach = Molecules.codeAttachment({ q, onUpdate: () => {} });
                    contentInner.appendChild(codeAttach.root);
                    if (idx === 0) codeAttach.show();
                }
                contentInnerWrap.appendChild(contentInner);
                content.appendChild(contentInnerWrap);
                item.appendChild(header); item.appendChild(content);
                list.appendChild(item);
                items.set(q.id, { item, header, summaryValue, qs, codeAttach });
            });
            function updateMultiAnswer(q, qs) { const arr = Array.from(qs.values); if (qs.freeText) arr.push(`"${qs.freeText}"`); if (arr.length) setAnswered(q, qs, arr.join(', '), { collapse: false }); else unsetAnswered(q, qs); }
            function setAnswered(q, qs, displayValue, opts = {}) { const ref = items.get(q.id); if (!ref) return; qs.answered = true; ref.item.classList.add('is-answered'); ref.summaryValue.textContent = displayValue; if (opts.collapse === true) { setTimeout(() => { if (ref.item.classList.contains('is-open')) { ref.item.classList.remove('is-open'); ref.header.setAttribute('aria-expanded', 'false'); } }, CONFIG.AUTO_COLLAPSE_DELAY); } updateProgress(); }
            function unsetAnswered(q, qs) { const ref = items.get(q.id); if (!ref) return; qs.answered = false; ref.item.classList.remove('is-answered'); ref.summaryValue.textContent = '—'; updateProgress(); }
            function updateProgress() {
                let done = 0;
                for (const q of questions) {
                    const qs = state.get(q.id);
                    if (!qs) continue;
                    if (q.type === 'multi') { if (qs.values.size > 0 || qs.freeText) done++; }
                    else { if (qs.value || (qs.freeActive && qs.freeText)) done++; }
                }
                progressLabel.textContent = `${done} de ${questions.length}`;
                progressFill.style.width = `${(done / questions.length) * 100}%`;
                submitBtn.disabled = done < questions.length;
            }
            function buildFreeText({ q, qs, kind, items, onActivate, onInput }) {
                const wrap = document.createElement('div');
                wrap.className = 'pe-free-text';
                wrap.innerHTML = `<label class="pe-free-text__row"><span class="${kind === 'radio' ? 'pe-radio' : 'pe-checkbox'}"></span><span class="pe-free-text__label">${kind === 'radio' ? 'Nenhuma das opções — escrever resposta' : 'Outros elementos — escrever resposta'}</span></label><div class="pe-free-text__input-wrap"><div><input type="text" class="pe-free-text__input" placeholder="${kind === 'radio' ? 'Digite sua resposta…' : 'Ex: paginação, ordenação…'}"></div></div>`;
                const row = wrap.querySelector('.pe-free-text__row');
                const input = wrap.querySelector('.pe-free-text__input');
                row.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const isActive = wrap.classList.toggle('is-active');
                    if (isActive) { onActivate?.(); setTimeout(() => input.focus(), 220); }
                    else { qs.freeActive = false; qs.freeText = ''; input.value = ''; if (!qs.value) unsetAnswered(q, qs); }
                });
                input.addEventListener('input', () => onInput?.(input.value.trim()));
                input.addEventListener('click', (e) => e.stopPropagation());
                return wrap;
            }
            let allExpanded = false;
            const expandAllBtn = Atoms.buttonNode({ label: 'Expandir tudo', ariaLabel: 'Expandir ou recolher', variant: 'ghost', onClick: (btn) => { allExpanded = !allExpanded; items.forEach(({ item, header }) => { item.classList.toggle('is-open', allExpanded); header.setAttribute('aria-expanded', String(allExpanded)); }); btn.querySelector('.pe-label').textContent = allExpanded ? 'Recolher tudo' : 'Expandir tudo'; } });
            expandAllBtn.classList.add('pe-panel__expand');
            const actions = document.createElement('div');
            actions.className = 'pe-panel__actions';
            const cancelBtn = Atoms.button({ icon: 'x', label: 'Cancelar', ariaLabel: 'Cancelar', variant: 'outline', onClick: () => handleCancel() });
            const submitBtn = Atoms.button({ icon: 'arrow', label: 'Gerar prompt', ariaLabel: 'Gerar', variant: 'primary', onClick: () => handleSubmit() });
            submitBtn.disabled = true;
            actions.appendChild(cancelBtn); actions.appendChild(submitBtn);
            const { panel, close } = Molecules.panel({ title: 'Aprimoramento guiado', anchor, headerExtra: progressInline, children: bodyContent, footer: [expandAllBtn, actions], onClose: () => { try { (trigger || prevActive)?.focus?.(); } catch (_) {} onCancel?.(); } });
            const loading = Molecules.loadingOverlay({});
            panel.appendChild(loading.root);
            const loadingHandler = wireOverlayToEvents(loading);
            let closed = false;
            const animateOut = async (cb) => { if (closed) return; closed = true; await close(true); try { (trigger || prevActive)?.focus?.(); } catch (_) {} cb?.(); };
            const handleCancel = () => { if (closed) return; closed = true; close(); };
            async function handleSubmit() {
                const payload = [];
                let incomplete = false;
                for (const q of questions) {
                    const ref = items.get(q.id);
                    const qs = state.get(q.id);
                    if (!qs || !ref) continue;
                    let value = null;
                    if (q.type === 'multi') { const arr = Array.from(qs.values); if (qs.freeText) arr.push(qs.freeText); if (!arr.length) { incomplete = true; break; } value = arr; }
                    else if (q.type === 'choice') { if (qs.freeActive && qs.freeText) value = qs.freeText; else if (qs.value) value = qs.value; else { incomplete = true; break; } }
                    else { if (!qs.value) { incomplete = true; break; } value = qs.value; }
                    const entry = { id: q.id, question: q.question, type: q.type, value };
                    if (ref.codeAttach) { const cv = ref.codeAttach.getValue(); if (cv) { entry.codeContext = cv.code; entry.codeLanguage = cv.language; entry.files = cv.files; } }
                    payload.push(entry);
                }
                if (incomplete || closed) return;
                errorSlot.innerHTML = '';
                submitBtn.disabled = true;
                submitBtn.classList.add('is-loading');
                loading.setState('connecting');
                loading.show();
                try {
                    const result = await onSubmit?.(payload, { onEvent: loadingHandler });
                    loading.setState('finalizing');
                    await animateOut(() => { result?.onSuccess?.(); });
                } catch (err) {
                    submitBtn.classList.remove('is-loading');
                    submitBtn.disabled = false;
                    loading.hide();
                    Anim.shake(panel);
                    if (err && err.code === 'ABORTED') return;
                    const idx = ErrorIndexer.classify(err);
                    ErrorIndexer.record(err);
                    const box = document.createElement('div');
                    box.className = 'pe-panel-error';
                    const title = document.createElement('div');
                    title.className = 'pe-panel-error__title';
                    title.textContent = idx.title;
                    const desc = document.createElement('div');
                    desc.className = 'pe-panel-error__desc';
                    desc.textContent = idx.description;
                    box.appendChild(title); box.appendChild(desc);
                    const details = document.createElement('details');
                    details.className = 'pe-panel-error__details';
                    const sum = document.createElement('summary');
                    sum.textContent = 'Ver detalhes técnicos';
                    const pre = document.createElement('pre');
                    pre.textContent = JSON.stringify({ code: idx.code, ...idx.technical }, null, 2);
                    details.appendChild(sum); details.appendChild(pre);
                    box.appendChild(details);
                    errorSlot.appendChild(box);
                    Anim.fadeIn(box, { duration: 0.28 });
                    if (err instanceof NetError && err.retryable) Molecules.toast(`${idx.title}\n${idx.description}`, 'error', { actionLabel: 'Tentar novamente', onAction: () => handleSubmit(), details: idx.technical });
                    else Molecules.toast(`${idx.title}\n${idx.description}`, 'error', { details: idx.technical });
                }
            }
            updateProgress();
            return { close: handleCancel };
        },

        toast(message, type = 'info', { actionLabel, onAction, timeout = 3600, details = null } = {}) {
            const t = document.createElement('div');
            t.className = 'pe-toast pe-scope' + (type === 'error' ? ' is-error' : type === 'success' ? ' is-success' : '');
            if (actionLabel && typeof onAction === 'function') t.classList.add('has-action');
            if (details) t.classList.add('has-details');
            t.setAttribute('role', type === 'error' ? 'alert' : 'status');
            t.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
            const row = document.createElement('div');
            row.className = 'pe-toast__row';
            const msg = document.createElement('span');
            msg.className = 'pe-toast__msg';
            const lines = String(message).split('\n').filter(Boolean);
            if (lines.length <= 1) msg.textContent = message;
            else {
                msg.classList.add('is-multiline');
                lines.forEach((line, i) => {
                    const s = document.createElement('span');
                    s.className = i === 0 ? 'pe-toast__line pe-toast__line--headline' : 'pe-toast__line pe-toast__line--detail';
                    s.textContent = line;
                    msg.appendChild(s);
                });
            }
            row.appendChild(msg);
            let finalTimeout = timeout;
            if (lines.length > 1 || details) finalTimeout = Math.max(finalTimeout, 8000);
            if (actionLabel && typeof onAction === 'function') {
                const btn = document.createElement('button');
                btn.type = 'button'; btn.className = 'pe-toast__action';
                btn.textContent = actionLabel;
                btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); try { onAction(); } finally { Anim.toastOut(t); } });
                row.appendChild(btn);
                finalTimeout = Math.max(finalTimeout, 8000);
            }
            t.appendChild(row);
            if (details) {
                const d = document.createElement('details');
                d.className = 'pe-toast__details';
                const sum = document.createElement('summary');
                sum.textContent = 'Detalhes técnicos';
                const pre = document.createElement('pre');
                pre.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
                d.appendChild(sum); d.appendChild(pre);
                t.appendChild(d);
            }
            document.body.appendChild(t);
            Anim.toastIn(t);
            setTimeout(() => Anim.toastOut(t), finalTimeout);
            if (document.hidden && typeof GM_notification === 'function') { try { GM_notification({ text: message, title: 'Kilo Prompt Enhancer', timeout: 3000 }); } catch (_) {} }
        },

        floatLoading({ onCancel } = {}) {
            const wrap = document.createElement('div');
            wrap.className = 'pe-float-wrap pe-scope';
            const overlay = Molecules.loadingOverlay({});
            overlay.root.classList.add('is-float');
            wrap.appendChild(overlay.root);
            document.body.appendChild(wrap);
            Anim.toastIn(wrap);
            overlay.onCancel(onCancel);
            overlay.show();
            return {
                wrap,
                setState: (s, o) => overlay.setState(s, o),
                setPhase: (p) => overlay.setPhase(p),
                setMeta: (m) => overlay.setMeta(m),
                setMetric: (k, v, t) => overlay.setMetric(k, v, t),
                logEvent: (k, d, t) => overlay.logEvent(k, d, t),
                attachStream: (o) => overlay.attachStream(o),
                setEstimate: () => {},
                warn: (c) => overlay.warn(c),
                note: (t) => overlay.note(t),
                destroy: () => { overlay.hide(); setTimeout(() => wrap.remove(), 240); }
            };
        }
    };

    // ===== KiloApi (with history capture per-call + extended system composition) =====
    const KiloApi = {
        _post(systemPrompt, userContent, options = {}) {
            const runId = options.runId || null;
            const baseCallKind = options.callKind || 'main';
            const baseAttempt = options.attempt || 1;
            let lastCallId = null;

            const captureOnEvent = (evt) => {
                if (evt && evt.type === '__history') {
                    if (runId && evt.entry) {
                        try {
                            const entry = {
                                ...evt.entry,
                                kind: evt.callKind || baseCallKind,
                                attempt: typeof evt.attempt === 'number' ? evt.attempt : baseAttempt,
                                retryOf: evt.retryOf || lastCallId || null
                            };
                            const callId = EnhancementHistory.recordCall(runId, entry);
                            if (callId) lastCallId = callId;
                        } catch (_) {}
                    }
                    return;
                }
                try { options.onEvent?.(evt); } catch (_) {}
            };

            const run = async () => {
                let attempt = 0, lastErr;
                while (attempt <= CONFIG.RETRY_MAX) {
                    try {
                        return await KiloApi._postOnce(systemPrompt, userContent, {
                            ...options,
                            onEvent: captureOnEvent,
                            runId,
                            callKind: baseCallKind,
                            attempt: baseAttempt + attempt,
                            retryOf: lastCallId
                        });
                    } catch (err) {
                        lastErr = err;
                        if (!(err instanceof NetError)) throw err;
                        if (!NetError.AUTO_RETRY.has(err.code)) throw err;
                        if (attempt >= CONFIG.RETRY_MAX) throw err;
                        attempt++;
                        try { options.onEvent?.({ type: 'retry', attempt, code: err.code, delayMs: CONFIG.RETRY_BACKOFF_MS, lastError: err }); } catch (_) {}
                        await new Promise(r => setTimeout(r, CONFIG.RETRY_BACKOFF_MS));
                    }
                }
                throw lastErr;
            };
            return run();
        },

        _postOnce(systemPrompt, userContent, { params = {}, skipContext = false, timeoutOverride = null, onEvent = null, forceNonStream = false, mainCall = false, runId = null, callKind = 'main', attempt = 1, retryOf = null } = {}) {
            return new Promise((resolve, reject) => {
                const startedAt = Date.now();
                const emitHistoryEarly = (partial) => {
                    try {
                        onEvent?.({ type: '__history', runId, callKind, attempt, retryOf, entry: { input: userContent, durationMs: Date.now() - startedAt, ...partial } });
                    } catch (_) {}
                };
                if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                    const err = ErrorIndexer.build({ code: 'OFFLINE', message: 'Você está offline.' });
                    emitHistoryEarly({ payload: null, output: '', error: { code: 'OFFLINE', message: err.message }, meta: {} });
                    reject(err);
                    return;
                }
                const finalParams = ParamSchema.clean(params);
                const useStream = CONFIG.STREAM && !forceNonStream;
                const baseSystem = systemPrompt;
                let fullSystem = baseSystem;
                if (finalParams.response_language && finalParams.response_language !== 'auto') fullSystem += `\n\nIdioma da resposta: ${finalParams.response_language}.`;
                if (finalParams.response_persona && finalParams.response_persona !== 'auto') { const hint = CONFIG.PERSONA_HINTS[finalParams.response_persona] || finalParams.response_persona; fullSystem += `\nTom da resposta: ${hint}.`; }
                fullSystem += ProjectContext.buildSystemSuffix({ skip: skipContext });
                const API_KEYS = new Set(['temperature', 'max_tokens', 'top_p', 'frequency_penalty', 'presence_penalty', 'seed']);
                const apiParams = {};
                for (const k of Object.keys(finalParams)) { if (API_KEYS.has(k)) apiParams[k] = finalParams[k]; }
                const payload = { model: CONFIG.MODEL, messages: [{ role: 'system', content: fullSystem }, { role: 'user', content: userContent }], stream: useStream, ...apiParams };
                if (payload.temperature === undefined) payload.temperature = 0.7;
                if (payload.max_tokens === undefined) payload.max_tokens = 2048;
                const payloadForSize = JSON.stringify(payload);
                const payloadKB = Utils.byteSize(payloadForSize) / 1024;
                const adaptiveTimeout = Math.min(CONFIG.TIMEOUT_MAX_MS, Math.max(CONFIG.TIMEOUT_BASE_MS, CONFIG.TIMEOUT_BASE_MS + payloadKB * CONFIG.TIMEOUT_PER_KB_MS));
                const baseTimeout = forceNonStream ? adaptiveTimeout * CONFIG.FALLBACK_TIMEOUT_MULTIPLIER : adaptiveTimeout;
                const timeoutMs = timeoutOverride != null ? timeoutOverride : baseTimeout;
                const check = RateLimiter.check();
                if (!check.allowed) {
                    const err = ErrorIndexer.build({ code: 'LOCAL_RATE_LIMIT', meta: { retryAfterMs: check.retryAfterMs } });
                    emitHistoryEarly({ payload: { system: fullSystem, messages: payload.messages, params: apiParams, meta: { model: CONFIG.MODEL, endpoint: CONFIG.API_URL, stream: useStream, timeoutMs, payloadKB } }, output: '', error: { code: 'LOCAL_RATE_LIMIT', message: err.message, meta: err.meta }, meta: {}, streamUsed: false, fallbackUsed: false });
                    reject(err);
                    return;
                }
                RateLimiter.consume();
                let settled = false, aborted = false, receivedFirstToken = false, receivedAnyByte = false;
                let firstTokenAt = 0, lastTokenAt = Date.now(), tokenCount = 0;
                let responseAccum = '', lastProcessedIdx = 0, lastFinishReason = '';
                let parser = useStream ? StreamParser.create() : null;
                let streamWarned = { noFirstByte: false, stall: false };
                let reqRef = null, watchdogTimer = null;
                State.stream = { active: useStream, startedAt, firstTokenAt: 0, tokenCount: 0, lastTokenAt, observedTokS: 0, fullText: '' };
                const emit = (evt) => { try { onEvent?.(evt); } catch (e) { console.warn('[PE] onEvent error', e); } };
                try { emit({ type: '__meta', meta: { model: CONFIG.MODEL, endpoint: CONFIG.API_URL, stream: useStream, timeoutMs, payloadKB, attempt } }); } catch (_) {}
                function clearWatchdogs() { if (watchdogTimer) { clearInterval(watchdogTimer); watchdogTimer = null; } }
                function startWatchdogs() {
                    if (!useStream) return;
                    watchdogTimer = setInterval(() => {
                        if (settled || aborted) return;
                        const now = Date.now();
                        if (!receivedFirstToken) {
                            if (now - startedAt >= CONFIG.WATCHDOG_NO_FIRST_TOKEN_MS && !streamWarned.noFirstByte) { streamWarned.noFirstByte = true; emit({ type: 'warning', code: 'NO_FIRST_BYTE' }); }
                        } else if (now - lastTokenAt >= CONFIG.WATCHDOG_STALL_MS && !streamWarned.stall) { streamWarned.stall = true; emit({ type: 'warning', code: 'STALL' }); }
                    }, 1000);
                }
                const finalize = (err, value) => {
                    if (settled) return;
                    settled = true;
                    clearWatchdogs();
                    State.stream.active = false;
                    if (State._currentRequest === reqObj) State._currentRequest = null;
                    if (err) {
                        try { emit({ type: 'error', code: err.code, message: err.message, meta: err.meta }); } catch (_) {}
                    }
                    try {
                        emit({ type: '__history', runId, callKind, attempt, retryOf, entry: {
                            input: userContent,
                            payload: { system: fullSystem, messages: payload.messages, params: apiParams, meta: { model: CONFIG.MODEL, endpoint: CONFIG.API_URL, stream: useStream, timeoutMs, payloadKB } },
                            output: value || responseAccum || '',
                            durationMs: Date.now() - startedAt,
                            error: err ? { code: err.code, message: err.message, meta: err.meta } : null,
                            meta: { finishReason: lastFinishReason, tokenCount, aborted },
                            streamUsed: useStream && receivedFirstToken,
                            fallbackUsed: useStream && !receivedFirstToken && !!(value || responseAccum)
                        } });
                    } catch (_) {}
                    if (err) {
                        if (!receivedAnyByte && NetError.RETRYABLE.has(err.code)) { try { RateLimiter.refund(); } catch (_) {} }
                        State.lastError = err;
                        reject(err);
                    } else resolve(value);
                };
                function handleStreamEvents(events) {
                    for (const evt of events) {
                        if (evt.type === 'token') {
                            if (!receivedFirstToken) { receivedFirstToken = true; firstTokenAt = Date.now(); State.stream.firstTokenAt = firstTokenAt; emit({ type: 'first_token' }); }
                            receivedAnyByte = true;
                            tokenCount++;
                            State.stream.tokenCount = tokenCount;
                            lastTokenAt = Date.now();
                            State.stream.lastTokenAt = lastTokenAt;
                            streamWarned.stall = false;
                            responseAccum += evt.text;
                            State.stream.fullText = responseAccum;
                            emit({ type: 'token', text: evt.text, count: tokenCount });
                        } else if (evt.type === 'usage') { emit({ type: 'usage', usage: evt.usage }); }
                        else if (evt.type === 'finish') { lastFinishReason = evt.reason || ''; }
                        else if (evt.type === 'done') {
                            try { emit({ type: 'stream_done', tokens: tokenCount }); } catch (_) {}
                            if (responseAccum.trim()) finalize(null, responseAccum.trim());
                            else finalize(ErrorIndexer.build({ code: 'EMPTY_RESPONSE', message: lastFinishReason === 'content_filter' ? 'Conteúdo bloqueado pelo filtro de segurança do provedor.' : 'A API não retornou conteúdo.', meta: { finishReason: lastFinishReason } }));
                        }
                    }
                }
                const reqObj = { abort: () => { if (aborted || settled) return; aborted = true; clearWatchdogs(); try { reqRef?.abort?.(); } catch (_) {} finalize(ErrorIndexer.build({ code: 'ABORTED', message: 'Requisição cancelada.' })); } };
                State._currentRequest = reqObj;
                State.pendingAbort = reqObj.abort;
                reqRef = GM_xmlhttpRequest({
                    method: 'POST',
                    url: CONFIG.API_URL,
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer anonymous', 'X-KILOCODE-EDITORNAME': CONFIG.EDITOR_NAME },
                    data: JSON.stringify(payload),
                    timeout: timeoutMs,
                    onprogress: useStream ? (res) => {
                        if (aborted || settled) return;
                        try {
                            const full = res.responseText || '';
                            if (full.length <= lastProcessedIdx) return;
                            const delta = full.slice(lastProcessedIdx);
                            lastProcessedIdx = full.length;
                            if (!receivedAnyByte) {
                                receivedAnyByte = true;
                                try { emit({ type: 'first_byte', status: res.status || 0, bytes: full.length }); } catch (_) {}
                            }
                            const events = parser.feed(delta);
                            handleStreamEvents(events);
                        } catch (e) { emit({ type: 'warning', code: 'STREAM_PARSE_ERROR', error: e }); }
                    } : undefined,
                    onload: (res) => {
                        if (aborted) return;
                        clearWatchdogs();
                        if (useStream && parser) {
                            try {
                                const full = res.responseText || '';
                                if (full.length > lastProcessedIdx) {
                                    const delta = full.slice(lastProcessedIdx);
                                    lastProcessedIdx = full.length;
                                    if (!receivedAnyByte) {
                                        receivedAnyByte = true;
                                        try { emit({ type: 'first_byte', status: res.status, bytes: full.length }); } catch (_) {}
                                    }
                                    const events = parser.feed(delta);
                                    handleStreamEvents(events);
                                    if (settled) return;
                                }
                            } catch (_) {}
                        }
                        if (!receivedAnyByte) {
                            receivedAnyByte = true;
                            try { emit({ type: 'first_byte', status: res.status, bytes: (res.responseText || '').length }); } catch (_) {}
                        }
                        if (res.status < 200 || res.status >= 300) {
                            const data = ErrorIndexer.safeJsonParse(res.responseText);
                            finalize(ErrorIndexer.fromHttpResponse(res.status, data, res.responseHeaders, res.responseText));
                            return;
                        }
                        if (responseAccum.trim()) { finalize(null, responseAccum.trim()); return; }
                        let data;
                        try { data = JSON.parse(res.responseText); }
                        catch {
                            const headers = ErrorIndexer.parseHeaders(res.responseHeaders);
                            finalize(ErrorIndexer.build({ code: 'BAD_JSON', message: 'Resposta inválida da API.', meta: { status: res.status, contentType: headers['content-type'] || '', snippet: ErrorIndexer.truncate(res.responseText) } }));
                            return;
                        }
                        if (useStream && !receivedFirstToken) emit({ type: 'fallback' });
                        const choice = data?.choices?.[0];
                        const finishReason = choice?.finish_reason || '';
                        const refusal = choice?.message?.refusal;
                        const content = choice?.message?.content;
                        if (typeof content !== 'string' || !content.trim()) {
                            finalize(ErrorIndexer.build({ code: 'EMPTY_RESPONSE', message: finishReason === 'content_filter' ? 'Conteúdo bloqueado por filtro de segurança.' : (refusal ? `Provedor recusou: ${refusal}` : 'A API não retornou conteúdo.'), meta: { status: res.status, finishReason, refusal, provider: ErrorIndexer.extractProviderError(data) } }));
                            return;
                        }
                        finalize(null, content.trim());
                    },
                    onerror: () => { if (aborted) return; finalize(ErrorIndexer.build({ code: 'NETWORK', message: 'Falha de rede ao contatar o Kilo Code.' })); },
                    ontimeout: () => { if (aborted) return; finalize(ErrorIndexer.build({ code: 'TIMEOUT', message: 'Tempo limite excedido.', meta: { timeoutMs, payloadKB, payloadSize: Utils.byteSize(payloadForSize) } })); },
                    onabort: () => { if (aborted) return; aborted = true; finalize(ErrorIndexer.build({ code: 'ABORTED', message: 'Requisição cancelada.' })); }
                });
                if (useStream) startWatchdogs();
            });
        },

        abort() { const req = State._currentRequest; if (req) { try { req.abort(); } catch (_) {} } },
        call(prompt, options = {}) { return KiloApi._post(SystemPromptManager.currentPrompt(), prompt, { ...options, mainCall: true }); },

        async generateQuestions(prompt, options = {}) {
            const raw = await KiloApi._post(SystemPromptManager.withUserInstructions(CONFIG.QUESTIONS_SYSTEM_PROMPT), prompt, options);
            const parsed = Utils.parseJSON(raw);
            if (!parsed || !Array.isArray(parsed.questions) || !parsed.questions.length) throw ErrorIndexer.build({ code: 'BAD_JSON', message: 'Não foi possível gerar perguntas.', meta: { snippet: ErrorIndexer.truncate(raw) } });
            let allowCodeCount = 0;
            const cleaned = parsed.questions
                .filter(q => q && typeof q.question === 'string' && q.question.trim())
                .map((q, i) => {
                    let type = String(q.type || 'text').toLowerCase();
                    if (!['text', 'choice', 'multi'].includes(type)) type = 'text';
                    const item = { id: String(q.id || `q${i + 1}`), type, question: String(q.question).trim(), placeholder: typeof q.placeholder === 'string' ? q.placeholder : '', options: Array.isArray(q.options) ? q.options.map(o => String(o)).filter(Boolean).slice(0, 6) : [] };
                    if ((type === 'choice' || type === 'multi') && item.options.length < 2) { item.type = 'text'; type = 'text'; }
                    if (q.allowCode === true && allowCodeCount < 2) { item.allowCode = true; allowCodeCount++; }
                    return item;
                }).slice(0, 5);
            if (!cleaned.length) throw ErrorIndexer.build({ code: 'EMPTY_RESPONSE', message: 'Nenhuma pergunta válida.', meta: { snippet: ErrorIndexer.truncate(raw) } });
            return cleaned;
        },

        enhanceWithAnswers(prompt, answers, options = {}) {
            const qa = answers.map((a, i) => {
                const val = Array.isArray(a.value) ? a.value.join(', ') : String(a.value ?? '');
                let entry = `P${i + 1}: ${a.question}\nR${i + 1}: ${val}`;
                if (a.codeContext) {
                    const lang = a.codeLanguage || '';
                    const filesInfo = Array.isArray(a.files) && a.files.length ? `\n(arquivos anexados: ${a.files.map(f => f.name).join(', ')})` : '';
                    entry += `\n\nTrecho de código fornecido pelo usuário${lang ? ` (${lang})` : ''}:${filesInfo}\n\`\`\`\n${a.codeContext}\n\`\`\``;
                }
                return entry;
            }).join('\n\n');
            const userContent = `Prompt inicial:\n"""\n${prompt}\n"""\n\nPerguntas e respostas do usuário:\n${qa}`;
            return KiloApi._post(SystemPromptManager.withUserInstructions(CONFIG.ENHANCE_WITH_ANSWERS_SYSTEM_PROMPT), userContent, options);
        }
    };

    const Composer = (() => {
        const mounted = new WeakSet();
        function findComposer(input) {
            let node = input;
            for (let i = 0; i < 6 && node; i++) {
                const style = getComputedStyle(node);
                const isColumn = style.display.includes('flex') && style.flexDirection === 'column';
                const isBlock = style.display === 'block' || style.display === 'flow-root';
                const isBody = node === document.body;
                if (!isBody && (isColumn || isBlock)) {
                    const hint = ((node.getAttribute('data-testid') || '') + ' ' + (typeof node.className === 'string' ? node.className : ''));
                    if (/composer|input|prompt|chat|editor/i.test(hint) || i >= 2) return node;
                }
                node = node.parentElement;
            }
            return input.parentElement || null;
        }
        function findAnchor(composer, input) {
            let anchor = input;
            while (anchor.parentElement && anchor.parentElement !== composer) anchor = anchor.parentElement;
            return anchor.parentElement === composer ? anchor : null;
        }
        function mount(input, handlers) {
            const composer = findComposer(input);
            if (!composer || mounted.has(composer)) return null;
            const root = document.createElement('div');
            root.className = 'pe-mount pe-scope';
            root.setAttribute('data-pe-owner', Utils.uid());
            const bar = Molecules.actionBar(handlers);
            root.appendChild(bar.root);
            Utils.shieldFromHost(root);
            const anchor = findAnchor(composer, input);
            if (anchor) composer.insertBefore(root, anchor);
            else composer.insertBefore(root, composer.firstChild);
            mounted.add(composer);
            Anim.barIn(root);
            return {
                mount: root, actionbar: bar, composer,
                destroy(afterRemoved) { mounted.delete(composer); try { bar.destroy?.(); } catch (_) {} Anim.barOut(root, afterRemoved); }
            };
        }
        return { find: findComposer, mount, isMounted: (c) => mounted.has(c) };
    })();

    const getAnchor = () => State.activeComposer?.mount || State.activeInput || document.body;
    const closePreview = () => { State.preview?.close?.(); State.preview = null; };
    const closeWizard = () => { State.wizard?.close?.(); State.wizard = null; };
    const closeAll = () => { closePreview(); closeWizard(); };

    async function onParams() {
        return new Promise((resolve) => {
            let settled = false, saved = null;
            Molecules.settingsModal({
                initialTab: 'params',
                onSave: (vals) => { saved = vals; },
                onClose: () => { if (settled) return; settled = true; resolve(saved); }
            });
        });
    }

    async function onSettings() {
        Molecules.settingsModal({
            initialTab: 'params',
            onSave: (vals) => { State.params = vals; },
            onClose: () => {}
        });
    }

    function handleEnhanceError(err) {
        if (err?.code === 'ABORTED') return;
        const idx = ErrorIndexer.classify(err);
        ErrorIndexer.record(err);
        try { console.groupCollapsed(`[PE] ❌ ${idx.code} — ${idx.title}`); console.log('description:', idx.description); console.log('technical:', idx.technical); console.groupEnd(); } catch (_) {}
        const text = idx.description ? `${idx.title}\n${idx.description}` : idx.title;
        const ACTION_MAP = { 'retry': () => retryEnhance(), 'retry-no-context': () => retryEnhanceNoContext(), 'retry-nostream': () => retryEnhanceNoStream(), 'open-params': () => onParams() };
        const labels = { retry: 'Tentar novamente', 'retry-no-context': 'Tentar sem contexto', 'retry-nostream': 'Modo padrão', 'open-params': 'Parâmetros' };
        const action = idx.actionKey && ACTION_MAP[idx.actionKey] ? idx.actionKey : null;
        if (action) Molecules.toast(text, 'error', { actionLabel: labels[action], onAction: ACTION_MAP[action], details: idx.technical });
        else Molecules.toast(text, 'error', { details: idx.technical });
    }

    let lastEnhance = null;
    function retryEnhance() {
        if (!lastEnhance) return;
        onEnhance(lastEnhance.btn, { skipParamsCheck: true, skipContext: false, forceNonStream: false, retryOfRunId: lastEnhance.runId || null });
    }
    function retryEnhanceNoContext() {
        if (!lastEnhance) return;
        onEnhance(lastEnhance.btn, { skipParamsCheck: true, skipContext: true, forceNonStream: false, retryOfRunId: lastEnhance.runId || null });
    }
    function retryEnhanceNoStream() {
        if (!lastEnhance) return;
        onEnhance(lastEnhance.btn, { skipParamsCheck: true, skipContext: false, forceNonStream: true, retryOfRunId: lastEnhance.runId || null });
    }

    async function onEnhance(btn, { skipParamsCheck = false, skipContext = false, forceNonStream = false, retryOfRunId = null } = {}) {
        if (State.isProcessing || State.isGuiding) return;
        const el = State.activeInput;
        if (!el) { Molecules.toast('Foque um campo de texto primeiro.', 'error'); return; }
        const original = Utils.getText(el).trim();
        if (original.length < CONFIG.MIN_TEXT_LENGTH) { Molecules.toast('Texto muito curto para aprimorar.', 'error'); Anim.shake(btn); return; }
        const params = State.params || ParamSchema.load();
        if (!params || typeof params !== 'object') {
            Molecules.toast('Não foi possível carregar os parâmetros.', 'error');
            return;
        }
        const activeFiles = ProjectContext.list().filter(f => f.enabled);
        const contextInfo = { activeCount: activeFiles.length, totalBytes: ProjectContext.getTotalSize(), enabled: ProjectContext.isEnabled() };
        const meta = {};
        if (retryOfRunId) meta.retryOfRunId = retryOfRunId;
        const runId = EnhancementHistory.startRun({ type: 'enhance', input: original, params, contextInfo, meta });
        const capturedRunId = runId;

        lastEnhance = { btn, el, original, runId };
        State.isProcessing = true;
        State.activeComposer?.actionbar.setBusy(true);
        closeAll();

        const overlay = Molecules.floatLoading({ onCancel: () => KiloApi.abort() });
        const overlayHandler = wireOverlayToEvents(overlay);
        overlay.setState('connecting');

        try {
            const enhanced = await KiloApi.call(original, {
                params, skipContext, forceNonStream,
                runId: capturedRunId,
                callKind: 'main',
                attempt: 1,
                onEvent: overlayHandler
            });
            overlay.setState('finalizing');
            await new Promise(r => setTimeout(r, 140));
            overlay.destroy();
            EnhancementHistory.endRun(capturedRunId, { status: 'success', output: enhanced });
            State.preview = Molecules.preview({
                original, enhanced, anchor: getAnchor(), trigger: btn || el,
                onCancel: () => { EnhancementHistory.setOutcome(capturedRunId, 'cancelled'); State.preview = null; },
                onApply: () => {
                    State.previousText = original;
                    Utils.applyText(el, enhanced);
                    State.activeComposer?.actionbar.setUndoEnabled(true);
                    EnhancementHistory.setOutcome(capturedRunId, 'applied');
                    State.preview = null;
                    Molecules.toast('Prompt aprimorado.', 'success');
                }
            });
        } catch (err) {
            overlay.destroy();
            if (err.code === 'ABORTED') {
                EnhancementHistory.cancelRun(capturedRunId, { reason: 'aborted' });
            } else {
                Anim.shake(btn);
                EnhancementHistory.endRun(capturedRunId, { status: 'error', error: { code: err.code, message: err.message, meta: err.meta } });
            }
            handleEnhanceError(err);
        } finally {
            State.isProcessing = false;
            State.activeComposer?.actionbar.setBusy(false);
        }
    }

    async function onGuided(btn) {
        if (State.isProcessing || State.isGuiding) return;
        const el = State.activeInput;
        if (!el) { Molecules.toast('Foque um campo de texto primeiro.', 'error'); return; }
        const base = Utils.getText(el).trim();
        if (base.length < CONFIG.MIN_TEXT_LENGTH) { Molecules.toast('Texto muito curto para aprimorar.', 'error'); Anim.shake(btn); return; }
        const params = State.params || ParamSchema.load();
        if (!params || typeof params !== 'object') {
            Molecules.toast('Não foi possível carregar os parâmetros.', 'error');
            return;
        }

        State.isGuiding = true;
        State.activeComposer?.actionbar.setGuidedBusy(true, 'Analisando…');
        closeAll();

        const activeFiles = ProjectContext.list().filter(f => f.enabled);
        const contextInfo = { activeCount: activeFiles.length, totalBytes: ProjectContext.getTotalSize(), enabled: ProjectContext.isEnabled() };
        const runId = EnhancementHistory.startRun({ type: 'guided', input: base, params, contextInfo, meta: {} });
        const capturedRunId = runId;
        let wizardSubmitted = false;

        const questionsOverlay = Molecules.floatLoading({ onCancel: () => KiloApi.abort() });
        const questionsHandler = wireOverlayToEvents(questionsOverlay);
        questionsOverlay.setState('connecting');

        let questions;
        try {
            questions = await KiloApi.generateQuestions(base, {
                params,
                runId: capturedRunId,
                callKind: 'questions',
                attempt: 1,
                onEvent: questionsHandler
            });
        } catch (err) {
            questionsOverlay.destroy();
            if (err.code === 'ABORTED') {
                EnhancementHistory.cancelRun(capturedRunId, { reason: 'aborted' });
            } else {
                Anim.shake(btn);
                EnhancementHistory.endRun(capturedRunId, { status: 'error', error: { code: err.code, message: err.message, meta: err.meta } });
            }
            State.isGuiding = false;
            State.activeComposer?.actionbar.setGuidedBusy(false);
            handleEnhanceError(err);
            return;
        }
        questionsOverlay.setState('finalizing');
        await new Promise(r => setTimeout(r, 140));
        questionsOverlay.destroy();
        State.activeComposer?.actionbar.setGuidedBusy(false);

        State.wizard = Molecules.guidedWizard({
            questions, prompt: base, anchor: getAnchor(), trigger: btn || el,
            onCancel: () => {
                State.wizard = null;
                State.isGuiding = false;
                State.activeComposer?.actionbar.setGuidedBusy(false);
                if (!wizardSubmitted) EnhancementHistory.cancelRun(capturedRunId, { reason: 'wizard-cancelled' });
            },
            onSubmit: async (answers, { onEvent } = {}) => {
                wizardSubmitted = true;
                try {
                    const enhanced = await KiloApi.enhanceWithAnswers(base, answers, {
                        params,
                        runId: capturedRunId,
                        callKind: 'enhance-with-answers',
                        attempt: 1,
                        onEvent
                    });
                    EnhancementHistory.endRun(capturedRunId, { status: 'success', output: enhanced });
                    return {
                        onSuccess: () => {
                            State.wizard = null;
                            State.isGuiding = false;
                            State.preview = Molecules.preview({
                                original: base, enhanced, anchor: getAnchor(), trigger: btn || el,
                                onCancel: () => { EnhancementHistory.setOutcome(capturedRunId, 'cancelled'); State.preview = null; },
                                onApply: () => {
                                    State.previousText = base;
                                    Utils.applyText(el, enhanced);
                                    State.activeComposer?.actionbar.setUndoEnabled(true);
                                    EnhancementHistory.setOutcome(capturedRunId, 'applied');
                                    State.preview = null;
                                    Molecules.toast('Prompt aprimorado com guiamento.', 'success');
                                }
                            });
                        }
                    };
                } catch (err) {
                    State.isGuiding = false;
                    State.activeComposer?.actionbar.setGuidedBusy(false);
                    if (err.code === 'ABORTED') {
                        EnhancementHistory.cancelRun(capturedRunId, { reason: 'aborted' });
                    } else {
                        EnhancementHistory.endRun(capturedRunId, { status: 'error', error: { code: err.code, message: err.message, meta: err.meta } });
                    }
                    throw err;
                }
            }
        });
    }

    function onUndo() {
        const el = State.activeInput;
        if (!el || State.previousText == null) return;
        Utils.applyText(el, State.previousText);
        State.previousText = null;
        State.activeComposer?.actionbar.setUndoEnabled(false);
        Molecules.toast('Alteração desfeita.', 'info');
    }

    const debouncedEnhance = Utils.debounce(() => { onEnhance(State.activeComposer?.actionbar.enhanceBtn); }, CONFIG.DEBOUNCE_MS);

    function onFocusIn(e) {
        const target = e.target;
        if (!Utils.isEditable(target) || target.disabled || target.readOnly) return;
        if (target.closest && target.closest('.pe-scope')) return;
        State.activeInput = target;
        const composerRoot = Composer.find(target);
        if (!composerRoot) return;
        if (Composer.isMounted(composerRoot) && State.activeComposer?.composer === composerRoot) return;
        State.activeComposer?.destroy();
        State.activeComposer = Composer.mount(target, {
            onEnhance: (b) => onEnhance(b),
            onGuided: (b) => onGuided(b),
            onParams: () => onParams(),
            onSettings: () => onSettings(),
            onUndo
        });
    }

    function onKeydown(e) {
        const inOurScope = e.target && e.target.closest && e.target.closest('.pe-scope');
        if (e.key === 'Escape') { if (State.preview) { e.preventDefault(); closePreview(); return; } if (State.wizard) { e.preventDefault(); closeWizard(); return; } }
        if (!inOurScope && e.ctrlKey && e.shiftKey && (e.key === 'e' || e.key === 'E')) { if (State.activeInput) { e.preventDefault(); debouncedEnhance(); } }
        if (!inOurScope && e.ctrlKey && e.shiftKey && (e.key === 'p' || e.key === 'P')) { if (State.activeComposer) { e.preventDefault(); onParams(); } }
        if (!inOurScope && e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S')) { if (State.activeComposer) { e.preventDefault(); onSettings(); } }
    }

    function observe() {
        const mo = new MutationObserver(() => {
            if (State.activeInput && !document.body.contains(State.activeInput)) {
                State.activeComposer?.destroy(); State.activeComposer = null; State.activeInput = null; closeAll();
            } else if (State.activeInput && State.activeComposer && !document.body.contains(State.activeComposer.composer)) {
                State.activeComposer = Composer.mount(State.activeInput, { onEnhance: (b) => onEnhance(b), onGuided: (b) => onGuided(b), onParams: () => onParams(), onSettings: () => onSettings(), onUndo });
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    function showErrorHistory() {
        const history = ErrorIndexer.history();
        if (!history.length) { alert('Nenhum erro registrado.'); return; }
        const lines = history.slice(0, 20).map((h, i) => {
            const date = new Date(h.at).toLocaleString('pt-BR');
            const status = h.status ? ` (HTTP ${h.status})` : '';
            return `${i + 1}. [${date}] ${h.code}${status} — ${h.title}\n   ${h.description}`;
        });
        const msg = `${history.length} erro(s) registrado(s):\n\n${lines.join('\n\n')}`;
        if (confirm(`${msg}\n\nDeseja limpar o histórico de erros?`)) { ErrorIndexer.clearHistory(); alert('Histórico de erros limpo.'); }
    }

    function init() {
        injectStyles();
        HostShield.install();
        migrateLegacy();
        migrateHistoryRuns();
        EnhancementHistory.reconcilePending();
        State.params = ParamSchema.load();
        observe();
        document.addEventListener('focusin', onFocusIn, true);
        document.addEventListener('keydown', onKeydown, true);

        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('ℹ️ Sobre o Kilo Prompt Enhancer', () => {
                const files = ProjectContext.list();
                const activeFiles = files.filter(f => f.enabled);
                const total = ProjectContext.getTotalSize();
                const ctx = files.length ? `${activeFiles.length}/${files.length} arquivo(s) ativo(s) · ${Utils.formatBytes(total)} / ${Utils.formatBytes(CONFIG.MAX_CONTEXT_TOTAL_SIZE)} (${ProjectContext.isEnabled() ? 'ON' : 'OFF'})` : 'nenhum arquivo';
                const histCount = EnhancementHistory.listRuns().length;
                alert(
                    'Kilo Prompt Enhancer v4.5.2\n\n' +
                    'Contexto: ' + ctx + '\n' +
                    'Provider detectado: ' + Providers.detect() + '\n' +
                    'Streaming: ' + (CONFIG.STREAM ? 'ativo' : 'inativo') + '\n' +
                    'ErrorIndexer: ' + Object.keys(ErrorIndexer.CATALOG).length + ' códigos · ' + ErrorIndexer.history().length + ' no histórico de erros\n' +
                    'Histórico de aprimoramentos (runs): ' + histCount + ' / ' + CONFIG.HISTORY_MAX + '\n' +
                    'GSAP: ' + (Anim.hasGsap ? 'carregado' : 'indisponível') + '\n' +
                    'Movimento reduzido: ' + (Anim.reduced() ? 'ativo' : 'inativo') + '\n\n' +
                    'Endpoint: ' + CONFIG.API_URL + '\n' +
                    'Modelo: ' + CONFIG.MODEL + '\n' +
                    'Rate limit: ' + CONFIG.RATE_LIMIT.max + ' req / ' + (CONFIG.RATE_LIMIT.window / 1000) + 's por domínio\n' +
                    'Retry automático: ' + CONFIG.RETRY_MAX + ' tentativa(s), backoff ' + (CONFIG.RETRY_BACKOFF_MS / 1000) + 's\n\n' +
                    'Atalhos: Ctrl+Shift+E (aprimorar) · Ctrl+Shift+P (parâmetros) · Ctrl+Shift+S (configurações) · Esc (fechar)'
                );
            });
            GM_registerMenuCommand('⚙️ Configurações', () => {
                if (State.activeComposer) onSettings();
                else alert('Foque um campo de texto primeiro.');
            });
            GM_registerMenuCommand('📄 Limpar arquivos de contexto', () => {
                if (!ProjectContext.list().length) { alert('Nenhum arquivo de contexto carregado.'); return; }
                if (confirm('Remover todos os arquivos de contexto?')) { ProjectContext.clearAll(); State.activeComposer?.actionbar.refreshContextBtn(); alert('Arquivos removidos.'); }
            });
            GM_registerMenuCommand('🧩 Gerenciar contexto', () => {
                if (State.activeComposer) State.activeComposer.actionbar.contextBtn.click();
                else alert('Foque um campo de texto primeiro.');
            });
            GM_registerMenuCommand('📊 Histórico de erros', () => showErrorHistory());
            GM_registerMenuCommand('🧹 Limpar histórico de erros', () => {
                if (!ErrorIndexer.history().length) { alert('Nenhum erro registrado.'); return; }
                if (confirm('Limpar histórico de erros?')) { ErrorIndexer.clearHistory(); alert('Histórico de erros limpo.'); }
            });
            GM_registerMenuCommand('🗑️ Limpar histórico de aprimoramentos', () => {
                if (!EnhancementHistory.listRuns().length) { alert('Nenhum aprimoramento registrado.'); return; }
                if (confirm('Limpar histórico de aprimoramentos?')) { EnhancementHistory.clear(); alert('Histórico de aprimoramentos limpo.'); }
            });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();