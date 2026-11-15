// ===== src/workspace/file-registry.js =====
const FileRegistry = (() => {
    const MAX_FILE_BYTES = 1024 * 1024;
    const MAX_PROJECT_FILES = 250;
    const MAX_PROJECT_BYTES = 20 * 1024 * 1024;
    const byteLength = content => new TextEncoder().encode(content).byteLength;
    function validateTextFile({ path, content }) {
        let normalizedPath;
        try { normalizedPath = WorkspaceModel.normalizeFilePath(path); }
        catch (error) { return { valid: false, reason: 'invalid-path', message: error.message }; }
        if (typeof content !== 'string') return { valid: false, reason: 'not-text', message: 'O conteúdo precisa ser texto UTF-8.' };
        if (content.includes(String.fromCharCode(0))) return { valid: false, reason: 'binary-content', message: 'O conteúdo contém bytes nulos e parece ser binário.' };
        const size = byteLength(content);
        if (size > MAX_FILE_BYTES) return { valid: false, reason: 'file-too-large', message: `O limite por arquivo é ${MAX_FILE_BYTES} bytes.` };
        return { valid: true, path: normalizedPath, size };
    }
    function metadata(file) { const { content, ...publicData } = file; return publicData; }
    async function list(projectId) {
        return (await WorkspaceStorage.listFiles(String(projectId))).map(metadata).sort((a, b) => a.path.localeCompare(b.path));
    }
    async function get(projectId, fileId) {
        const file = await WorkspaceStorage.getFile(String(fileId));
        return file && file.projectId === String(projectId) ? file : null;
    }
    async function create(projectId, input = {}) {
        const project = await ProjectManager.get(projectId);
        if (!project) throw new Error('Projeto não encontrado.');
        const validation = validateTextFile(input);
        if (!validation.valid) { const error = new Error(validation.message); error.code = validation.reason; throw error; }
        const existing = await WorkspaceStorage.listFiles(project.id);
        if (existing.length >= MAX_PROJECT_FILES) throw new Error(`O projeto atingiu o limite de ${MAX_PROJECT_FILES} arquivos.`);
        const totalBytes = existing.reduce((sum, file) => sum + (Number(file.size) || 0), 0);
        if (totalBytes + validation.size > MAX_PROJECT_BYTES) throw new Error('O projeto excede o limite total de armazenamento.');
        if (existing.some(file => file.path === validation.path)) throw new Error('Já existe um arquivo com esse caminho no projeto.');
        const name = validation.path.split('/').pop();
        const dot = name.lastIndexOf('.');
        const now = Date.now();
        const file = {
            id: WorkspaceModel.createId('file'), projectId: project.id, path: validation.path, name,
            extension: dot > 0 ? name.slice(dot + 1).toLowerCase() : '',
            mimeType: String(input.mimeType || 'text/plain'), size: validation.size, content: input.content,
            createdAt: now, updatedAt: now, version: 1, aiAccess: 'allowed'
        };
        await WorkspaceStorage.putFile(file);
        await ProjectManager.update(project.id, {});
        return metadata(file);
    }
    async function update(projectId, fileId, changes = {}) {
        const current = await get(projectId, fileId);
        if (!current) throw new Error('Arquivo não encontrado neste projeto.');
        const content = changes.content === undefined ? current.content : changes.content;
        const validation = validateTextFile({ path: changes.path === undefined ? current.path : changes.path, content });
        if (!validation.valid) { const error = new Error(validation.message); error.code = validation.reason; throw error; }
        const siblings = await WorkspaceStorage.listFiles(String(projectId));
        if (siblings.some(file => file.id !== current.id && file.path === validation.path)) throw new Error('Já existe um arquivo com esse caminho no projeto.');
        const totalBytes = siblings.reduce((sum, file) => sum + (Number(file.size) || 0), 0) - current.size + validation.size;
        if (totalBytes > MAX_PROJECT_BYTES) throw new Error('O projeto excede o limite total de armazenamento.');
        const name = validation.path.split('/').pop();
        const dot = name.lastIndexOf('.');
        const updated = { ...current, path: validation.path, name, extension: dot > 0 ? name.slice(dot + 1).toLowerCase() : '',
            mimeType: String(changes.mimeType || current.mimeType || 'text/plain'), size: validation.size, content,
            updatedAt: Date.now(), version: current.version + 1 };
        await WorkspaceStorage.putFile(updated);
        await ProjectManager.update(projectId, {});
        return metadata(updated);
    }
    async function remove(projectId, fileId) {
        const current = await get(projectId, fileId);
        if (!current) return false;
        await WorkspaceStorage.deleteFile(current.id);
        await ProjectManager.update(projectId, {});
        return true;
    }
    return { list, get, create, update, remove, validateTextFile,
        limits: Object.freeze({ maxFileBytes: MAX_FILE_BYTES, maxProjectFiles: MAX_PROJECT_FILES, maxProjectBytes: MAX_PROJECT_BYTES }) };
})();
