// ===== src/param-schema.js =====
    // ===== ParamSchema (number | select | text) =====
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
                { value: 'concise', label: 'Conciso' },
                { value: 'custom', label: 'Personalizado' }
            ]},
            { key: 'response_persona_custom', label: 'Tom customizado', type: 'text', default: '', maxLength: 200, hint: 'Ex: sarcástico, mas didático' }
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
