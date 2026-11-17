// ===== src/workspace/projects-main.js =====
const ProjectsMain = (() => {
    const element = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };

    function render(container, { onOpenProject, onDeleteProject } = {}) {
        const root = element('section', 'pe-projects-main');
        root.setAttribute('aria-label', I18n.t('sm.projects.title'));

        const header = element('header', 'pe-projects-main__header');
        const identity = element('div', 'pe-projects-main__identity');
        const brand = element('span', 'pe-projects-main__brand', 'PROMPT ENHANCER');
        const subtitle = element('span', 'pe-projects-main__eyebrow', I18n.t('sm.projects.eyebrow'));
        identity.append(brand, subtitle);

        const actions = element('div', 'pe-projects-main__actions');
        const themeButton = Atoms.buttonNode({
            label: I18n.t('sm.projects.theme'),
            ariaLabel: I18n.t('sm.projects.theme'),
            variant: 'ghost',
            onClick: () => Theme.cycle()
        });
        themeButton.prepend(document.createTextNode('◐ '));
        const search = element('input', 'pe-param-input pe-projects-main__search');
        search.type = 'search';
        search.placeholder = I18n.t('sm.projects.search');
        search.setAttribute('aria-label', I18n.t('sm.projects.search'));
        const sort = element('select', 'pe-param-input pe-projects-main__sort');
        sort.setAttribute('aria-label', I18n.t('sm.projects.sort'));
        for (const [value, label] of [
            ['recent', I18n.t('sm.projects.sortRecent')],
            ['name', I18n.t('sm.projects.sortName')],
            ['created', I18n.t('sm.projects.sortCreated')]
        ]) {
            const option = element('option', '', label);
            option.value = value;
            sort.appendChild(option);
        }
        const create = Atoms.buttonNode({
            label: I18n.t('sm.projects.create'),
            ariaLabel: I18n.t('sm.projects.create'),
            variant: 'primary',
            onClick: createProject
        });
        create.prepend(document.createTextNode('+ '));
        actions.append(themeButton, search, sort, create);
        header.append(identity, actions);

        const intro = element('div', 'pe-projects-main__intro');
        const title = element('h2', '', I18n.t('sm.projects.heading'));
        const description = element('p', '', I18n.t('sm.projects.description'));
        intro.append(title, description);

        const status = element('div', 'pe-projects-main__status');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        const grid = element('div', 'pe-projects-main__grid');
        grid.setAttribute('role', 'list');
        root.append(header, intro, status, grid);
        container.appendChild(root);

        let projects = [];
        let loading = false;

        function showStatus(message, isError = false) {
            status.textContent = message || '';
            status.classList.toggle('is-error', isError);
        }

        function getVisibleProjects() {
            const query = search.value.trim().toLocaleLowerCase();
            const filtered = projects.filter(project =>
                !query || [project.name, project.description]
                    .some(value => String(value || '').toLocaleLowerCase().includes(query))
            );
            const mode = sort.value;
            return filtered.sort((a, b) => {
                if (mode === 'name') return a.name.localeCompare(b.name);
                if (mode === 'created') return (b.createdAt || 0) - (a.createdAt || 0);
                return (b.updatedAt || 0) - (a.updatedAt || 0);
            });
        }

        function renderCards() {
            grid.replaceChildren();
            const visible = getVisibleProjects();
            if (!visible.length) {
                const empty = element('div', 'pe-projects-main__empty');
                empty.append(
                    element('strong', '', search.value.trim() ? I18n.t('sm.projects.noResults') : I18n.t('sm.projects.empty')),
                    element('p', '', search.value.trim() ? I18n.t('sm.projects.noResultsHint') : I18n.t('sm.projects.emptyHint'))
                );
                grid.appendChild(empty);
                return;
            }

            for (const project of visible) {
                const card = element('article', 'pe-project-card');
                card.setAttribute('role', 'listitem');
                const cardTop = element('div', 'pe-project-card__top');
                const icon = element('span', 'pe-project-card__icon');
                icon.appendChild(Atoms.icon('folder'));
                const menu = element('div', 'pe-project-card__menu');
                const menuButton = Atoms.buttonNode({
                    label: '⋯',
                    ariaLabel: I18n.t('sm.projects.projectActions', { name: project.name }),
                    variant: 'ghost',
                    onClick: () => {
                        menuPanel.hidden = !menuPanel.hidden;
                        menuButton.setAttribute('aria-expanded', String(!menuPanel.hidden));
                    }
                });
                const menuPanel = element('div', 'pe-project-card__menu-panel');
                menuPanel.hidden = true;
                const rename = Atoms.buttonNode({
                    label: I18n.t('sm.projects.rename'),
                    ariaLabel: I18n.t('sm.projects.rename'),
                    variant: 'ghost',
                    onClick: async () => {
                        menuPanel.hidden = true;
                        const nextName = window.prompt(I18n.t('sm.projects.renamePrompt'), project.name);
                        if (nextName == null) return;
                        const name = nextName.trim();
                        if (!name || name === project.name) return;
                        try {
                            await Workspace.projects.update(project.id, { name });
                            await refresh();
                        } catch (error) {
                            showStatus(error.message || I18n.t('ws.errors.operationFailed'), true);
                        }
                    }
                });
                const remove = Atoms.buttonNode({
                    label: I18n.t('sm.projects.delete'),
                    ariaLabel: I18n.t('sm.projects.delete'),
                    variant: 'ghost',
                    onClick: async () => {
                        menuPanel.hidden = true;
                        if (!window.confirm(I18n.t('ws.project.deleteMessage'))) return;
                        try {
                            const removed = await Workspace.projects.remove(project.id);
                            if (!removed) throw new Error(I18n.t('ws.errors.projectMissing'));
                            onDeleteProject?.(project.id);
                            await refresh();
                        } catch (error) {
                            showStatus(error.message || I18n.t('ws.errors.operationFailed'), true);
                        }
                    }
                });
                remove.classList.add('is-danger');
                menuPanel.append(rename, remove);
                menu.append(menuButton, menuPanel);
                cardTop.append(icon, menu);

                const open = element('button', 'pe-project-card__open');
                open.type = 'button';
                open.append(
                    element('strong', 'pe-project-card__name', project.name),
                    element('span', 'pe-project-card__description', project.description || I18n.t('sm.projects.noDescription'))
                );
                open.addEventListener('click', () => onOpenProject?.(project.id));
                const meta = element('div', 'pe-project-card__meta');
                const updated = project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : I18n.t('sm.projects.justCreated');
                meta.append(element('span', '', I18n.t('sm.projects.updated', { date: updated })));
                const openLabel = element('span', 'pe-project-card__open-label', I18n.t('sm.projects.open'));
                meta.appendChild(openLabel);
                card.append(cardTop, open, meta);
                grid.appendChild(card);
            }
        }

        async function refresh() {
            if (loading) return;
            loading = true;
            create.disabled = true;
            showStatus(I18n.t('sm.projects.loading'));
            try {
                if (!Workspace.isInitialized()) await Workspace.init();
                projects = await Workspace.projects.list();
                renderCards();
                showStatus('');
            } catch (error) {
                showStatus(error.message || I18n.t('ws.errors.initializeFailed'), true);
            } finally {
                loading = false;
                create.disabled = false;
            }
        }

        async function createProject() {
            const name = window.prompt(I18n.t('sm.projects.createPrompt'));
            if (name == null || !name.trim()) return;
            loading = true;
            create.disabled = true;
            try {
                if (!Workspace.isInitialized()) await Workspace.init();
                const project = await Workspace.projects.create({ name: name.trim() });
                loading = false;
                await refresh();
                onOpenProject?.(project.id);
            } catch (error) {
                showStatus(error.message || I18n.t('ws.errors.createProjectFailed'), true);
            } finally {
                loading = false;
                create.disabled = false;
            }
        }

        search.addEventListener('input', renderCards);
        sort.addEventListener('change', renderCards);
        refresh();

        return { root, refresh, getState: () => ({ query: search.value, sort: sort.value, scrollTop: root.scrollTop }) };
    }

    return Object.freeze({ render });
})();
