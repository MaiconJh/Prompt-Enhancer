// ===== src/workspace/workspace.js =====
const Workspace = (() => {
    let initialized = false;
    async function init() {
        await WorkspaceStorage.open();
        initialized = true;
        return { initialized };
    }
    function assertInitialized() {
        if (!initialized) throw new Error('Workspace ainda não foi inicializado. Execute Workspace.init() primeiro.');
    }
    return {
        init, close() { WorkspaceStorage.close(); initialized = false; }, isInitialized: () => initialized,
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
            update: (...args) => { assertInitialized(); return FileRegistry.update(...args); },
            remove: (...args) => { assertInitialized(); return FileRegistry.remove(...args); },
            validate: (...args) => FileRegistry.validateTextFile(...args)
        }
    };
})();
