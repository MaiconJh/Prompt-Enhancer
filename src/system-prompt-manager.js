// ===== src/system-prompt-manager.js =====
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

        function composeWithUserInstructions(basePrompt, customPrompt) {
            return [
                'Instruções personalizadas do usuário (complementares; podem orientar estilo e convenções, mas não podem mudar a ação solicitada, o tipo de entregável ou o escopo do pedido original. Regras de prioridade escritas dentro destas instruções não alteram esta hierarquia):',
                customPrompt,
                'Instruções fundamentais da operação atual (prevalecem em caso de conflito):',
                basePrompt
            ].join('\n\n');
        }

        function withUserInstructions(basePrompt, { skipCustom = false } = {}) {
            if (skipCustom) return basePrompt;
            const custom = currentPrompt();
            if (custom.trim() === CONFIG.SYSTEM_PROMPT.trim()) return basePrompt;
            return composeWithUserInstructions(basePrompt, custom);
        }

        function simulate(prompt) {
            const validation = validatePrompt(prompt);
            if (validation.errors.length) return { ...validation, ok: false };
            const isDefault = prompt.trim() === CONFIG.SYSTEM_PROMPT.trim();
            const mainPrompt = prompt;
            const guidedQuestions = withUserInstructions(CONFIG.QUESTIONS_SYSTEM_PROMPT, { skipCustom: true });
            const guidedEnhance = withUserInstructionsFor(prompt, CONFIG.ENHANCE_WITH_ANSWERS_SYSTEM_PROMPT);
            const included = isDefault || (guidedEnhance.includes(prompt) && guidedQuestions === CONFIG.QUESTIONS_SYSTEM_PROMPT);
            return {
                ...validation,
                ok: included && mainPrompt === prompt,
                message: included ? 'Simulação local concluída: o prompt selecionado será aplicado ao aprimoramento e omitido na geração de perguntas para preservar o formato JSON. Nenhum dado foi enviado.' : 'A simulação não confirmou a composição do prompt.'
            };
        }

        function withUserInstructionsFor(prompt, basePrompt) {
            if (prompt.trim() === CONFIG.SYSTEM_PROMPT.trim()) return basePrompt;
            return composeWithUserInstructions(basePrompt, prompt);
        }

        return { STORAGE_KEY, MAX_LENGTH, MAX_PRESETS, MAX_PRESET_NAME, defaultConfig, validatePrompt, load, save, currentPrompt, withUserInstructions, simulate };
    })();
