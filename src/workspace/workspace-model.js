// ===== src/workspace/workspace-model.js =====
const WorkspaceModel = (() => {
    const DEFAULT_PROJECT_SETTINGS = Object.freeze({
        instructions: '',
        aiAccessMode: 'selected',
        allowAiEdits: false,
        requireEditApproval: true
    });

    function createId(prefix = 'ws') {
        const random = globalThis.crypto?.randomUUID?.()
            || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
        return `${prefix}_${random}`;
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
            instructions: typeof sourceSettings.instructions === 'string' ? sourceSettings.instructions.slice(0, 20_000) : DEFAULT_PROJECT_SETTINGS.instructions,
            aiAccessMode: ['all', 'selected', 'none'].includes(sourceSettings.aiAccessMode)
                ? sourceSettings.aiAccessMode : DEFAULT_PROJECT_SETTINGS.aiAccessMode,
            allowAiEdits: sourceSettings.allowAiEdits === true,
            requireEditApproval: sourceSettings.requireEditApproval !== false
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

    return { createId, normalizeProject, normalizeFilePath, DEFAULT_PROJECT_SETTINGS };
})();
