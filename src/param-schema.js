// ===== src/param-schema.js =====
    // ===== ParamSchema (number | select | text) =====
    const ParamSchema = (() => {
        const SCHEMA = [
            { key: 'temperature', get label() { return I18n.t('param.temperature.label'); }, type: 'number', min: 0, max: 2, step: 0.1, default: 0.7, get hint() { return I18n.t('param.temperature.hint'); } },
            { key: 'max_tokens', get label() { return I18n.t('param.max_tokens.label'); }, type: 'number', min: 64, max: 8192, step: 1, default: 2048, get hint() { return I18n.t('param.max_tokens.hint'); } },
            { key: 'top_p', get label() { return I18n.t('param.top_p.label'); }, type: 'number', min: 0, max: 1, step: 0.05, default: 1.0, get hint() { return I18n.t('param.top_p.hint'); } },
            { key: 'frequency_penalty', get label() { return I18n.t('param.frequency_penalty.label'); }, type: 'number', min: -2, max: 2, step: 0.1, default: 0.0, get hint() { return I18n.t('param.frequency_penalty.hint'); } },
            { key: 'presence_penalty', get label() { return I18n.t('param.presence_penalty.label'); }, type: 'number', min: -2, max: 2, step: 0.1, default: 0.0, get hint() { return I18n.t('param.presence_penalty.hint'); } },
            { key: 'seed', get label() { return I18n.t('param.seed.label'); }, type: 'number', min: 0, max: 2147483647, step: 1, default: null, get hint() { return I18n.t('param.seed.hint'); } },
            // Language names are endonyms by design (not translated with the UI).
            { key: 'response_language', get label() { return I18n.t('param.response_language.label'); }, type: 'select', default: 'auto', get hint() { return I18n.t('param.response_language.hint'); }, options: [
                { value: 'auto', label: 'Auto' },
                { value: 'pt-BR', label: 'Português (BR)' },
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
                { value: 'fr', label: 'Français' },
                { value: 'de', label: 'Deutsch' },
                { value: 'it', label: 'Italiano' },
                { value: 'ja', label: '日本語' },
                { value: 'zh', label: '中文' }
            ]},
            { key: 'response_persona', get label() { return I18n.t('param.response_persona.label'); }, type: 'select', default: 'auto', get hint() { return I18n.t('param.response_persona.hint'); }, options: [
                { value: 'auto', get label() { return I18n.t('param.response_persona.opt.auto'); } },
                { value: 'formal', get label() { return I18n.t('param.response_persona.opt.formal'); } },
                { value: 'casual', get label() { return I18n.t('param.response_persona.opt.casual'); } },
                { value: 'technical', get label() { return I18n.t('param.response_persona.opt.technical'); } },
                { value: 'friendly', get label() { return I18n.t('param.response_persona.opt.friendly'); } },
                { value: 'concise', get label() { return I18n.t('param.response_persona.opt.concise'); } },
                { value: 'custom', get label() { return I18n.t('param.response_persona.opt.custom'); } }
            ]},
            { key: 'response_persona_custom', get label() { return I18n.t('param.response_persona_custom.label'); }, type: 'text', default: '', maxLength: 200, get hint() { return I18n.t('param.response_persona_custom.hint'); } }
        ];
        const PRESETS = [
            { key: 'precise', get label() { return I18n.t('param.preset.precise'); }, values: { temperature: 0.2, top_p: 0.9, max_tokens: 2048 } },
            { key: 'balanced', get label() { return I18n.t('param.preset.balanced'); }, values: { temperature: 0.7, top_p: 1.0, max_tokens: 2048 } },
            { key: 'creative', get label() { return I18n.t('param.preset.creative'); }, values: { temperature: 1.1, top_p: 1.0, max_tokens: 3072 } }
        ];
        function defaults() { const o = {}; SCHEMA.forEach(f => { o[f.key] = f.default; }); return o; }
        function validate(values) {
            const errors = [];
            for (const f of SCHEMA) {
                const v = values?.[f.key];
                if (v === null || v === undefined || v === '') continue;
                if (f.type === 'number') {
                    const n = Number(v);
                    if (!Number.isFinite(n)) { errors.push(I18n.t('param.invalidValue', {label:f.label})); continue; }
                    if (n < f.min || n > f.max) errors.push(I18n.t('param.outOfRange', {label:f.label,min:f.min,max:f.max}));
                } else if (f.type === 'text') {
                    if (typeof v !== 'string') errors.push(I18n.t('param.mustBeText', {label:f.label}));
                    else if (f.maxLength && v.length > f.maxLength) errors.push(I18n.t('param.maxChars', {label:f.label,max:f.maxLength}));
                } else if (f.type === 'select') {
                    const opts = (f.options || []).map(o => o.value ?? o);
                    if (!opts.includes(v)) errors.push(I18n.t('param.invalidOption', {label:f.label}));
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
