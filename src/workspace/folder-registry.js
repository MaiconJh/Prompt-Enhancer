// ===== src/workspace/folder-registry.js =====
const FolderRegistry = (() => {
    function createError(message, code) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    async function list(projectId) {
        const project = await ProjectManager.get(projectId);
        if (!project) throw createError('Projeto não encontrado.', 'project-not-found');
        return WorkspaceStorage.listFolders(project.id);
    }

    async function create(projectId, path) {
        const project = await ProjectManager.get(projectId);
        if (!project) throw createError('Projeto não encontrado.', 'project-not-found');
        const normalizedPath = WorkspaceModel.normalizeFilePath(path);
        const now = Date.now();
        const folder = {
            id: WorkspaceModel.createId('folder'),
            projectId: project.id,
            path: normalizedPath,
            name: normalizedPath.split('/').pop(),
            createdAt: now,
            updatedAt: now
        };
        try {
            return await WorkspaceStorage.createProjectFolder(folder);
        } catch (error) {
            if (error?.name === 'ConstraintError') throw createError('A pasta já existe neste projeto.', 'folder-exists');
            throw error;
        }
    }

    async function rename(projectId, sourcePath, targetPath) {
        const project = await ProjectManager.get(projectId);
        if (!project) throw createError('Projeto não encontrado.', 'project-not-found');
        const source = WorkspaceModel.normalizeFilePath(sourcePath);
        const target = WorkspaceModel.normalizeFilePath(targetPath);
        if (source === target) return { files: [], folders: [] };
        if (target.startsWith(source + '/') || source.startsWith(target + '/')) {
            throw createError('A pasta de destino não pode estar dentro ou acima da pasta original.', 'invalid-path');
        }
        const [files, folders] = await Promise.all([
            WorkspaceStorage.listFiles(project.id),
            WorkspaceStorage.listFolders(project.id)
        ]);
        const exists = files.some(file => file.path.startsWith(source + '/'))
            || folders.some(folder => folder.path === source || folder.path.startsWith(source + '/'));
        if (!exists) throw createError('A pasta não existe neste projeto.', 'folder-not-found');
        return WorkspaceStorage.renameProjectFolder(project.id, source, target);
    }

    async function remove(projectId, path) {
        const project = await ProjectManager.get(projectId);
        if (!project) throw createError('Projeto não encontrado.', 'project-not-found');
        const normalizedPath = WorkspaceModel.normalizeFilePath(path);
        return WorkspaceStorage.deleteProjectFolder(project.id, normalizedPath);
    }

    return Object.freeze({ list, create, rename, remove });
})();
