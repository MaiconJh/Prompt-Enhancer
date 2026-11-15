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
            if (!trimmed) errors.push(I18n.t('spm.empty'));
            if (text.length > MAX_LENGTH) errors.push(I18n.t('spm.limitChars',{max:MAX_LENGTH.toLocaleString(I18n.getLanguage()==='en'?'en-US':'pt-BR')}));
            if (trimmed && trimmed.length < 80) warnings.push(I18n.t('spm.shortPrompt'));
            if (trimmed && !/[\r\n]/.test(trimmed)) warnings.push(I18n.t('spm.separateLines'));
            return { errors, warnings, charCount: text.length };
        }

        function normalize(config) {
            if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error(I18n.t('spm.invalidData'));
            const prompt = typeof config.prompt === 'string' ? config.prompt : CONFIG.SYSTEM_PROMPT;
            const promptCheck = validatePrompt(prompt);
            if (promptCheck.errors.length) throw new Error(promptCheck.errors.join(' '));
            const presets = Array.isArray(config.presets) ? config.presets : [];
            if (presets.length > MAX_PRESETS) throw new Error(I18n.t('spm.limitPresets',{max:MAX_PRESETS}));
            const names = new Set();
            const cleanPresets = presets.map((preset) => {
                if (!preset || typeof preset !== 'object') throw new Error(I18n.t('spm.invalidPreset'));
                const name = String(preset.name || '').trim();
                const value = typeof preset.prompt === 'string' ? preset.prompt : '';
                const key = name.toLocaleLowerCase();
                if (!name || name.length > MAX_PRESET_NAME) throw new Error(I18n.t('spm.presetNameLength',{max:MAX_PRESET_NAME}));
                if (names.has(key)) throw new Error(I18n.t('spm.duplicatePreset',{name:name}));
                if (validatePrompt(value).errors.length) throw new Error(I18n.t('spm.invalidPresetPrompt',{name:name}));
                names.add(key);
                return { name, prompt: value };
            });
            return { version: 1, prompt, presets: cleanPresets };
        }

        const MIGRATION_FLAG = 'pe_system_prompt_migrated';

        function readLegacyPrompt() {
            try {
                const raw = GM_getValue('pe_params', null);
                const params = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (params && typeof params.system_prompt === 'string' && params.system_prompt.trim()) return params.system_prompt;
            } catch (error) {
                console.warn(I18n.t('spm.legacyMigrateFail'), error);
            }
            return null;
        }

        function load() {
            try {
                const gmRaw = typeof GM_getValue === 'function' ? GM_getValue(STORAGE_KEY, null) : null;
                if (gmRaw !== null && gmRaw !== undefined) {
                    let parsed;
                    try { parsed = JSON.parse(gmRaw); }
                    catch (error) { throw new Error(I18n.t('spm.readFail',{msg:error.message})); }
                    return normalize(parsed);
                }
            } catch (error) {
                console.warn('[PE] Falha ao ler system prompt do GM:', error);
            }

            try {
                const alreadyMigrated = typeof GM_getValue === 'function' && GM_getValue(MIGRATION_FLAG, false);
                if (alreadyMigrated) {
                    const initial = defaultConfig();
                    const legacyPrompt = readLegacyPrompt();
                    if (legacyPrompt) initial.prompt = legacyPrompt;
                    save(initial);
                    return initial;
                }

                const lsRaw = localStorage.getItem(STORAGE_KEY);
                if (lsRaw !== null) {
                    let parsed;
                    try { parsed = JSON.parse(lsRaw); }
                    catch (error) { throw new Error(I18n.t('spm.readFail',{msg:error.message})); }
                    const clean = normalize(parsed);
                    try { save(clean); } catch (_) {}
                    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
                    try { typeof GM_setValue === 'function' && GM_setValue(MIGRATION_FLAG, true); } catch (_) {}
                    return clean;
                }
            } catch (error) {
                console.warn('[PE] Falha ao ler system prompt do localStorage:', error);
            }

            const initial = defaultConfig();
            const legacyPrompt = readLegacyPrompt();
            if (legacyPrompt) initial.prompt = legacyPrompt;
            save(initial);
            return initial;
        }

        function save(config) {
            const clean = normalize(config);
            try { typeof GM_setValue === 'function' && GM_setValue(STORAGE_KEY, JSON.stringify(clean)); } catch (error) { throw new Error(`[PE] Falha ao gravar system prompt: ${error.message}`); }
            try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
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
                message: included ? I18n.t('spm.simOk') : I18n.t('spm.simFail')
            };
        }

        function withUserInstructionsFor(prompt, basePrompt) {
            if (prompt.trim() === CONFIG.SYSTEM_PROMPT.trim()) return basePrompt;
            return composeWithUserInstructions(basePrompt, prompt);
        }

        return { STORAGE_KEY, MAX_LENGTH, MAX_PRESETS, MAX_PRESET_NAME, defaultConfig, validatePrompt, load, save, currentPrompt, withUserInstructions, simulate };
    })();
