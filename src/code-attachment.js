// ===== src/code-attachment.js =====
    function codeAttachment({ q, onUpdate } = {}) {
        const root = document.createElement('div');
        root.className = 'pe-code-wrap';
        const clip = document.createElement('div');
        clip.className = 'pe-code-clip';
        const area = document.createElement('div');
        area.className = 'pe-code-area';
        const actions = document.createElement('div');
        actions.className = 'pe-code-actions';
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button'; copyBtn.className = 'pe-code-action';
        copyBtn.innerHTML = `${Atoms.icon('copy').outerHTML}<span>Copiar</span>`;
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button'; clearBtn.className = 'pe-code-action';
        clearBtn.innerHTML = `${Atoms.icon('trash').outerHTML}<span>Limpar</span>`;
        actions.appendChild(copyBtn); actions.appendChild(clearBtn);
        const tabs = document.createElement('div');
        tabs.className = 'pe-code-tabs';
        const tabPaste = document.createElement('button');
        tabPaste.type = 'button'; tabPaste.className = 'pe-code-tab is-active';
        tabPaste.innerHTML = `${Atoms.icon('paste').outerHTML}<span>Colar trecho</span>`;
        const tabFile = document.createElement('button');
        tabFile.type = 'button'; tabFile.className = 'pe-code-tab';
        tabFile.innerHTML = `${Atoms.icon('clip').outerHTML}<span>Anexar arquivo</span>`;
        tabs.appendChild(tabPaste); tabs.appendChild(tabFile);
        const pastePane = document.createElement('div');
        pastePane.className = 'pe-code-pane';
        const ta = document.createElement('textarea');
        ta.className = 'pe-code-textarea';
        ta.placeholder = 'Cole a função ou o trecho onde ocorre o problema…';
        ta.rows = 4;
        const err = document.createElement('div');
        err.className = 'pe-code-error';
        err.innerHTML = `${Atoms.icon('alert').outerHTML}<span>Adicione pelo menos 3 caracteres para usar este contexto.</span>`;
        const footer = document.createElement('div');
        footer.className = 'pe-code-textarea-footer';
        const langSelect = document.createElement('select');
        langSelect.className = 'pe-code-lang';
        ['JavaScript','TypeScript','Python','Java','Go','Rust','C','C++','C#','PHP','Ruby','Swift','Kotlin','SQL','Shell','HTML','CSS','JSON','YAML','Outro'].forEach(lang => { const o = document.createElement('option'); o.textContent = lang; langSelect.appendChild(o); });
        const count = document.createElement('span');
        count.className = 'pe-code-count';
        count.textContent = '0 caracteres';
        footer.appendChild(langSelect); footer.appendChild(count);
        pastePane.appendChild(ta); pastePane.appendChild(err); pastePane.appendChild(footer);
        const filePane = document.createElement('div');
        filePane.className = 'pe-code-pane';
        filePane.hidden = true;
        const dropzone = document.createElement('div');
        dropzone.className = 'pe-dropzone';
        dropzone.innerHTML = `
            <span class="pe-dropzone__icon">${Atoms.icon('upload').outerHTML}</span>
            <span class="pe-dropzone__title">Arraste um arquivo ou escolha um abaixo</span>
            <span class="pe-dropzone__hint"><code>.js</code> <code>.ts</code> <code>.py</code> · máx ${Utils.formatBytes(CONFIG.MAX_FILE_SIZE)} · até ${CONFIG.MAX_FILE_COUNT} arquivos</span>
        `;
        const pickBtn = document.createElement('button');
        pickBtn.type = 'button'; pickBtn.className = 'pe-dropzone__btn';
        pickBtn.innerHTML = `${Atoms.icon('doc').outerHTML}<span>Escolher arquivo</span>`;
        dropzone.appendChild(pickBtn);
        const fileInput = document.createElement('input');
        fileInput.type = 'file'; fileInput.multiple = true;
        fileInput.accept = CONFIG.ACCEPTED_FILE_TYPES;
        fileInput.style.display = 'none';
        const fileList = document.createElement('div');
        fileList.className = 'pe-file-list';
        filePane.appendChild(dropzone); filePane.appendChild(fileInput); filePane.appendChild(fileList);
        area.appendChild(actions); area.appendChild(tabs); area.appendChild(pastePane); area.appendChild(filePane);
        clip.appendChild(area); root.appendChild(clip);
        const state = { mode: 'paste', codeText: '', language: 'JavaScript', files: [] };
        function emit() { onUpdate?.(); }
        function updateCount() {
            const n = ta.value.length;
            count.textContent = `${n} ${n === 1 ? 'caractere' : 'caracteres'}`;
            const hasError = n > 0 && n < 3;
            ta.classList.toggle('is-error', hasError);
            count.classList.toggle('is-error', hasError);
            err.classList.toggle('is-visible', hasError);
        }
        function setMode(mode) {
            state.mode = mode;
            tabPaste.classList.toggle('is-active', mode === 'paste');
            tabFile.classList.toggle('is-active', mode === 'file');
            pastePane.hidden = mode !== 'paste';
            filePane.hidden = mode !== 'file';
        }
        function renderFiles() {
            fileList.innerHTML = '';
            state.files.forEach((file, idx) => {
                const chip = document.createElement('div');
                chip.className = 'pe-file-chip';
                chip.innerHTML = `${Atoms.icon('doc').outerHTML}<span class="pe-file-chip__name" title="${Utils.escapeHtml(file.name)}">${Utils.escapeHtml(file.name)}</span><span class="pe-file-chip__size">${Utils.formatBytes(file.size)}</span>`;
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button'; removeBtn.className = 'pe-file-chip__remove';
                removeBtn.innerHTML = Atoms.icon('x').outerHTML;
                removeBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); state.files.splice(idx, 1); renderFiles(); emit(); });
                chip.appendChild(removeBtn);
                fileList.appendChild(chip);
            });
        }
        async function readFiles(fileListIn) {
            const incoming = Array.from(fileListIn);
            const remaining = CONFIG.MAX_FILE_COUNT - state.files.length;
            if (remaining <= 0) { Molecules.toast(`Máximo de ${CONFIG.MAX_FILE_COUNT} arquivos atingido.`, 'error'); return; }
            for (const file of incoming.slice(0, remaining)) {
                if (file.size > CONFIG.MAX_FILE_SIZE) { Molecules.toast(`"${file.name}" excede ${Utils.formatBytes(CONFIG.MAX_FILE_SIZE)}.`, 'error'); continue; }
                try {
                    const content = await file.text();
                    state.files.push({ name: file.name, size: file.size, content });
                    renderFiles();
                    const chips = fileList.querySelectorAll('.pe-file-chip');
                    if (chips.length) Anim.pulseSuccessClass(chips[chips.length - 1]);
                    emit();
                } catch (e) { Molecules.toast(`Falha ao ler "${file.name}".`, 'error'); }
            }
        }
        tabPaste.addEventListener('click', () => setMode('paste'));
        tabFile.addEventListener('click', () => setMode('file'));
        ta.addEventListener('input', () => { state.codeText = ta.value; updateCount(); emit(); });
        langSelect.addEventListener('change', () => { state.language = langSelect.value; emit(); });
        copyBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const txt = state.mode === 'paste' ? ta.value : ''; if (!txt) return; try { ta.select(); document.execCommand('copy'); } catch (_) {} const lbl = copyBtn.querySelector('span'); if (lbl) { const old = lbl.textContent; lbl.textContent = 'Copiado!'; setTimeout(() => { lbl.textContent = old; }, 1200); } });
        clearBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); state.codeText = ''; state.files = []; ta.value = ''; renderFiles(); updateCount(); emit(); });
        pickBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fileInput.click(); });
        dropzone.addEventListener('click', (e) => { if (e.target.closest('.pe-dropzone__btn')) return; fileInput.click(); });
        fileInput.addEventListener('change', (e) => { readFiles(e.target.files); fileInput.value = ''; });
        ['dragenter', 'dragover'].forEach(evt => { dropzone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); }); });
        dropzone.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer?.files?.length) readFiles(e.dataTransfer.files); });
        return {
            root, show() { root.classList.add('is-visible'); }, hide() { root.classList.remove('is-visible'); },
            getValue() {
                const pasted = state.codeText.trim();
                if (!pasted && !state.files.length) return null;
                let combined = pasted;
                for (const f of state.files) combined += (combined ? '\n\n' : '') + `// --- arquivo: ${f.name} ---\n${f.content}`;
                return { code: combined, language: state.language, files: state.files.map(f => ({ name: f.name, size: f.size })) };
            },
            clear() { state.codeText = ''; state.files = []; ta.value = ''; renderFiles(); updateCount(); setMode('paste'); emit(); }
        };
    }

