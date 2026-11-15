// ===== src/workspace/project-manager.js =====
const ProjectManager = (() => {
    async function list() { return (await WorkspaceStorage.listProjects()).sort((a, b) => b.updatedAt - a.updatedAt); }
    async function get(projectId) { return projectId ? WorkspaceStorage.getProject(String(projectId)) : null; }
    async function create(input) {
        const project = WorkspaceModel.normalizeProject(input);
        await WorkspaceStorage.putProject(project);
        return project;
    }
    async function update(projectId, changes = {}) {
        const current = await get(projectId);
        if (!current) throw new Error('Projeto não encontrado.');
        const updated = WorkspaceModel.normalizeProject({ ...current, ...changes, id: current.id, createdAt: current.createdAt });
        await WorkspaceStorage.putProject(updated);
        return updated;
    }
    async function remove(projectId) {
        const current = await get(projectId);
        if (!current) return false;
        await WorkspaceStorage.deleteProject(current.id);
        return true;
    }
    return { list, get, create, update, remove };
})();
