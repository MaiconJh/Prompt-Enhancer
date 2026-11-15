// ===== src/workspace/workspace.js =====
const Workspace = (() => {
    let initialized = false;
    let initialization = null;
    async function init() {
        if (initialized) return { initialized: true };
        if (initialization) return initialization;
        initialization = WorkspaceStorage.open().then(() => {
            initialized = true;
            return { initialized: true };
        }).finally(() => { initialization = null; });
        return initialization;
    }
    function assertInitialized() {
        if (!initialized) throw new Error('Workspace ainda não foi inicializado. Execute Workspace.init() primeiro.');
    }
    return {
        init, close() { WorkspaceStorage.close(); initialized = false; }, isInitialized: () => initialized,
        getActiveProjectId() {
            try { return typeof GM_getValue === 'function' ? GM_getValue('pe_workspace_active_project', null) : null; }
            catch (_) { return null; }
        },
        async setActiveProjectId(projectId) {
            assertInitialized();
            const normalizedId = projectId == null || projectId === '' ? null : String(projectId);
            if (normalizedId && !(await ProjectManager.get(normalizedId))) {
                throw new Error('O projeto selecionado não existe mais.');
            }
            if (typeof GM_setValue !== 'function') throw new Error('O armazenamento de preferências não está disponível.');
            GM_setValue('pe_workspace_active_project', normalizedId);
            return normalizedId;
        },
        projects: {
            list: (...args) => { assertInitialized(); return ProjectManager.list(...args); },
            get: (...args) => { assertInitialized(); return ProjectManager.get(...args); },
            create: (...args) => { assertInitialized(); return ProjectManager.create(...args); },
            update: (...args) => { assertInitialized(); return ProjectManager.update(...args); },
            remove: (...args) => { assertInitialized(); return ProjectManager.remove(...args); }
        },
        files: {
            list: (...args) => { assertInitialized(); return FileRegistry.list(...args); },
            get: (...args) => { assertInitialized(); return FileRegistry.get(...args); },
            create: (...args) => { assertInitialized(); return FileRegistry.create(...args); },
            createMany: (...args) => { assertInitialized(); return FileRegistry.createMany(...args); }
            update: (...args) => { assertInitialized(); return FileRegistry.update(...args); },
            setAccess: (...args) => { assertInitialized(); return FileRegistry.setAccess(...args); },
            remove: (...args) => { assertInitialized(); return FileRegistry.remove(...args); },
            validate: (...args) => FileRegistry.validateTextFile(...args)
        }
    };
})();
