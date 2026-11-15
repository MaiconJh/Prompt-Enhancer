// ===== src/workspace/workspace-tree-model.js =====
const WorkspaceTreeModel = (() => {
    function buildIndex(files = []) {
        const root = { name: '', path: '', folders: new Map(), files: [] };
        for (const file of files) {
            if (!file || typeof file.path !== 'string') continue;
            const parts = file.path.split('/');
            let node = root;
            let path = '';
            for (const part of parts.slice(0, -1)) {
                path = path ? path + '/' + part : part;
                if (!node.folders.has(part)) node.folders.set(part, { name: part, path, folders: new Map(), files: [] });
                node = node.folders.get(part);
            }
            node.files.push(file);
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
        const expanded = options.expandedPaths instanceof Set ? options.expandedPaths : new Set();
        const query = String(options.searchQuery || '').trim().toLocaleLowerCase();
        const rows = [];
        const hasMatchingDescendant = (node, value) => {
            if ((node.sortedFiles || []).some(file => file.path.toLocaleLowerCase().includes(value))) return true;
            return (node.sortedFolders || []).some(folder =>
                folder.path.toLocaleLowerCase().includes(value) || hasMatchingDescendant(folder, value)
            );
        };
        const visit = (node, depth) => {
            for (const folder of node.sortedFolders || []) {
                const matchingFiles = query ? hasMatchingDescendant(folder, query) : true;
                const folderMatches = query && folder.path.toLocaleLowerCase().includes(query);
                if (query && !matchingFiles && !folderMatches) continue;
                const isExpanded = query ? true : expanded.has(folder.path);
                rows.push({ kind: 'folder', key: 'folder:' + folder.path, path: folder.path, name: folder.name, depth, expanded: isExpanded });
                if (isExpanded) visit(folder, depth + 1);
            }
            for (const file of node.sortedFiles || []) {
                if (query && !file.path.toLocaleLowerCase().includes(query)) continue;
                rows.push({ kind: 'file', key: 'file:' + file.id, id: file.id, path: file.path, name: file.name, depth, file });
            }
        };
        visit(index, 0);
        return rows;
    }

    return { buildIndex, flattenVisible };
})();
