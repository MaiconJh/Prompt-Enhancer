// ===== src/workspace/workspace-model.js =====
const WorkspaceModel = (() => {
    const DEFAULT_PROJECT_CONFIG = Object.freeze({
        includePatterns: Object.freeze([]),
        maxContextBytes: 48 * 1024
    });
    const DEFAULT_PROJECT_SETTINGS = Object.freeze({
        instructions: '',
        aiAccessMode: 'selected',
        aiProviderModelId: '',
        defaultView: 'files',
        config: DEFAULT_PROJECT_CONFIG
    });

    function createId(prefix = 'ws') {
        const random = globalThis.crypto?.randomUUID?.()
            || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
        return `${prefix}_${random}`;
    }

    function normalizeConfig(value) {
        if (value === undefined || value === null) return {
            includePatterns: [...DEFAULT_PROJECT_CONFIG.includePatterns],
            maxContextBytes: DEFAULT_PROJECT_CONFIG.maxContextBytes
        };
        if (typeof value !== 'object' || Array.isArray(value)) {
            throw new TypeError('A configuração do projeto precisa ser um objeto JSON.');
        }
        let serialized;
        try { serialized = JSON.stringify(value); }
        catch (_) { throw new TypeError('A configuração do projeto não pode ser serializada como JSON.'); }
        if (!serialized || serialized.length > 16_384) {
            throw new TypeError('A configuração do projeto excede o limite de 16 KiB.');
        }
        const patterns = value.includePatterns === undefined ? [] : value.includePatterns;
        if (!Array.isArray(patterns) || patterns.length > 100) {
            throw new TypeError('includePatterns precisa ser uma lista com no máximo 100 padrões.');
        }
        const includePatterns = patterns.map(pattern => {
            if (typeof pattern !== 'string') throw new TypeError('Cada padrão de inclusão precisa ser texto.');
            const normalized = pattern.trim().normalize('NFC');
            if (!normalized || normalized.length > 256 || normalized.startsWith('/')
                || normalized.includes('\\') || /[\u0000-\u001f\u007f]/.test(normalized)
                || normalized.split('/').some(part => part === '..' || part === '.')) {
                throw new TypeError('Um padrão de inclusão contém caminho inválido.');
            }
            return normalized;
        });
        const maxContextBytes = value.maxContextBytes === undefined
            ? DEFAULT_PROJECT_CONFIG.maxContextBytes : Number(value.maxContextBytes);
        if (!Number.isInteger(maxContextBytes) || maxContextBytes < 1024 || maxContextBytes > 262_144) {
            throw new TypeError('maxContextBytes precisa ser um inteiro entre 1024 e 262144.');
        }
        return { ...JSON.parse(serialized), includePatterns, maxContextBytes };
    }

    function normalizeProject(input = {}) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            throw new TypeError('Os dados do projeto são inválidos.');
        }
        const name = String(input.name || '').trim().normalize('NFC').slice(0, 100);
        if (!name || /[\u0000-\u001f\u007f]/.test(name)) {
            throw new TypeError('O projeto precisa ter um nome válido.');
        }
        const sourceSettings = input.settings && typeof input.settings === 'object' && !Array.isArray(input.settings)
            ? input.settings
            : {};
        const settings = {
            instructions: typeof sourceSettings.instructions === 'string'
                ? sourceSettings.instructions.slice(0, 20_000) : DEFAULT_PROJECT_SETTINGS.instructions,
            aiAccessMode: ['all', 'selected', 'none'].includes(sourceSettings.aiAccessMode)
                ? sourceSettings.aiAccessMode : DEFAULT_PROJECT_SETTINGS.aiAccessMode,
            aiProviderModelId: typeof sourceSettings.aiProviderModelId === 'string'
                ? sourceSettings.aiProviderModelId.trim().slice(0, 256) : DEFAULT_PROJECT_SETTINGS.aiProviderModelId,
            defaultView: ['files', 'ai', 'settings'].includes(sourceSettings.defaultView)
                ? sourceSettings.defaultView : DEFAULT_PROJECT_SETTINGS.defaultView,
            config: normalizeConfig(sourceSettings.config)
        };
        const now = Date.now();
        const id = input.id === undefined ? createId('project') : String(input.id);
        if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new TypeError('O identificador do projeto é inválido.');
        return {
            id,
            name,
            description: String(input.description || '').trim().normalize('NFC').slice(0, 500),
            settings,
            createdAt: Number.isFinite(Number(input.createdAt)) && Number(input.createdAt) > 0 ? Number(input.createdAt) : now,
            updatedAt: now
        };
    }

    function normalizeFilePath(value) {
        if (typeof value !== 'string' || !value.trim()) throw new TypeError('O caminho do arquivo é obrigatório.');
        if (value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) {
            throw new TypeError('O caminho contém separadores ou caracteres de controle inválidos.');
        }
        const path = value.trim().normalize('NFC');
        if (path.length > 1024 || path.startsWith('/') || /^[a-z]:/i.test(path)) {
            throw new TypeError('O caminho precisa ser relativo e ter no máximo 1024 caracteres.');
        }
        const segments = path.split('/');
        if (segments.length > 32 || segments.some(segment =>
            !segment || segment === '.' || segment === '..' || segment.length > 255
            || segment.endsWith(' ') || segment.endsWith('.') || segment.includes(':')
        )) {
            throw new TypeError('O caminho contém segmentos inválidos.');
        }
        return segments.join('/');
    }

    return { createId, normalizeProject, normalizeFilePath, normalizeConfig, DEFAULT_PROJECT_SETTINGS, DEFAULT_PROJECT_CONFIG };
})();
