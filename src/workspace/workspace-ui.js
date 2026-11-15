// ===== src/workspace/workspace-ui.js =====
const WorkspaceUI = (() => {
    const element = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };

    function render(container) {
        const root = element('section', 'pe-workspace');
        root.setAttribute('aria-label', I18n.t('sm.workspace.title'));
        container.appendChild(root);

        const status = element('div', 'pe-workspace__status');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        root.appendChild(status);

        const header = element('div', 'pe-workspace__header');
        const projectSelect = element('select', 'pe-param-input');
        projectSelect.setAttribute('aria-label', I18n.t('ws.project.select'));
        const createName = element('input', 'pe-param-input');
        createName.type = 'text';
        createName.maxLength = 100;
        createName.placeholder = I18n.t('ws.project.newName');
        const createProjectButton = Atoms.buttonNode({
            label: I18n.t('ws.project.create'),
            ariaLabel: I18n.t('ws.project.create'),
            variant: 'primary',
            onClick: createProject
        });
        const projectDeleteButton = Atoms.buttonNode({
            label: I18n.t('ws.project.delete'),
            ariaLabel: I18n.t('ws.project.delete'),
            variant: 'outline',
            onClick: deleteProject
        });
        const createProjectRow = element('div', 'pe-workspace__create-project');
        createProjectRow.append(createName, createProjectButton);
        header.append(projectSelect, createProjectRow, projectDeleteButton);
        root.appendChild(header);

        const projectSettings = element('section', 'pe-workspace__project-settings');
        const projectName = element('input', 'pe-param-input');
        projectName.type = 'text';
        projectName.maxLength = 100;
        const projectDescription = element('input', 'pe-param-input');
        projectDescription.type = 'text';
        projectDescription.maxLength = 500;
        const accessMode = element('select', 'pe-param-input');
        for (const [value, label] of [
            ['selected', I18n.t('ws.access.selected')],
            ['all', I18n.t('ws.access.all')],
            ['none', I18n.t('ws.access.none')]
        ]) {
            const option = element('option', '', label);
            option.value = value;
            accessMode.appendChild(option);
        }
        const instructions = element('textarea', 'pe-workspace__instructions');
        instructions.maxLength = 20_000;
        const projectSave = Atoms.buttonNode({
            label: I18n.t('ws.project.saveSettings'),
            ariaLabel: I18n.t('ws.project.saveSettings'),
            variant: 'outline',
            onClick: async () => { try { await saveProjectSettings(); } catch (error) { notify(error.message || I18n.t('ws.errors.operationFailed'), 'error'); } }
        });
        projectSettings.append(
            labeledField('ws.project.name', projectName),
            labeledField('ws.project.description', projectDescription),
            labeledField('ws.access.projectMode', accessMode),
            labeledField('ws.project.instructions', instructions),
            projectSave
        );
        root.appendChild(projectSettings);

        const workspaceLayout = element('div', 'pe-workspace__layout');
        const explorer = element('section', 'pe-workspace__explorer');
        const explorerHeader = element('div', 'pe-workspace__section-heading', I18n.t('ws.files.title'));
        const newPath = element('input', 'pe-param-input');
        newPath.type = 'text';
        newPath.placeholder = I18n.t('ws.files.newPath');
        const createFileButton = Atoms.buttonNode({
            label: I18n.t('ws.files.create'),
            ariaLabel: I18n.t('ws.files.create'),
            variant: 'outline',
            onClick: createFile
        });
        const importInput = element('input', 'pe-workspace__file-input');
        importInput.type = 'file';
        importInput.multiple = true;
        importInput.accept = 'text/*,.txt,.md,.json,.js,.mjs,.cjs,.ts,.tsx,.jsx,.html,.css,.scss,.xml,.yml,.yaml,.toml,.ini,.py,.java,.c,.cpp,.h,.sh,.sql,.csv,.properties';
        importInput.setAttribute('aria-label', I18n.t('ws.files.import'));
        const importButton = Atoms.buttonNode({
            label: I18n.t('ws.files.import'),
            ariaLabel: I18n.t('ws.files.import'),
            variant: 'ghost',
            onClick: () => importInput.click()
        });
        const fileActions = element('div', 'pe-workspace__file-actions');
        fileActions.append(newPath, createFileButton, importButton, importInput);
        const tree = element('div', 'pe-workspace__tree');
        tree.setAttribute('role', 'tree');
        tree.setAttribute('aria-label', I18n.t('ws.files.title'));
        explorer.append(explorerHeader, fileActions, tree);
        workspaceLayout.appendChild(explorer);

        const editorPanel = element('section', 'pe-workspace__editor');
        const editorHeading = element('div', 'pe-workspace__section-heading', I18n.t('ws.editor.title'));
        const editorEmpty = element('div', 'pe-workspace__empty', I18n.t('ws.editor.empty'));
        const editor = element('div', 'pe-workspace__editor-content');
        const filePath = element('input', 'pe-param-input');
        filePath.type = 'text';
        const fileContent = element('textarea', 'pe-workspace__code');
        fileContent.spellcheck = false;
        fileContent.setAttribute('aria-label', I18n.t('ws.editor.content'));
        const fileMeta = element('div', 'pe-workspace__meta');
        const fileAccess = element('select', 'pe-param-input');
        for (const [value, label] of [['allowed', I18n.t('ws.access.allowed')], ['denied', I18n.t('ws.access.denied')]]) {
            const option = element('option', '', label);
            option.value = value;
            fileAccess.appendChild(option);
        }
        const accessHint = element('div', 'pe-workspace__hint');
        const editorActions = element('div', 'pe-workspace__editor-actions');
        const fileDeleteButton = Atoms.buttonNode({
            label: I18n.t('ws.files.delete'),
            ariaLabel: I18n.t('ws.files.delete'),
            variant: 'outline',
            onClick: deleteFile
        });
        const fileSaveButton = Atoms.buttonNode({
            label: I18n.t('ws.editor.save'),
            ariaLabel: I18n.t('ws.editor.save'),
            variant: 'primary',
            onClick: saveFile
        });
        editorActions.append(fileDeleteButton, fileSaveButton);
        editor.append(
            labeledField('ws.editor.path', filePath),
            fileContent,
            fileMeta,
            labeledField('ws.access.filePermission', fileAccess),
            accessHint,
            editorActions
        );
        editorPanel.append(editorHeading, editorEmpty, editor);
        workspaceLayout.appendChild(editorPanel);
        root.appendChild(workspaceLayout);

        let projects = [];
        let currentProject = null;
        let files = [];
        let selectedFile = null;
        let loading = false;

        function labeledField(key, control) {
            const wrapper = element('label', 'pe-workspace__field');
            wrapper.append(element('span', 'pe-workspace__label', I18n.t(key)), control);
            return wrapper;
        }

        function notify(message, type = 'info') {
            Molecules.toast(message, type);
        }

        function showStatus(message, type = '') {
            status.textContent = message || '';
            status.dataset.state = type;
        }

        function fileDirty() {
            return !!selectedFile && (filePath.value !== selectedFile.path || fileContent.value !== selectedFile.content);
        }

        function projectDirty() {
            if (!currentProject) return false;
            return projectName.value !== currentProject.name
                || projectDescription.value !== (currentProject.description || '')
                || accessMode.value !== (currentProject.settings?.aiAccessMode || 'selected')
                || instructions.value !== (currentProject.settings?.instructions || '');
        }

        function updateEditorState() {
            const hasFile = !!selectedFile;
            editorEmpty.hidden = hasFile;
            editor.hidden = !hasFile;
            fileSaveButton.disabled = !hasFile || !fileDirty() || loading;
            fileDeleteButton.disabled = !hasFile || loading;
            const effectiveMode = currentProject?.settings?.aiAccessMode || 'selected';
            fileAccess.disabled = !hasFile || loading || effectiveMode !== 'selected';
            fileMeta.textContent = hasFile
                ? (selectedFile.extension || I18n.t('ws.editor.noExtension')) + ' · ' + Utils.formatBytes(new TextEncoder().encode(fileContent.value).byteLength)
                : '';
            if (effectiveMode === 'none') accessHint.textContent = I18n.t('ws.access.overriddenNone');
            else if (effectiveMode === 'all') accessHint.textContent = I18n.t('ws.access.overriddenAll');
            else accessHint.textContent = I18n.t('ws.access.selectedHint');
        }

        function updateProjectControls() {
            const hasProject = !!currentProject;
            projectSettings.hidden = !hasProject;
            workspaceLayout.hidden = !hasProject;
            projectDeleteButton.disabled = !hasProject || loading;
            createFileButton.disabled = !hasProject || loading;
            importButton.disabled = !hasProject || loading;
            projectSave.disabled = !hasProject || !projectDirty() || loading;
            updateEditorState();
        }

        function buildTree() {
            tree.replaceChildren();
            if (!currentProject) return;
            if (!files.length) {
                tree.appendChild(element('div', 'pe-workspace__empty', I18n.t('ws.files.empty')));
                return;
            }
            const rootNode = { folders: new Map(), files: [] };
            for (const file of files) {
                const parts = file.path.split('/');
                let node = rootNode;
                for (const part of parts.slice(0, -1)) {
                    if (!node.folders.has(part)) node.folders.set(part, { folders: new Map(), files: [] });
                    node = node.folders.get(part);
                }
                node.files.push(file);
            }
            const renderNode = (node, depth) => {
                const fragment = document.createDocumentFragment();
                const folders = [...node.folders.entries()].sort(([a], [b]) => a.localeCompare(b));
                for (const [name, child] of folders) {
                    const details = element('details', 'pe-workspace__folder');
                    details.open = true;
                    const summary = element('summary', 'pe-workspace__folder-name', name);
                    summary.style.paddingInlineStart = (depth * 14 + 8) + 'px';
                    details.appendChild(summary);
                    details.appendChild(renderNode(child, depth + 1));
                    fragment.appendChild(details);
                }
                const sortedFiles = node.files.slice().sort((a, b) => a.name.localeCompare(b.name));
                for (const file of sortedFiles) {
                    const row = element('button', 'pe-workspace__file', file.name);
                    row.type = 'button';
                    row.setAttribute('role', 'treeitem');
                    row.setAttribute('aria-level', String(depth + 1));
                    row.setAttribute('aria-selected', String(selectedFile?.id === file.id));
                    row.title = file.path;
                    row.style.paddingInlineStart = (depth * 14 + 8) + 'px';
                    const mode = currentProject?.settings?.aiAccessMode || 'selected';
                    const effectiveAllowed = mode === 'all' || (mode === 'selected' && file.aiAccess === 'allowed');
                    const access = element('span', 'pe-workspace__file-access ' + (effectiveAllowed ? 'is-allowed' : 'is-denied'),
                        effectiveAllowed ? I18n.t('ws.access.allowedShort') : I18n.t('ws.access.deniedShort'));
                    row.appendChild(access);
                    row.addEventListener('click', () => selectFile(file.id));
                    fragment.appendChild(row);
                }
                return fragment;
            };
            tree.appendChild(renderNode(rootNode, 0));
        }

        function fillProject(project) {
            currentProject = project;
            projectName.value = project?.name || '';
            projectDescription.value = project?.description || '';
            accessMode.value = project?.settings?.aiAccessMode || 'selected';
            instructions.value = project?.settings?.instructions || '';
            updateProjectControls();
        }

        async function refreshProjects(preferredId = Workspace.getActiveProjectId()) {
            projects = await Workspace.projects.list();
            projectSelect.replaceChildren();
            const none = element('option', '', I18n.t('sm.workspace.none'));
            none.value = '';
            projectSelect.appendChild(none);
            for (const project of projects) {
                const option = element('option', '', project.name);
                option.value = project.id;
                projectSelect.appendChild(option);
            }
            projectSelect.value = preferredId || '';
            if (preferredId && !projects.some(project => project.id === preferredId)) {
                const missing = element('option', '', I18n.t('sm.workspace.selectError'));
                missing.value = preferredId;
                projectSelect.appendChild(missing);
                projectSelect.value = preferredId;
            }
        }

        async function refreshFiles() {
            if (!currentProject) { files = []; buildTree(); return; }
            files = await Workspace.files.list(currentProject.id);
            buildTree();
        }

        async function loadProject(projectId) {
            loading = true;
            showStatus(I18n.t('ws.status.loadingProject'));
            updateProjectControls();
            try {
                if (!projectId) {
                    fillProject(null);
                    files = [];
                    selectedFile = null;
                    buildTree();
                    filePath.value = '';
                    fileContent.value = '';
                    updateProjectControls();
                    showStatus(I18n.t('ws.status.noProject'));
                    return;
                }
                fillProject(null);
                files = [];
                selectedFile = null;
                filePath.value = '';
                fileContent.value = '';
                buildTree();
                const project = await Workspace.projects.get(projectId);
                if (!project) throw new Error(I18n.t('ws.errors.projectMissing'));
                fillProject(project);
                selectedFile = null;
                filePath.value = '';
                fileContent.value = '';
                await refreshFiles();
                showStatus(files.length ? I18n.t('ws.status.projectReady') : I18n.t('ws.status.noFiles'));
            } catch (error) {
                showStatus(error.message || I18n.t('ws.errors.loadFailed'), 'error');
                notify(error.message || I18n.t('ws.errors.loadFailed'), 'error');
            } finally {
                loading = false;
                updateProjectControls();
                buildTree();
            }
        }

        function askChoice(title, message, choices) {
            return new Promise(resolve => {
                const dialog = element('div', 'pe-workspace__dialog');
                dialog.setAttribute('role', 'alertdialog');
                dialog.setAttribute('aria-modal', 'true');
                dialog.append(element('strong', 'pe-workspace__dialog-title', title));
                dialog.append(element('p', 'pe-workspace__dialog-message', message));
                const actions = element('div', 'pe-workspace__dialog-actions');
                for (const choice of choices) {
                    const button = Atoms.buttonNode({
                        label: choice.label,
                        ariaLabel: choice.label,
                        variant: choice.variant || 'outline',
                        onClick: async () => {
                            if (choice.action) {
                                button.disabled = true;
                                try {
                                    const result = await choice.action();
                                    dialog.remove();
                                    resolve(result);
                                } catch (error) {
                                    button.disabled = false;
                                    notify(error.message || I18n.t('ws.errors.operationFailed'), 'error');
                                }
                            } else {
                                dialog.remove();
                                resolve(choice.value);
                            }
                        }
                    });
                    actions.appendChild(button);
                }
                dialog.appendChild(actions);
                root.appendChild(dialog);
                actions.querySelector('button')?.focus();
            });
        }

        async function saveDrafts() {
            if (projectDirty()) await saveProjectSettings();
            if (fileDirty()) await saveFile();
            return true;
        }

        async function confirmLeave() {
            if (!projectDirty() && !fileDirty()) return true;
            const result = await askChoice(
                I18n.t('ws.dirty.title'),
                I18n.t('ws.dirty.message'),
                [
                    { label: I18n.t('ws.dirty.save'), variant: 'primary', action: async () => { await saveDrafts(); return true; } },
                    { label: I18n.t('ws.dirty.discard'), value: 'discard' },
                    { label: I18n.t('ws.dirty.cancel'), value: false }
                ]
            );
            if (result === 'discard') {
                if (currentProject) await loadProject(currentProject.id);
                else { selectedFile = null; fileContent.value = ''; filePath.value = ''; }
                return true;
            }
            return result === true;
        }

        async function confirmLeaveFile() {
            if (!fileDirty()) return true;
            const result = await askChoice(
                I18n.t('ws.dirty.title'),
                I18n.t('ws.dirty.fileMessage'),
                [
                    { label: I18n.t('ws.dirty.save'), variant: 'primary', action: async () => { await saveFile(); return true; } },
                    { label: I18n.t('ws.dirty.discard'), value: true },
                    { label: I18n.t('ws.dirty.cancel'), value: false }
                ]
            );
            return result === true;
        }

        async function selectFile(fileId) {
            if (!await confirmLeave()) return;
            loading = true;
            updateEditorState();
            try {
                const file = await Workspace.files.get(currentProject.id, fileId);
                if (!file) throw new Error(I18n.t('ws.errors.fileMissing'));
                selectedFile = file;
                filePath.value = file.path;
                fileContent.value = file.content;
                updateEditorState();
                buildTree();
            } catch (error) {
                showStatus(error.message || I18n.t('ws.errors.readFailed'), 'error');
                notify(error.message || I18n.t('ws.errors.readFailed'), 'error');
            } finally {
                loading = false;
                updateEditorState();
            }
        }

        async function saveProjectSettings() {
            if (!currentProject) return;
            const updated = await Workspace.projects.update(currentProject.id, {
                name: projectName.value.trim(),
                description: projectDescription.value.trim(),
                settings: {
                    ...(currentProject.settings || {}),
                    aiAccessMode: accessMode.value,
                    instructions: instructions.value
                }
            });
            fillProject(updated);
            projects = projects.map(project => project.id === updated.id ? updated : project);
            await refreshProjects(updated.id);
            updateEditorState();
            notify(I18n.t('ws.project.saved'), 'success');
            return updated;
        }

        async function saveFile() {
            if (!selectedFile) return false;
            loading = true;
            updateEditorState();
            try {
                const updated = await Workspace.files.update(currentProject.id, selectedFile.id, {
                    path: filePath.value.trim(),
                    content: fileContent.value
                });
                selectedFile = { ...updated, content: fileContent.value };
                await refreshFiles();
                buildTree();
                updateEditorState();
                showStatus(I18n.t('ws.editor.saved'));
                notify(I18n.t('ws.editor.saved'), 'success');
                return true;
            } catch (error) {
                showStatus(error.message || I18n.t('ws.errors.saveFailed'), 'error');
                notify(error.message || I18n.t('ws.errors.saveFailed'), 'error');
                throw error;
            } finally {
                loading = false;
                updateEditorState();
            }
        }

        async function createProject() {
            if (!await confirmLeave()) return;
            const name = createName.value.trim();
            if (!name) { createName.focus(); return; }
            loading = true;
            createProjectButton.disabled = true;
            try {
                const project = await Workspace.projects.create({ name });
                await Workspace.setActiveProjectId(project.id);
                createName.value = '';
                await refreshProjects(project.id);
                await loadProject(project.id);
                notify(I18n.t('sm.workspace.created'), 'success');
            } catch (error) {
                notify(error.message || I18n.t('ws.errors.createProjectFailed'), 'error');
            } finally {
                loading = false;
                createProjectButton.disabled = false;
            }
        }

        async function changeProject(projectId) {
            if (!await confirmLeave()) {
                projectSelect.value = currentProject?.id || '';
                return;
            }
            try {
                await Workspace.setActiveProjectId(projectId || null);
                await loadProject(projectId || null);
            } catch (error) {
                projectSelect.value = currentProject?.id || '';
                notify(error.message || I18n.t('sm.workspace.selectError'), 'error');
            }
        }

        async function deleteProject() {
            if (!currentProject || !await confirmLeave()) return;
            const confirmed = await askChoice(
                I18n.t('ws.project.deleteTitle'),
                I18n.t('ws.project.deleteMessage'),
                [
                    { label: I18n.t('ws.project.cancel'), value: false },
                    { label: I18n.t('ws.project.delete'), variant: 'primary', action: async () => {
                        await Workspace.projects.remove(currentProject.id);
                        if (Workspace.getActiveProjectId() === currentProject.id) await Workspace.setActiveProjectId(null);
                        return true;
                    } }
                ]
            );
            if (!confirmed) return;
            await refreshProjects(null);
            await loadProject(null);
            notify(I18n.t('ws.project.deleted'), 'success');
        }

        async function createFile() {
            if (!currentProject || !await confirmLeave()) return;
            const path = newPath.value.trim();
            if (!path) { newPath.focus(); return; }
            try {
                const created = await Workspace.files.create(currentProject.id, { path, content: '' });
                newPath.value = '';
                await refreshFiles();
                await selectFile(created.id);
                notify(I18n.t('ws.files.created'), 'success');
            } catch (error) {
                notify(error.message || I18n.t('ws.errors.createFileFailed'), 'error');
            }
        }

        async function importFiles(fileList) {
            if (!currentProject || !fileList?.length || !await confirmLeave()) return;
            let imported = 0;
            const existing = new Set(files.map(file => file.path));
            for (const incoming of Array.from(fileList)) {
                try {
                    const content = await incoming.text();
                    const validation = Workspace.files.validate({ path: incoming.name, content });
                    if (!validation.valid) throw new Error(validation.message);
                    if (existing.has(validation.path)) throw new Error(I18n.t('ws.errors.duplicatePath', { path: validation.path }));
                    await Workspace.files.create(currentProject.id, {
                        path: validation.path,
                        content,
                        mimeType: incoming.type || 'text/plain'
                    });
                    existing.add(validation.path);
                    imported++;
                } catch (error) {
                    notify(incoming.name + ': ' + (error.message || I18n.t('ws.errors.importFailed')), 'error');
                }
            }
            await refreshFiles();
            showStatus(I18n.t('ws.files.importSummary', { count: imported }));
            if (imported) notify(I18n.t('ws.files.importSummary', { count: imported }), 'success');
        }

        async function deleteFile() {
            if (!selectedFile || !await confirmLeave()) return;
            const confirmed = await askChoice(
                I18n.t('ws.files.deleteTitle'),
                I18n.t('ws.files.deleteMessage', { path: selectedFile.path }),
                [
                    { label: I18n.t('ws.project.cancel'), value: false },
                    { label: I18n.t('ws.files.delete'), variant: 'primary', action: async () => {
                        await Workspace.files.remove(currentProject.id, selectedFile.id);
                        return true;
                    } }
                ]
            );
            if (!confirmed) return;
            selectedFile = null;
            filePath.value = '';
            fileContent.value = '';
            await refreshFiles();
            updateEditorState();
            notify(I18n.t('ws.files.deleted'), 'success');
        }

        async function changeFileAccess() {
            if (!selectedFile || accessMode.value !== 'selected') return;
            const previous = selectedFile.aiAccess || 'denied';
            try {
                const updated = await Workspace.files.setAccess(currentProject.id, selectedFile.id, fileAccess.value);
                selectedFile = { ...selectedFile, ...updated };
                await refreshFiles();
                buildTree();
                updateEditorState();
                notify(I18n.t('ws.access.saved'), 'success');
            } catch (error) {
                fileAccess.value = previous;
                notify(error.message || I18n.t('ws.errors.permissionFailed'), 'error');
            }
        }

        projectSelect.addEventListener('change', () => changeProject(projectSelect.value));
        createName.addEventListener('keydown', event => { if (event.key === 'Enter') createProject(); });
        projectName.addEventListener('input', updateProjectControls);
        projectDescription.addEventListener('input', updateProjectControls);
        instructions.addEventListener('input', updateProjectControls);
        accessMode.addEventListener('change', updateProjectControls);
        filePath.addEventListener('input', updateEditorState);
        fileContent.addEventListener('input', updateEditorState);
        fileAccess.addEventListener('change', changeFileAccess);
        importInput.addEventListener('change', async () => {
            await importFiles(importInput.files);
            importInput.value = '';
        });

        async function initialize() {
            try {
                showStatus(I18n.t('ws.status.initializing'));
                if (!Workspace.isInitialized()) await Workspace.init();
                await refreshProjects();
                await loadProject(Workspace.getActiveProjectId());
            } catch (error) {
                showStatus(error.message || I18n.t('ws.errors.initializeFailed'), 'error');
                const retry = Atoms.buttonNode({
                    label: I18n.t('ws.status.retry'),
                    ariaLabel: I18n.t('ws.status.retry'),
                    variant: 'outline',
                    onClick: initialize
                });
                status.appendChild(retry);
            }
        }

        updateProjectControls();
        initialize();
        return { refresh: initialize };
    }

    return { render };
})();
