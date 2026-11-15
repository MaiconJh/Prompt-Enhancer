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
        inspectorButton.classList.add('pe-workspace__inspector-toggle');
        explorerToggleButton.prepend(Atoms.icon('panelLeft'));
        inspectorButton.prepend(Atoms.icon('panelRight'));
        focusButton.prepend(Atoms.icon('maximize'));
        explorerToggleButton.setAttribute('aria-expanded', 'true');
        inspectorButton.setAttribute('aria-expanded', 'false');
        focusButton.setAttribute('aria-pressed', 'false');
        tools.append(explorerToggleButton, inspectorButton, focusButton);
        heading.append(title, tools);

        const empty = element('div', 'pe-workspace__empty', I18n.t('ws.editor.empty'));
        const content = element('div', 'pe-workspace__editor-content');
        const path = element('input', 'pe-param-input');
        path.type = 'text';
        path.classList.add('pe-workspace__path-input');
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
                const label = collapsed ? I18n.t('ws.editor.showExplorer') : I18n.t('ws.editor.hideExplorer');
                explorerToggleButton.querySelector('.pe-label').textContent = label;
                explorerToggleButton.title = label;
                explorerToggleButton.setAttribute('aria-label', label);
                explorerToggleButton.setAttribute('aria-expanded', String(!collapsed));
            },
            setInspectorOpen(open) {
                const label = open ? I18n.t('ws.inspector.hide') : I18n.t('ws.inspector.toggle');
                inspectorButton.querySelector('.pe-label').textContent = label;
                inspectorButton.title = label;
                inspectorButton.setAttribute('aria-label', label);
                inspectorButton.setAttribute('aria-expanded', String(open));
            },
            setFocusMode(active) {
                const label = active ? I18n.t('ws.editor.exitFocus') : I18n.t('ws.editor.focus');
                focusButton.querySelector('.pe-label').textContent = label;
                focusButton.title = label;
                focusButton.setAttribute('aria-label', label);
                focusButton.replaceChild(Atoms.icon(active ? 'minimize' : 'maximize'), focusButton.querySelector('.pe-ico'));
                focusButton.setAttribute('aria-pressed', String(active));
            }
        };
    }

    return { create };
})();
