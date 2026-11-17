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
        const { content, version: _legacyVersion, ...publicData } = file;
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
        if (!file || file.projectId !== project.id) return null;
        const { version: _legacyVersion, ...fileData } = file;
        return fileData;
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
            aiAccess: 'denied'
        };
        await WorkspaceStorage.saveFile(file, {
            maxFiles: MAX_PROJECT_FILES,
            maxBytes: MAX_PROJECT_BYTES,
            mode: 'create'
        });
        return metadata(file);
    }


    async function createMany(projectId, inputs = []) {
        const project = await ProjectManager.get(projectId);
        if (!project) throw createError('Projeto não encontrado.', 'project-not-found');
        if (!Array.isArray(inputs) || inputs.length === 0) {
            throw createError('Informe ao menos um arquivo para criação.', 'invalid-input');
        }
        if (inputs.length > MAX_PROJECT_FILES) {
            throw createError(`O lote excede o limite de ${MAX_PROJECT_FILES} arquivos.`, 'project-file-limit');
        }

        const paths = new Set();
        let totalBytes = 0;
        const now = Date.now();
        const files = inputs.map(input => {
            const validation = validateTextFile(input);
            if (!validation.valid) throw createError(validation.message, validation.reason);
            if (paths.has(validation.path)) {
                throw createError(`O lote contém caminhos duplicados: ${validation.path}`, 'file-exists');
            }
            paths.add(validation.path);
            totalBytes += validation.size;
            if (totalBytes > MAX_PROJECT_BYTES) {
                throw createError('O lote excede o limite total de armazenamento do projeto.', 'project-size-limit');
            }
            const name = validation.path.split('/').pop();
            const dot = name.lastIndexOf('.');
            return {
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
                aiAccess: 'denied'
            };
        });

        const existing = await WorkspaceStorage.listFiles(project.id);
        const existingPaths = new Set(existing.map(file => file.path));
        const conflict = files.find(file => existingPaths.has(file.path));
        if (conflict) throw createError(`Já existe um arquivo com o caminho ${conflict.path}.`, 'file-exists');
        if (existing.length + files.length > MAX_PROJECT_FILES) {
            throw createError(`O projeto excede o limite de ${MAX_PROJECT_FILES} arquivos.`, 'project-file-limit');
        }
        const existingBytes = existing.reduce((sum, file) => sum + (Number(file.size) || 0), 0);
        if (existingBytes + totalBytes > MAX_PROJECT_BYTES) {
            throw createError('O projeto excede o limite total de armazenamento.', 'project-size-limit');
        }

        const saved = await WorkspaceStorage.saveFiles(files, {
            maxFiles: MAX_PROJECT_FILES,
            maxBytes: MAX_PROJECT_BYTES
        });
        return saved.map(metadata);
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
        const { version: _legacyVersion, ...currentData } = current;
        const updated = {
            ...currentData,
            path: validation.path,
            name,
            extension: dot > 0 ? name.slice(dot + 1).toLowerCase() : '',
            mimeType: typeof changes.mimeType === 'string' && changes.mimeType.trim()
                ? changes.mimeType.trim().slice(0, 128)
                : current.mimeType,
            size: validation.size,
            content,
            updatedAt: Date.now()
        };

        await WorkspaceStorage.saveFile(updated, {
            maxFiles: MAX_PROJECT_FILES,
            maxBytes: MAX_PROJECT_BYTES,
            mode: 'update'
        });
        return metadata(updated);
    }

    async function setAccess(projectId, fileId, access) {
        if (access !== 'allowed' && access !== 'denied') {
            throw createError('A permissão da IA deve ser allowed ou denied.', 'invalid-ai-access');
        }
        const current = await get(projectId, fileId);
        if (!current) throw createError('Arquivo não encontrado neste projeto.', 'file-not-found');
        const updated = {
            ...current,
            aiAccess: access,
            updatedAt: Date.now()
        };
        await WorkspaceStorage.saveFile(updated, {
            maxFiles: MAX_PROJECT_FILES,
            maxBytes: MAX_PROJECT_BYTES,
            mode: 'update'
        });
        return metadata(updated);
    }

    async function remove(projectId, fileId) {
        const project = await ProjectManager.get(projectId);
        if (!project) return false;
        const current = await WorkspaceStorage.getFile(String(fileId));
        if (!current || current.projectId !== project.id) return false;
        return WorkspaceStorage.deleteProjectFile(project.id, current.id);
    }


    async function setAccessMany(projectId, changes = []) {
        const project = await ProjectManager.get(projectId);
        if (!project) throw createError('Projeto não encontrado.', 'project-not-found');
        if (!Array.isArray(changes)) throw createError('A lista de permissões é inválida.', 'invalid-input');
        const normalized = changes.map(change => ({
            id: String(change?.id || ''),
            access: change?.access
        }));
        if (normalized.some(change => !change.id || !['allowed', 'denied'].includes(change.access))) {
            throw createError('A lista contém uma permissão inválida.', 'invalid-ai-access');
        }
        const updated = await WorkspaceStorage.setFileAccessMany(project.id, normalized);
        return updated.map(metadata);
    }

    return {
        list,
        get,
        create,
        createMany,
        update,
        setAccess,
        setAccessMany,
        remove,
        validateTextFile,
        limits: Object.freeze({
            maxFileBytes: MAX_FILE_BYTES,
            maxProjectFiles: MAX_PROJECT_FILES,
            maxProjectBytes: MAX_PROJECT_BYTES
        })
    };
})();
