// ===== src/context-popover.js =====
    function contextPopover({ anchor, onChange } = {}) {
        const root = document.createElement('div');
        root.className = 'pe-agents-popover pe-scope';
        root.setAttribute('role', 'dialog');
        root.hidden = true;
        const fileInput = document.createElement('input');
        fileInput.type = 'file'; fileInput.accept = CONFIG.CONTEXT_FILE_ACCEPT; fileInput.style.display = 'none';
        root.appendChild(fileInput);
        const head = document.createElement('div');
        head.className = 'pe-pop-head';
        head.innerHTML = `<span class="pe-pop-head-title">${Atoms.icon('agentDoc').outerHTML}<span>Contexto do projeto</span></span>`;
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button'; closeBtn.className = 'pe-pop-close';
        closeBtn.innerHTML = Atoms.icon('x').outerHTML;
        closeBtn.addEventListener('click', () => close());
        head.appendChild(closeBtn); root.appendChild(head);
        const body = document.createElement('div');
        body.className = 'pe-pop-body'; root.appendChild(body);
        const foot = document.createElement('div');
        foot.className = 'pe-pop-foot'; foot.hidden = true; root.appendChild(foot);
        let isOpen = false;
        function renderEmpty() {
            foot.hidden = true; body.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.className = 'pe-pop-empty';
            wrap.innerHTML = `<div class="pe-pop-empty-title">Nenhum arquivo de contexto carregado</div><div class="pe-pop-empty-hint">Aceita <code>.md</code> <code>.txt</code> · máx ${Utils.formatBytes(CONFIG.MAX_CONTEXT_FILE_SIZE)} por arquivo<br>Nomes comuns: ${Utils.escapeHtml(CONFIG.CONTEXT_KNOWN_NAMES.join(' · '))}</div><div class="pe-pop-divider"></div>`;
            const loadBtn = document.createElement('button');
            loadBtn.type = 'button'; loadBtn.className = 'pe-pop-action';
            loadBtn.innerHTML = `${Atoms.icon('upload').outerHTML}<span class="pe-pop-action-body"><span class="pe-pop-action-title">Carregar arquivo</span><span class="pe-pop-action-hint">Selecione um arquivo de contexto</span></span>`;
            loadBtn.addEventListener('click', () => fileInput.click());
            const pasteBtn = document.createElement('button');
            pasteBtn.type = 'button'; pasteBtn.className = 'pe-pop-action';
            pasteBtn.innerHTML = `${Atoms.icon('paste').outerHTML}<span class="pe-pop-action-body"><span class="pe-pop-action-title">Colar conteúdo</span><span class="pe-pop-action-hint">Cole o conteúdo diretamente</span></span>`;
            pasteBtn.addEventListener('click', () => renderPaste());
            wrap.appendChild(loadBtn); wrap.appendChild(pasteBtn);
            body.appendChild(wrap);
        }
        function renderList() {
            foot.hidden = false; body.innerHTML = '';
            const files = ProjectContext.list();
            const total = ProjectContext.getTotalSize();
            const masterLabel = document.createElement('label');
            masterLabel.className = 'pe-pop-toggle';
            masterLabel.innerHTML = `<input type="checkbox" ${ProjectContext.isEnabled() ? 'checked' : ''}><span class="pe-pop-toggle-switch"></span><span class="pe-pop-toggle-label"><strong>Ativar injeção de contexto</strong><br>Anexar ao system prompt</span>`;
            masterLabel.querySelector('input').addEventListener('change', (e) => { ProjectContext.setEnabled(e.target.checked); onChange?.(); refresh(); });
            body.appendChild(masterLabel);
            const list = document.createElement('div');
            list.className = 'pe-pop-list';
            files.forEach(f => {
                const item = document.createElement('div');
                item.className = 'pe-pop-item';
                if (!f.enabled) item.style.opacity = '0.65';
                const cbLabel = document.createElement('label');
                cbLabel.className = 'pe-pop-item__checkbox';
                cbLabel.innerHTML = `<input type="checkbox" ${f.enabled ? 'checked' : ''}><span class="pe-checkbox"></span>`;
                cbLabel.querySelector('input').addEventListener('change', (e) => { ProjectContext.toggle(f.id, e.target.checked); onChange?.(); refresh(); });
                const meta = document.createElement('div');
                meta.className = 'pe-pop-item__meta';
                meta.innerHTML = `<span class="pe-pop-item__name" title="${Utils.escapeHtml(f.path || f.name)}">${Utils.escapeHtml(f.name)}</span><span class="pe-pop-item__size">${Utils.formatBytes(f.size || f.content.length)}${f.source === 'legacy' ? ' · legado' : ''}</span>`;
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button'; removeBtn.className = 'pe-pop-item__remove';
                removeBtn.innerHTML = Atoms.icon('x').outerHTML;
                removeBtn.addEventListener('click', () => { ProjectContext.remove(f.id); onChange?.(); refresh(); });
                item.appendChild(cbLabel); item.appendChild(meta); item.appendChild(removeBtn);
                list.appendChild(item);
            });
            body.appendChild(list);
            const totalEl = document.createElement('div');
            totalEl.className = 'pe-pop-total' + (total > CONFIG.MAX_CONTEXT_TOTAL_SIZE ? ' is-over' : '');
            const activeCount = files.filter(f => f.enabled).length;
            totalEl.textContent = `${activeCount} ativo${activeCount === 1 ? '' : 's'} · ${Utils.formatBytes(total)} / ${Utils.formatBytes(CONFIG.MAX_CONTEXT_TOTAL_SIZE)}`;
            body.appendChild(totalEl);
            foot.innerHTML = '';
            const addBtn = document.createElement('button');
            addBtn.type = 'button'; addBtn.className = 'pe-pop-foot-btn';
            addBtn.innerHTML = `${Atoms.icon('upload').outerHTML}<span>Adicionar</span>`;
            addBtn.addEventListener('click', () => fileInput.click());
            const exportBtn = document.createElement('button');
            exportBtn.type = 'button'; exportBtn.className = 'pe-pop-foot-btn';
            exportBtn.innerHTML = `${Atoms.icon('download').outerHTML}<span>Exportar</span>`;
            exportBtn.addEventListener('click', () => {
                try {
                    const payload = { files: ProjectContext.list(), exportedAt: new Date().toISOString() };
                    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `pe-context-${Date.now()}.json`;
                    document.body.appendChild(a); a.click(); a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (e) { Molecules.toast('Falha ao exportar contexto.', 'error'); }
            });
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button'; clearBtn.className = 'pe-pop-foot-btn danger';
            clearBtn.innerHTML = `${Atoms.icon('trash').outerHTML}<span>Limpar</span>`;
            clearBtn.addEventListener('click', () => { ProjectContext.clearAll(); Molecules.toast('Arquivos de contexto removidos.', 'info'); onChange?.(); refresh(); });
            foot.appendChild(addBtn); foot.appendChild(exportBtn); foot.appendChild(clearBtn);
        }
        function renderPaste() {
            foot.hidden = true; body.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.className = 'pe-pop-paste';
            const nameInput = document.createElement('input');
            nameInput.type = 'text'; nameInput.className = 'pe-pop-paste-name';
            nameInput.placeholder = 'Nome do arquivo (ex: AGENTS.md)'; nameInput.value = 'AGENTS.md';
            const ta = document.createElement('textarea');
            ta.className = 'pe-pop-paste-textarea'; ta.rows = 6;
            ta.placeholder = '# AGENTS.md\n\nCole aqui o conteúdo…';
            const actions = document.createElement('div');
            actions.className = 'pe-pop-paste-actions';
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button'; cancelBtn.textContent = 'Cancelar';
            cancelBtn.addEventListener('click', () => { if (ProjectContext.list().length) renderList(); else renderEmpty(); });
            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button'; confirmBtn.className = 'primary';
            confirmBtn.textContent = 'Adicionar'; confirmBtn.disabled = true;
            ta.addEventListener('input', () => { confirmBtn.disabled = ta.value.trim().length < 3; });
            confirmBtn.addEventListener('click', () => {
                const v = ta.value.trim();
                if (v.length < 3) return;
                const res = ProjectContext.add({ name: nameInput.value.trim() || 'AGENTS.md', content: v, source: 'manual' });
                if (!res.ok) { if (res.reason === 'total-too-large') Molecules.toast(`Total excede ${Utils.formatBytes(CONFIG.MAX_CONTEXT_TOTAL_SIZE)}.`, 'error'); else Molecules.toast('Falha ao adicionar.', 'error'); return; }
                Molecules.toast('Arquivo adicionado.', 'success'); onChange?.(); renderList();
            });
            actions.appendChild(cancelBtn); actions.appendChild(confirmBtn);
            wrap.appendChild(nameInput); wrap.appendChild(ta); wrap.appendChild(actions);
            body.appendChild(wrap);
            setTimeout(() => ta.focus(), 60);
        }
        function refresh() { if (!isOpen) return; if (ProjectContext.list().length) renderList(); else renderEmpty(); }
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0]; fileInput.value = '';
            if (!file) return;
            if (file.size > CONFIG.MAX_CONTEXT_FILE_SIZE) { Molecules.toast(`"${file.name}" excede ${Utils.formatBytes(CONFIG.MAX_CONTEXT_FILE_SIZE)}.`, 'error'); return; }
            try {
                const text = await file.text();
                const res = ProjectContext.add({ name: file.name || 'AGENTS.md', content: text, source: 'manual' });
                if (!res.ok) { Molecules.toast('Falha ao adicionar arquivo.', 'error'); return; }
                Molecules.toast('Arquivo adicionado.', 'success'); onChange?.(); refresh();
            } catch (err) { Molecules.toast(`Falha ao ler "${file.name}".`, 'error'); }
        });
        function positionNearAnchor() {
            if (!anchor || !document.body.contains(anchor)) return;
            const rect = anchor.getBoundingClientRect();
            const gap = 8, margin = 12;
            const width = Math.min(320, window.innerWidth - margin * 2);
            root.style.width = width + 'px';
            let left = rect.left;
            if (left + width + margin > window.innerWidth) left = window.innerWidth - width - margin;
            if (left < margin) left = margin;
            const bottom = window.innerHeight - rect.top + gap;
            root.style.left = left + 'px';
            root.style.bottom = bottom + 'px';
            root.style.top = 'auto';
        }
        function open() { if (isOpen) return; isOpen = true; root.hidden = false; positionNearAnchor(); void root.offsetWidth; root.classList.add('is-open'); refresh(); }
        function close() { if (!isOpen) return; isOpen = false; root.classList.remove('is-open'); setTimeout(() => { if (!isOpen) root.hidden = true; }, 220); }
        function toggle() { if (isOpen) close(); else open(); }
        document.addEventListener('pointerdown', (e) => { if (!isOpen) return; if (root.contains(e.target)) return; if (anchor && anchor.contains(e.target)) return; close(); }, true);
        document.addEventListener('keydown', (e) => { if (!isOpen) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } }, true);
        window.addEventListener('scroll', () => { if (isOpen) positionNearAnchor(); }, { passive: true, capture: true });
        window.addEventListener('resize', () => { if (isOpen) positionNearAnchor(); }, { passive: true });
        document.body.appendChild(root);
        return { root, open, close, toggle, refresh, destroy() { root.remove(); } };
    }

