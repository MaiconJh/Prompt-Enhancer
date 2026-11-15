// ===== src/workspace/workspace-controller.js =====
const WorkspaceController = (() => {
    const MAX_FILE_BYTES = 1024 * 1024;
    const TEXT_MIME_TYPES = new Set([
        'application/json',
        'application/xml',
        'application/javascript',
        'application/x-yaml'
    ]);

    function parsePaths(value) {
        return String(value || '').split(/\r?\n/).map(path => path.trim()).filter(Boolean);
    }

    function createFiles(projectId, paths) {
        const entries = Array.isArray(paths) ? paths : parsePaths(paths);
        if (!entries.length) throw new Error(I18n.t('ws.errors.createFileFailed'));
        return Workspace.files.createMany(projectId, entries.map(path => ({
            path,
            content: ''
        })));
    }

    function createFolder(projectId, folderPath, relativePaths) {
        const folder = String(folderPath || '').trim().replace(/\/+$/, '');
        if (!folder) throw new Error(I18n.t('ws.errors.createFileFailed'));
        const names = Array.isArray(relativePaths) ? relativePaths : parsePaths(relativePaths);
        if (!names.length) throw new Error(I18n.t('ws.errors.createFileFailed'));
        return createFiles(projectId, names.map(name => folder + '/' + name));
    }

    async function importFiles(projectId, fileList) {
        const incomingFiles = Array.from(fileList || []);
        if (!incomingFiles.length) return [];

        const batch = [];
        for (const incoming of incomingFiles) {
            if (incoming.size > MAX_FILE_BYTES) {
                throw new Error(incoming.name + ': ' + I18n.t('ws.errors.fileTooLarge'));
            }
            const mime = String(incoming.type || '').toLowerCase();
            const textMime = !mime || mime.startsWith('text/') || TEXT_MIME_TYPES.has(mime);
            if (!textMime) throw new Error(incoming.name + ': ' + I18n.t('ws.errors.textOnly'));

            let content;
            try {
                content = new TextDecoder('utf-8', { fatal: true }).decode(await incoming.arrayBuffer());
            } catch {
                throw new Error(incoming.name + ': ' + I18n.t('ws.errors.textOnly'));
            }

            const path = incoming.webkitRelativePath || incoming.name;
            const validation = Workspace.files.validate({ path, content });
            if (!validation.valid) throw new Error(incoming.name + ': ' + (validation.message || I18n.t('ws.errors.importFailed')));
            batch.push({
                path: validation.path,
                content,
                mimeType: incoming.type || 'text/plain'
            });
        }

        return Workspace.files.createMany(projectId, batch);
    }

    return Object.freeze({ parsePaths, createFiles, createFolder, importFiles });
})();
