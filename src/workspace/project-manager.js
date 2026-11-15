// ===== src/workspace/project-manager.js =====
const ProjectManager = (() => {
    async function list() {
        return (await WorkspaceStorage.listProjects()).sort((a, b) => b.updatedAt - a.updatedAt);
    }

    async function get(projectId) {
        return projectId ? WorkspaceStorage.getProject(String(projectId)) : null;
    }

    async function create(input) {
        const project = WorkspaceModel.normalizeProject(input);
        try {
            await WorkspaceStorage.addProject(project);
        } catch (error) {
            if (error?.name === 'ConstraintError') {
                throw new Error('Já existe um projeto com esse identificador.');
            }
            throw error;
        }
        return project;
    }

    async function update(projectId, changes = {}) {
        if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
            throw new TypeError('As alterações do projeto são inválidas.');
        }
        return WorkspaceStorage.updateProject(String(projectId), current =>
            WorkspaceModel.normalizeProject({
                ...current,
                ...changes,
                id: current.id,
                createdAt: current.createdAt
            })
        );
    }

    async function remove(projectId) {
        const current = await get(projectId);
        if (!current) return false;
        await WorkspaceStorage.deleteProject(current.id);
        return true;
    }

    return { list, get, create, update, remove };
})();
