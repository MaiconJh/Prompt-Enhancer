// ===== src/workspace/workspace-model.js =====
const WorkspaceModel = (() => {
    const DEFAULT_PROJECT_SETTINGS = Object.freeze({
        instructions: '',
        aiAccessMode: 'selected',
        allowAiEdits: false,
        requireEditApproval: true
    });
    function createId(prefix = 'ws') {
        const random = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
        return `${prefix}_${random}`;
    }
    function normalizeProject(input = {}) {
        const name = String(input.name || '').trim().slice(0, 100);
        if (!name) throw new TypeError('O projeto precisa ter um nome.');
        const now = Date.now();
        return { id: String(input.id || createId('project')), name, description: String(input.description || '').trim().slice(0, 500), settings: { ...DEFAULT_PROJECT_SETTINGS, ...(input.settings || {}) }, createdAt: Number(input.createdAt) || now, updatedAt: now };
    }
    function normalizeFilePath(value) {
        if (typeof value !== 'string' || !value.trim()) throw new TypeError('O caminho do arquivo é obrigatório.');
        const path = value.trim().replace(/\\/g, '/');
        if (path.startsWith('/') || /^[a-z]:/i.test(path) || path.includes(String.fromCharCode(0))) throw new TypeError('O caminho precisa ser relativo ao projeto.');
        const segments = path.split('/');
        if (segments.some(segment => !segment || segment === '.' || segment === '..')) throw new TypeError('O caminho contém segmentos inválidos.');
        return segments.join('/');
    }
    return { createId, normalizeProject, normalizeFilePath, DEFAULT_PROJECT_SETTINGS };
})();
