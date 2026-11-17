// ===== src/workspace/workspace-explorer-view.js =====
const WorkspaceExplorerView = (() => {
    const ROW_HEIGHT = 22;
    const VIRTUALIZATION_THRESHOLD = 300;
    const OVERSCAN = 10;
    const states = new WeakMap();
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const FILE_COLORS = Object.freeze({
        md: '#519aba', json: '#cbcb41', js: '#cbcb41', mjs: '#cbcb41', cjs: '#cbcb41',
        jsx: '#cbcb41', ts: '#519aba', tsx: '#519aba', html: '#e37933', css: '#519aba',
        scss: '#c6538c', sass: '#c6538c', less: '#519aba', yml: '#e37933', yaml: '#e37933',
        txt: '#d4d7d6', xml: '#e37933', py: '#519aba', rb: '#d4d7d6', go: '#519aba',
        rs: '#dea584', java: '#d4d7d6', c: '#519aba', cpp: '#519aba', h: '#519aba',
        sh: '#89e051', sql: '#d4d7d6', toml: '#9c4221', ini: '#d4d7d6', key: '#ff6b6b'
    });

    function svg(markup) {
        const wrapper = document.createElement('span');
        wrapper.innerHTML = markup;
        return wrapper.firstElementChild;
    }

    function iconFor(node, expanded) {
        if (node.kind === 'folder') {
            return expanded
                ? '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M1.5 3C1.22 3 1 3.22 1 3.5V15c0 .28.22.5.5.5h13c.28 0 .5-.22.5-.5V5.5c0-.28-.22-.5-.5-.5H8L6.5 3.5H1.5z" fill="#dcb67a" opacity=".6"/><path d="M1 6h14l-1.5 7H2.5L1 6z" fill="#dcb67a"/></svg>'
                : '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M14.5 3H8L6.5 1.5H1.5C1.22 1.5 1 1.72 1 2v12c0 .28.22.5.5.5h13c.28 0 .5-.22.5-.5V3.5c0-.28-.22-.5-.5-.5z" fill="#dcb67a"/></svg>';
        }
        const extension = String(node.name || '').split('.').pop().toLowerCase();
        const color = FILE_COLORS[extension] || '#d4d7d6';
        return '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M9 1H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6L9 1zm-.5 1.5L12 6H8.5V2.5z" fill="' + color + '"/></svg>';
    }

    function appendName(label, name, query) {
        const value = String(name || '');
        const search = String(query || '').trim();
        if (!search) { label.textContent = value; return; }
        const index = value.toLocaleLowerCase().indexOf(search.toLocaleLowerCase());
        if (index < 0) { label.textContent = value; return; }
        label.append(document.createTextNode(value.slice(0, index)));
        const match = document.createElement('span');
        match.className = 'pe-match';
        match.textContent = value.slice(index, index + search.length);
        label.append(match, document.createTextNode(value.slice(index + search.length)));
    }

    function createRow(row, index, state) {
        const options = state.options;
        const node = row;
        const item = document.createElement('div');
        item.className = 'pe-tree-row';
        if (options.inspectedNodeId === node.id) item.classList.add('is-selected');
        if (options.focusedNodeId === node.id) item.classList.add('is-focused');
        if (options.editingNodeId === node.id) item.classList.add('is-editing');
        item.dataset.rowIndex = String(index);
        item.dataset.treeId = node.id;
        item.dataset.rowKind = node.kind;
        item.dataset.rowPath = node.path;
        item.setAttribute('role', 'treeitem');
        item.setAttribute('aria-level', String(node.depth + 1));
        item.setAttribute('aria-setsize', String(node.setsize || 1));
        item.setAttribute('aria-posinset', String(node.posinset || 1));
        item.setAttribute('aria-selected', String(options.selectedFileId === node.id));
        item.tabIndex = options.focusedNodeId === node.id ? 0 : -1;
        item.style.top = (index * ROW_HEIGHT) + 'px';
        item.style.paddingLeft = (8 + node.depth * 19) + 'px';
        if (node.kind === 'folder' && node.hasChildren) item.setAttribute('aria-expanded', String(node.expanded));

        for (let depth = 0; depth < node.depth; depth++) {
            const guide = document.createElement('span');
            guide.className = 'pe-indent-guide';
            guide.style.setProperty('--guide-index', String(depth));
            item.appendChild(guide);
        }

        const chevron = document.createElement('span');
        chevron.className = 'pe-chevron';
        if (node.kind !== 'folder' || !node.hasChildren) chevron.classList.add('is-placeholder');
        if (node.expanded) chevron.classList.add('is-expanded');
        chevron.appendChild(svg('<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 4 10 8 6 12"/></svg>'));
        item.appendChild(chevron);

        const icon = document.createElement('span');
        icon.className = 'pe-file-icon';
        icon.innerHTML = iconFor(node, node.expanded);
        item.appendChild(icon);

        if (options.editingNodeId === node.id) {
            const input = document.createElement('input');
            input.className = 'pe-tree-input';
            input.value = options.renameValue || '';
            input.setAttribute('aria-label', I18n.t('ws.files.renamePrompt', { path: node.path }));
            input.addEventListener('input', () => options.onRenameInput?.(input.value));
            input.addEventListener('blur', () => options.onCommitRename?.());
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); options.onCommitRename?.(); }
                else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); options.onCancelRename?.(); }
                else event.stopPropagation();
            });
            item.appendChild(input);
            queueMicrotask(() => { if (input.isConnected) { input.focus(); input.select(); } });
        } else {
            const label = document.createElement('span');
            label.className = 'pe-file-name';
            appendName(label, node.name, options.searchQuery);
            label.title = node.kind === 'file' ? node.path : I18n.t('ws.files.renameHint');
            item.appendChild(label);
        }

        if (node.kind === 'file' && options.isDirty?.(node.id)) {
            const dirty = document.createElement('span');
            dirty.className = 'pe-dirty-dot';
            dirty.title = I18n.t('ws.dirty.title');
            item.appendChild(dirty);
        }

        if (options.editingNodeId !== node.id) {
            const actions = document.createElement('div');
            actions.className = 'pe-tree-row__actions';
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'pe-icon-btn pe-icon-btn--delete';
            remove.setAttribute('aria-label', I18n.t('ws.files.delete') + ' ' + node.name);
            remove.title = I18n.t('ws.files.delete');
            remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
            actions.appendChild(remove);
            item.appendChild(actions);
        }
        return item;
    }

    function renderRows(container, state) {
        const { rows, options } = state;
        const virtualized = rows.length > VIRTUALIZATION_THRESHOLD;
        const scrollTop = container.scrollTop;
        const viewportHeight = container.clientHeight || 400;
        const start = virtualized ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN) : 0;
        const end = virtualized ? Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN) : rows.length;
        const fragment = document.createDocumentFragment();

        if (!rows.length) {
            const empty = document.createElement('div');
            empty.className = 'pe-tree-empty';
            empty.textContent = options.searchQuery
                ? I18n.t('ws.files.noMatches')
                : I18n.t('ws.files.empty');
            fragment.appendChild(empty);
        } else {
            const spacer = document.createElement('div');
            spacer.className = 'pe-tree-spacer';
            spacer.style.height = (rows.length * ROW_HEIGHT) + 'px';
            spacer.setAttribute('aria-hidden', 'true');
            fragment.appendChild(spacer);
            for (let index = start; index < end; index++) fragment.appendChild(createRow(rows[index], index, state));
        }
        container.replaceChildren(fragment);
        if (!container.querySelector('[tabindex="0"]')) {
            const first = container.querySelector('[data-row-index]');
            if (first) first.tabIndex = 0;
        }
        container.dataset.virtualized = String(virtualized);
        state.start = start;
        state.end = end;
    }

    function updateRows(state) {
        state.rows = WorkspaceTreeModel.flattenVisible(state.index || WorkspaceTreeModel.buildIndex([], []), {
            expandedPaths: state.expandedPaths,
            searchQuery: state.options.searchQuery
        });
        const groups = new Map();
        for (const row of state.rows) {
            const parent = row.path.split('/').slice(0, -1).join('/') || '__root__';
            if (!groups.has(parent)) groups.set(parent, []);
            groups.get(parent).push(row);
        }
        for (const siblings of groups.values()) siblings.forEach((row, index) => {
            row.setsize = siblings.length;
            row.posinset = index + 1;
        });
    }

    function render(container, options = {}) {
        let state = states.get(container);
        if (!state) {
            state = { expandedPaths: new Set(), files: null, folders: null, index: null, rows: [], options: {}, start: 0, end: 0 };
            states.set(container, state);
            state.onScroll = () => { if (container.dataset.virtualized === 'true') renderRows(container, state); };
            state.onClick = event => {
                const remove = event.target.closest('.pe-icon-btn--delete');
                const rowEl = event.target.closest('[data-tree-id]');
                if (!rowEl || !container.contains(rowEl)) return;
                const row = state.rows[Number(rowEl.dataset.rowIndex)];
                if (!row) return;
                if (remove) {
                    event.preventDefault();
                    event.stopPropagation();
                    state.options.onDelete?.(row);
                    return;
                }
                if (state.options.editingNodeId === row.id) return;
                state.options.onFocus?.(row);
                state.options.onInspect?.(row);
                if (row.kind === 'folder') {
                    if (row.hasChildren) toggleFolder(container, row.path);
                } else state.options.onSelect?.(row.id);
            };
            state.onDoubleClick = event => {
                const label = event.target.closest('.pe-file-name');
                const rowEl = label?.closest('[data-tree-id]');
                if (!rowEl) return;
                const row = state.rows[Number(rowEl.dataset.rowIndex)];
                if (row) state.options.onStartRename?.(row);
            };
            state.onKeyDown = event => {
                const rowEl = event.target.closest('[data-row-index]');
                if (!rowEl) return;
                const index = Number(rowEl.dataset.rowIndex);
                const row = state.rows[index];
                if (!row) return;
                if (event.key === 'F2') {
                    event.preventDefault(); event.stopPropagation();
                    state.options.onStartRename?.(row);
                    return;
                }
                if (event.key === 'Delete') {
                    event.preventDefault(); event.stopPropagation();
                    state.options.onDelete?.(row);
                    return;
                }
                let next = null;
                if (event.key === 'ArrowDown') next = Math.min(state.rows.length - 1, index + 1);
                else if (event.key === 'ArrowUp') next = Math.max(0, index - 1);
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = state.rows.length - 1;
                else if (event.key === 'ArrowRight' && row.kind === 'folder') {
                    if (!row.expanded && row.hasChildren) toggleFolder(container, row.path);
                    else if (row.expanded && state.rows[index + 1]?.depth > row.depth) next = index + 1;
                    event.preventDefault();
                    if (next === null) return;
                } else if (event.key === 'ArrowLeft') {
                    if (row.kind === 'folder' && row.expanded) toggleFolder(container, row.path);
                    else {
                        const parentPath = row.path.split('/').slice(0, -1).join('/');
                        const parentIndex = state.rows.findIndex(item => item.kind === 'folder' && item.path === parentPath);
                        if (parentIndex >= 0) next = parentIndex;
                    }
                    event.preventDefault();
                    if (next === null) return;
                } else if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    rowEl.click();
                    return;
                } else return;

                event.preventDefault();
                if (next !== null && state.rows[next]) {
                    state.options.onFocus?.(state.rows[next]);
                    state.options.onInspect?.(state.rows[next]);
                    if (next < state.start || next >= state.end) {
                        container.scrollTop = Math.max(0, next * ROW_HEIGHT - Math.floor((container.clientHeight || 400) / 2));
                        renderRows(container, state);
                    }
                    container.querySelector('[data-row-index="' + next + '"]')?.focus();
                }
            };
            container.addEventListener('scroll', state.onScroll, { passive: true });
            container.addEventListener('click', state.onClick);
            container.addEventListener('dblclick', state.onDoubleClick);
            container.addEventListener('keydown', state.onKeyDown);
        }

        state.options = { ...options, files: Array.isArray(options.files) ? options.files : [], folders: Array.isArray(options.folders) ? options.folders : [] };
        if (options.expandedPaths && typeof options.expandedPaths.has === 'function') state.expandedPaths = options.expandedPaths;
        if (state.files !== state.options.files || state.folders !== state.options.folders) {
            state.files = state.options.files;
            state.folders = state.options.folders;
            state.index = WorkspaceTreeModel.buildIndex(state.files, state.folders);
        }
        updateRows(state);
        renderRows(container, state);
    }

    function toggleFolder(container, path) {
        const state = states.get(container);
        if (!state) return false;
        if (state.expandedPaths.has(path)) state.expandedPaths.delete(path);
        else state.expandedPaths.add(path);
        updateRows(state);
        renderRows(container, state);
        return true;
    }

    function reveal(container, path) {
        const state = states.get(container);
        if (!state) return false;
        const parts = String(path || '').split('/').filter(Boolean);
        for (let index = 1; index < parts.length; index++) state.expandedPaths.add(parts.slice(0, index).join('/'));
        updateRows(state);
        const rowIndex = state.rows.findIndex(row => row.path === path);
        if (rowIndex < 0) { renderRows(container, state); return false; }
        const viewportHeight = container.clientHeight || 400;
        const visibleStart = Math.max(0, Math.floor(container.scrollTop / ROW_HEIGHT) - OVERSCAN);
        const visibleEnd = Math.min(state.rows.length, Math.ceil((container.scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN);
        if (rowIndex < visibleStart || rowIndex >= visibleEnd) {
            container.scrollTop = Math.max(0, rowIndex * ROW_HEIGHT - Math.floor(viewportHeight / 2));
        }
        renderRows(container, state);
        container.querySelector('[data-row-index="' + rowIndex + '"]')?.focus();
        return true;
    }

    function destroy(container) {
        const state = states.get(container);
        if (!state) return;
        container.removeEventListener('scroll', state.onScroll);
        container.removeEventListener('click', state.onClick);
        container.removeEventListener('dblclick', state.onDoubleClick);
        container.removeEventListener('keydown', state.onKeyDown);
        states.delete(container);
    }

    return Object.freeze({
        render, toggleFolder, reveal, destroy,
        limits: Object.freeze({ rowHeight: ROW_HEIGHT, virtualizationThreshold: VIRTUALIZATION_THRESHOLD, overscan: OVERSCAN })
    });
})();
