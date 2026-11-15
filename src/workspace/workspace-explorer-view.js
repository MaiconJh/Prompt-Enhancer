// ===== src/workspace/workspace-explorer-view.js =====
const WorkspaceExplorerView = (() => {
    const ROW_HEIGHT = 30;
    const VIRTUALIZATION_THRESHOLD = 300;
    const OVERSCAN = 8;
    const states = new WeakMap();

    function createRow(row, index, options) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = row.kind === 'folder' ? 'pe-workspace__folder-row' : 'pe-workspace__file';
        button.dataset.rowIndex = String(index);
        button.dataset.rowKey = row.key;
        button.dataset.rowKind = row.kind;
        button.dataset.rowPath = row.path;
        button.setAttribute('role', 'treeitem');
        button.setAttribute('aria-level', String(row.depth + 1));
        button.tabIndex = row.kind === 'file' && options.selectedFileId === row.id ? 0 : -1;
        button.style.paddingInlineStart = (row.depth * 14 + 8) + 'px';

        if (row.kind === 'folder') {
            button.setAttribute('aria-expanded', String(row.expanded));
            const marker = document.createElement('span');
            marker.className = 'pe-workspace__folder-marker';
            marker.textContent = row.expanded ? '▾' : '▸';
            const label = document.createElement('span');
            label.className = 'pe-workspace__tree-label';
            label.textContent = row.name;
            button.append(marker, label);
            return button;
        }

        button.dataset.fileId = row.id;
        button.setAttribute('aria-selected', String(options.selectedFileId === row.id));
        button.title = row.path;
        const label = document.createElement('span');
        label.className = 'pe-workspace__tree-label';
        label.textContent = row.name;
        const mode = options.project?.settings?.aiAccessMode || 'selected';
        const allowed = mode === 'all' || (mode === 'selected' && row.file.aiAccess === 'allowed');
        const access = document.createElement('span');
        access.className = 'pe-workspace__file-access ' + (allowed ? 'is-allowed' : 'is-denied');
        access.textContent = allowed ? I18n.t('ws.access.allowedShort') : I18n.t('ws.access.deniedShort');
        button.append(label, access);
        return button;
    }

    function renderRows(container, state) {
        const { rows, options } = state;
        const virtualized = rows.length > VIRTUALIZATION_THRESHOLD;
        const scrollTop = container.scrollTop;
        const viewportHeight = container.clientHeight || 360;
        const start = virtualized ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN) : 0;
        const end = virtualized ? Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN) : rows.length;
        const fragment = document.createDocumentFragment();

        if (!rows.length) {
            const empty = document.createElement('div');
            empty.className = 'pe-workspace__empty';
            empty.textContent = options.files.length ? I18n.t('ws.files.noMatches') : I18n.t('ws.files.empty');
            fragment.appendChild(empty);
        } else {
            if (virtualized && start > 0) {
                const spacer = document.createElement('div');
                spacer.className = 'pe-workspace__tree-spacer';
                spacer.style.height = (start * ROW_HEIGHT) + 'px';
                spacer.setAttribute('aria-hidden', 'true');
                fragment.appendChild(spacer);
            }
            for (let index = start; index < end; index++) fragment.appendChild(createRow(rows[index], index, options));
            if (virtualized && end < rows.length) {
                const spacer = document.createElement('div');
                spacer.className = 'pe-workspace__tree-spacer';
                spacer.style.height = ((rows.length - end) * ROW_HEIGHT) + 'px';
                spacer.setAttribute('aria-hidden', 'true');
                fragment.appendChild(spacer);
            }
        }
        container.replaceChildren(fragment);
        if (!container.querySelector('[tabindex="0"]')) container.querySelector('[data-row-index]')?.setAttribute('tabindex', '0');
        container.dataset.virtualized = String(virtualized);
        state.start = start;
        state.end = end;
    }

    function updateRows(state) {
        state.rows = WorkspaceTreeModel.flattenVisible(state.index || WorkspaceTreeModel.buildIndex([]), {
            expandedPaths: state.expandedPaths,
            searchQuery: state.options.searchQuery
        });
    }

    function render(container, options = {}) {
        let state = states.get(container);
        if (!state) {
            state = { expandedPaths: new Set(), files: null, index: null, rows: [], options: {}, start: 0, end: 0, lastSelectedFileId: null };
            states.set(container, state);
            state.onScroll = () => { if (container.dataset.virtualized === 'true') renderRows(container, state); };
            state.onClick = event => {
                const row = event.target.closest('[data-row-kind]');
                if (!row || !container.contains(row)) return;
                if (row.dataset.rowKind === 'folder') {
                    const path = row.dataset.rowPath;
                    const rowIndex = Number(row.dataset.rowIndex);
                    if (state.expandedPaths.has(path)) state.expandedPaths.delete(path);
                    else state.expandedPaths.add(path);
                    updateRows(state);
                    renderRows(container, state);
                    container.querySelector('[data-row-index="' + rowIndex + '"]')?.focus();
                } else state.options.onSelect?.(row.dataset.fileId);
            };
            state.onKeyDown = event => {
                const current = event.target.closest('[data-row-index]');
                if (!current) return;
                const index = Number(current.dataset.rowIndex);
                const row = state.rows[index];
                let next = null;

                if (event.key === 'ArrowDown') next = Math.min(state.rows.length - 1, index + 1);
                else if (event.key === 'ArrowUp') next = Math.max(0, index - 1);
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = state.rows.length - 1;
                else if (event.key === 'ArrowRight' && row?.kind === 'folder') {
                    if (!row.expanded) {
                        state.expandedPaths.add(row.path);
                        updateRows(state);
                        renderRows(container, state);
                        container.querySelector('[data-row-index="' + index + '"]')?.focus();
                    } else if (state.rows[index + 1]?.depth > row.depth) next = index + 1;
                    event.preventDefault();
                    if (next === null) return;
                } else if (event.key === 'ArrowLeft') {
                    if (row?.kind === 'folder' && row.expanded) {
                        state.expandedPaths.delete(row.path);
                        updateRows(state);
                        renderRows(container, state);
                        container.querySelector('[data-row-index="' + index + '"]')?.focus();
                    } else {
                        const parentPath = row?.path.split('/').slice(0, -1).join('/');
                        const parentIndex = state.rows.findIndex(item => item.kind === 'folder' && item.path === parentPath);
                        if (parentIndex >= 0) next = parentIndex;
                    }
                    event.preventDefault();
                    if (next === null) return;
                } else if (event.key === 'Enter' || event.key === ' ') {
                    current.click();
                    event.preventDefault();
                    return;
                }

                if (next !== null) {
                    event.preventDefault();
                    const target = state.rows[next];
                    if (target) {
                        if (next < state.start || next >= state.end) {
                            container.scrollTop = Math.max(0, next * ROW_HEIGHT - Math.floor((container.clientHeight || 360) / 2));
                            renderRows(container, state);
                        }
                        container.querySelector('[data-row-index="' + next + '"]')?.focus();
                    }
                }
            };
            container.addEventListener('scroll', state.onScroll, { passive: true });
            container.addEventListener('click', state.onClick);
            container.addEventListener('keydown', state.onKeyDown);
        }
        state.options = { ...options, files: Array.isArray(options.files) ? options.files : [] };
        if (state.options.selectedFileId && state.options.selectedFileId !== state.lastSelectedFileId) {
            const selected = state.options.files.find(file => file.id === state.options.selectedFileId);
            if (selected) {
                const parts = selected.path.split('/');
                for (let index = 1; index < parts.length; index++) state.expandedPaths.add(parts.slice(0, index).join('/'));
            }
        }
        state.lastSelectedFileId = state.options.selectedFileId || null;
        if (state.files !== state.options.files) {
            state.files = state.options.files;
            state.index = WorkspaceTreeModel.buildIndex(state.files);
        }
        updateRows(state);
        renderRows(container, state);
    }

    function destroy(container) {
        const state = states.get(container);
        if (!state) return;
        container.removeEventListener('scroll', state.onScroll);
        container.removeEventListener('click', state.onClick);
        container.removeEventListener('keydown', state.onKeyDown);
        states.delete(container);
    }

    return { render, destroy, limits: Object.freeze({ rowHeight: ROW_HEIGHT, virtualizationThreshold: VIRTUALIZATION_THRESHOLD, overscan: OVERSCAN }) };
})();
