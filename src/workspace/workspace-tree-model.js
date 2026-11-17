// ===== src/workspace/workspace-tree-model.js =====
const WorkspaceTreeModel = (() => {
    function buildIndex(files = [], folders = []) {
        const root = { id: 'root', name: '', path: '', folders: new Map(), files: [] };
        const ensureFolder = (path, record = null) => {
            const parts = path.split('/').filter(Boolean);
            let node = root;
            let currentPath = '';
            for (const part of parts) {
                currentPath = currentPath ? currentPath + '/' + part : part;
                if (!node.folders.has(part)) {
                    node.folders.set(part, {
                        id: null, name: part, path: currentPath, folders: new Map(), files: [],
                        explicit: false, createdAt: null, updatedAt: null
                    });
                }
                node = node.folders.get(part);
                if (record && currentPath === path) {
                    node.id = record.id;
                    node.explicit = true;
                    node.createdAt = record.createdAt || null;
                    node.updatedAt = record.updatedAt || null;
                }
            }
            return node;
        };

        for (const folder of folders) {
            if (!folder || typeof folder.path !== 'string') continue;
            ensureFolder(folder.path, folder);
        }
        for (const file of files) {
            if (!file || typeof file.path !== 'string') continue;
            const parts = file.path.split('/');
            const parentPath = parts.slice(0, -1).join('/');
            const parent = parentPath ? ensureFolder(parentPath) : root;
            parent.files.push(file);
        }

        const sort = node => {
            node.sortedFolders = [...node.folders.values()].sort((a, b) => a.name.localeCompare(b.name));
            node.sortedFiles = node.files.slice().sort((a, b) => a.name.localeCompare(b.name));
            node.sortedFolders.forEach(sort);
        };
        sort(root);
        return root;
    }

    function flattenVisible(index, options = {}) {
        const expanded = options.expandedPaths && typeof options.expandedPaths.has === 'function'
            ? options.expandedPaths : new Set();
        const query = String(options.searchQuery || '').trim().toLocaleLowerCase();
        const rows = [];
        const matches = new Map();

        if (query) {
            const indexMatches = node => {
                let matched = (node.sortedFiles || []).some(file =>
                    file.path.toLocaleLowerCase().includes(query) || file.name.toLocaleLowerCase().includes(query)
                );
                for (const folder of node.sortedFolders || []) {
                    const descendantsMatch = indexMatches(folder);
                    const folderMatch = folder.path.toLocaleLowerCase().includes(query);
                    matches.set(folder, folderMatch || descendantsMatch);
                    matched = matched || folderMatch || descendantsMatch;
                }
                return matched;
            };
            indexMatches(index);
        }

        const visit = (node, depth, revealAll = false) => {
            for (const folder of node.sortedFolders || []) {
                const folderMatches = query && folder.path.toLocaleLowerCase().includes(query);
                if (query && !revealAll && !matches.get(folder)) continue;
                const isExpanded = query ? true : expanded.has(folder.path);
                const hasChildren = (folder.sortedFolders?.length || 0) + (folder.sortedFiles?.length || 0) > 0;
                rows.push({
                    kind: 'folder',
                    id: folder.id || 'folder:' + folder.path,
                    key: 'folder:' + folder.path,
                    path: folder.path,
                    name: folder.name,
                    depth,
                    expanded: isExpanded,
                    hasChildren,
                    explicit: !!folder.explicit,
                    folder
                });
                if (isExpanded) visit(folder, depth + 1, revealAll || !!folderMatches);
            }

            for (const file of node.sortedFiles || []) {
                if (query && !revealAll && !file.path.toLocaleLowerCase().includes(query)
                    && !file.name.toLocaleLowerCase().includes(query)) continue;
                rows.push({
                    kind: 'file',
                    id: file.id,
                    key: 'file:' + file.id,
                    path: file.path,
                    name: file.name,
                    depth,
                    file
                });
            }
        };

        visit(index, 0);
        return rows;
    }

    return Object.freeze({ buildIndex, flattenVisible });
})();
