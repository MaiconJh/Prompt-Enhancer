// ===== src/workspace/workspace-inspector-view.js =====
const WorkspaceInspectorView = (() => {
    function create({ sections = [], onClose }) {
        const panel = document.createElement('aside');
        panel.className = 'pe-workspace__inspector';
        panel.hidden = true;
        panel.setAttribute('aria-label', I18n.t('ws.inspector.title'));
        panel.setAttribute('aria-hidden', 'true');

        const header = document.createElement('div');
        header.className = 'pe-workspace__inspector-header';
        const title = document.createElement('strong');
        title.textContent = I18n.t('ws.inspector.title');
        const close = Atoms.buttonNode({
            label: I18n.t('ws.inspector.close'),
            ariaLabel: I18n.t('ws.inspector.close'),
            variant: 'ghost',
            onClick: onClose
        });
        header.append(title, close);
        panel.appendChild(header);
        for (const section of sections) panel.appendChild(section);

        return {
            panel,
            setOpen(open) {
                panel.hidden = !open;
                panel.setAttribute('aria-hidden', String(!open));
            }
        };
    }

    return { create };
})();
