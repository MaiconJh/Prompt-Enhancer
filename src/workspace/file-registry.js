// ===== src/workspace/file-registry.js =====
const FileRegistry = (() => {
    const MAX_FILE_BYTES = 1024 * 1024;
    const MAX_PROJECT_FILES = 250;
    const MAX_PROJECT_BYTES = 20 * 1024 * 1024;

    const byteLength = content => new TextEncoder().encode(content).byteLength;

    function validateTextFile(input = {}) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            return { valid: false, reason: 'invalid-input', message: 'Os dados do arquivo são inválidos.' };
        }
        let normalizedPath;
        try { normalizedPath = WorkspaceModel.normalizeFilePath(input.path); }
        catch (error) { return { valid: false, reason: 'invalid-path', message: error.message }; }
        if (typeof input.content !== 'string') return { valid: false, reason: 'not-text', message: 'O conteúdo precisa ser texto UTF-8.' };
        if (input.content.includes(String.fromCharCode(0))) return { valid: false, reason: 'binary-content', message: 'O conteúdo contém bytes nulos e parece ser binário.' };
        const size = byteLength(input.content);
        if (size > MAX_FILE_BYTES) return { valid: false, reason: 'file-too-large', message: `O limite por arquivo é ${MAX_FILE_BYTES} bytes.` };
        return { valid: true, path: normalizedPath, size };
    }

    function metadata(file) {
        const { content, ...publicData } = file;
        return publicData;
    }

    function createError(message, code) {
        const error = new Error(message);
        if (code) error.code = code;
        return error;
    }

    async function list(projectId) {
        const project = await ProjectManager.get(projectId);
        if (!project) throw createError('Projeto não encontrado.', 'project-not-found');
        return (await WorkspaceStorage.listFiles(project.id)).map(metadata).sort((a, b) => a.path.localeCompare(b.path));
    }

    async function get(projectId, fileId) {
        const project = await ProjectManager.get(projectId);
        if (!project) return null;
        const file = await WorkspaceStorage.getFile(String(fileId));
        return file && file.projectId === project.id ? file : null;
    }

    async function create(projectId, input = {}) {
        const project = await ProjectManager.get(projectId);
        if (!project) throw createError('Projeto não encontrado.', 'project-not-found');
        const validation = validateTextFile(input);
        if (!validation.valid) throw createError(validation.message, validation.reason);

        const name = validation.path.split('/').pop();
        const dot = name.lastIndexOf('.');
        const now = Date.now();
        const file = {
            id: WorkspaceModel.createId('file'),
            projectId: project.id,
            path: validation.path,
            name,
            extension: dot > 0 ? name.slice(dot + 1).toLowerCase() : '',
            mimeType: typeof input.mimeType === 'string' && input.mimeType.trim() ? input.mimeType.trim().slice(0, 128) : 'text/plain',
            size: validation.size,
            content: input.content,
            createdAt: now,
            updatedAt: now,
            version: 1,
            aiAccess: 'denied'
        };
        await WorkspaceStorage.saveFile(file, {
            maxFiles: MAX_PROJECT_FILES,
            maxBytes: MAX_PROJECT_BYTES
        });
        return metadata(file);
    }

    async function update(projectId, fileId, changes = {}) {
        if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
            throw createError('As alterações do arquivo são inválidas.', 'invalid-input');
        }
        const current = await get(projectId, fileId);
        if (!current) throw createError('Arquivo não encontrado neste projeto.', 'file-not-found');

        const content = changes.content === undefined ? current.content : changes.content;
        const validation = validateTextFile({
            path: changes.path === undefined ? current.path : changes.path,
            content
        });
        if (!validation.valid) throw createError(validation.message, validation.reason);

        const name = validation.path.split('/').pop();
        const dot = name.lastIndexOf('.');
        const updated = {
            ...current,
            path: validation.path,
            name,
            extension: dot > 0 ? name.slice(dot + 1).toLowerCase() : '',
            mimeType: typeof changes.mimeType === 'string' && changes.mimeType.trim()
                ? changes.mimeType.trim().slice(0, 128)
                : current.mimeType,
            size: validation.size,
            content,
            updatedAt: Date.now(),
            version: current.version + 1
        };

        await WorkspaceStorage.saveFile(updated, {
            maxFiles: MAX_PROJECT_FILES,
            maxBytes: MAX_PROJECT_BYTES,
            expectedVersion: current.version
        });
        return metadata(updated);
    }

    async function remove(projectId, fileId) {
        const project = await ProjectManager.get(projectId);
        if (!project) return false;
        const current = await WorkspaceStorage.getFile(String(fileId));
        if (!current || current.projectId !== project.id) return false;
        return WorkspaceStorage.deleteProjectFile(project.id, current.id, current.version);
    }

    return {
        list,
        get,
        create,
        update,
        remove,
        validateTextFile,
        limits: Object.freeze({
            maxFileBytes: MAX_FILE_BYTES,
            maxProjectFiles: MAX_PROJECT_FILES,
            maxProjectBytes: MAX_PROJECT_BYTES
        })
    };
})();
