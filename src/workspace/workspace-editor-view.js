// ===== src/workspace/workspace-editor-view.js =====
const WorkspaceEditorView = (() => {
    const element = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };

    function create({ labeledField, onSave, onDelete, onToggleExplorer, onToggleFocus, onToggleInspector }) {
        const panel = element('section', 'pe-workspace__editor');
        const heading = element('div', 'pe-workspace__editor-toolbar');
        const title = element('div', 'pe-workspace__section-heading', I18n.t('ws.editor.title'));
        const tools = element('div', 'pe-workspace__editor-tools');
        const explorerToggleButton = Atoms.buttonNode({
            label: I18n.t('ws.editor.toggleExplorer'),
            ariaLabel: I18n.t('ws.editor.toggleExplorer'),
            variant: 'ghost',
            onClick: onToggleExplorer
        });
        const inspectorButton = Atoms.buttonNode({
            label: I18n.t('ws.inspector.toggle'),
            ariaLabel: I18n.t('ws.inspector.toggle'),
            variant: 'ghost',
            onClick: onToggleInspector
        });
        const focusButton = Atoms.buttonNode({
            label: I18n.t('ws.editor.focus'),
            ariaLabel: I18n.t('ws.editor.focus'),
            variant: 'ghost',
            onClick: onToggleFocus
        });
        tools.append(explorerToggleButton, inspectorButton, focusButton);
        heading.append(title, tools);

        const empty = element('div', 'pe-workspace__empty', I18n.t('ws.editor.empty'));
        const content = element('div', 'pe-workspace__editor-content');
        const path = element('input', 'pe-param-input');
        path.type = 'text';
        path.setAttribute('aria-label', I18n.t('ws.editor.path'));
        const contentInput = element('textarea', 'pe-workspace__code');
        contentInput.spellcheck = false;
        contentInput.setAttribute('aria-label', I18n.t('ws.editor.content'));
        const meta = element('div', 'pe-workspace__meta');
        const actions = element('div', 'pe-workspace__editor-actions');
        const deleteButton = Atoms.buttonNode({
            label: I18n.t('ws.files.delete'),
            ariaLabel: I18n.t('ws.files.delete'),
            variant: 'outline',
            onClick: onDelete
        });
        const saveButton = Atoms.buttonNode({
            label: I18n.t('ws.editor.save'),
            ariaLabel: I18n.t('ws.editor.save'),
            variant: 'primary',
            onClick: onSave
        });
        actions.append(deleteButton, saveButton);
        content.append(labeledField('ws.editor.path', path), contentInput, meta, actions);
        panel.append(heading, empty, content);

        return {
            panel,
            empty,
            content,
            path,
            contentInput,
            meta,
            saveButton,
            deleteButton,
            explorerToggleButton,
            focusButton,
            inspectorButton,
            setExplorerCollapsed(collapsed) {
                explorerToggleButton.textContent = collapsed
                    ? I18n.t('ws.editor.showExplorer')
                    : I18n.t('ws.editor.hideExplorer');
                explorerToggleButton.setAttribute('aria-label', explorerToggleButton.textContent);
            },
            setInspectorOpen(open) {
                inspectorButton.textContent = open ? I18n.t('ws.inspector.hide') : I18n.t('ws.inspector.toggle');
                inspectorButton.setAttribute('aria-label', inspectorButton.textContent);
            },
            setFocusMode(active) {
                focusButton.textContent = active ? I18n.t('ws.editor.exitFocus') : I18n.t('ws.editor.focus');
                focusButton.setAttribute('aria-label', focusButton.textContent);
            }
        };
    }

    return { create };
})();
