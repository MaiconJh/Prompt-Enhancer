// ===== src/settings-modal.js =====
    // ===== Settings Modal (Histórico + Parâmetros + Contexto/Idioma + System prompt) =====
    function settingsModal({ initialTab = 'params', onSave, onClose } = {}) {
        const previouslyFocused = document.activeElement;
        const draft = { ...ParamSchema.defaults(), ...(State.params || ParamSchema.load()) };
        const activeProvider = typeof ProviderManager !== 'undefined' ? ProviderManager.getActive() : null;
        const providerDraft = {
            id: activeProvider?.id || '',
            baseUrl: (activeProvider?.url || GM_getValue('pe_api_url', '') || '').trim(),
            model: (activeProvider?.model || GM_getValue('pe_model', '') || '').trim(),
            apiKey: (activeProvider?.apiKey || GM_getValue('pe_api_key', '') || '').trim()
        };
        let systemPromptDraft;
        try {
            systemPromptDraft = SystemPromptManager.load();
        } catch (error) {
            systemPromptDraft = SystemPromptManager.defaultConfig();
            console.error('[KPE] Falha ao carregar o system prompt:', error);
            Molecules.toast('Não foi possível carregar o system prompt salvo. Redefina-o ou tente novamente.', 'error', { details: error.message });
        }
        let activeTab = initialTab;
        let selectedSystemPreset = '';
        let closed = false;
        let openFrame;
        let providerTimer;
        let providerRequest;

        const backdrop = document.createElement('div');
        backdrop.className = 'kpe-modal-backdrop kpe-scope';

        const panel = document.createElement('div');
        panel.className = 'kpe-panel kpe-modal';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-label', 'Configurações');

        const header = document.createElement('div');
        header.className = 'kpe-panel__header';
        const heading = document.createElement('div');
        heading.className = 'kpe-modal-heading';
        const h4 = document.createElement('h4');
        h4.textContent = 'Configurações';
        const headingHint = document.createElement('p');
        headingHint.textContent = 'Personalize como o Prompt Enhancer trabalha.';
        heading.append(h4, headingHint);
        header.appendChild(heading);
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'kpe-panel__close';
        closeBtn.setAttribute('aria-label', 'Fechar');
        closeBtn.appendChild(Atoms.icon('x'));
        closeBtn.addEventListener('click', close);
        header.appendChild(closeBtn);
        panel.appendChild(header);

        const tabsBar = document.createElement('div');
        tabsBar.className = 'kpe-modal-tabs';
        tabsBar.setAttribute('role', 'tablist');
        tabsBar.setAttribute('aria-label', 'Abas de configurações');
        const tabDefs = [
            { key: 'params', label: 'Parâmetros', icon: 'sliders', title: 'Parâmetros de aprimoramento', description: 'Defina os limites e a intensidade usados nas respostas.' },
            { key: 'context', label: 'Contexto & Idioma', icon: 'folder', title: 'Contexto e idioma', description: 'Configure o contexto do projeto e o estilo das respostas.' },
            { key: 'systemPrompt', label: 'System prompt', icon: 'doc', title: 'System prompt', description: 'Edite as instruções e gerencie seus presets pessoais.' },
            { key: 'history', label: 'Histórico', icon: 'guide', title: 'Histórico de execuções', description: 'Revise resultados e detalhes das chamadas anteriores.' },
            { key: 'provider', label: 'Provider', icon: 'gear', title: 'Provedor de API', description: 'Configure e teste o endpoint usado pelo script.' }
        ];
        if (!tabDefs.some(tab => tab.key === activeTab)) activeTab = 'params';
        const tabButtons = {};
        tabDefs.forEach(t => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'kpe-modal-tab';
            b.id = `kpe-settings-tab-${t.key}`;
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-controls', 'kpe-settings-panel-body');
            b.setAttribute('aria-label', t.label);
            b.append(Atoms.icon(t.icon), Object.assign(document.createElement('span'), {
                className: 'kpe-modal-tab__label',
                textContent: t.label
            }));
            b.addEventListener('click', () => { if (activeTab !== t.key) { activeTab = t.key; render(); } });
            tabsBar.appendChild(b);
            tabButtons[t.key] = b;
        });

        const bodyEl = document.createElement('div');
        bodyEl.className = 'kpe-panel__body';
        bodyEl.id = 'kpe-settings-panel-body';
        bodyEl.setAttribute('role', 'tabpanel');
        bodyEl.tabIndex = 0;

        const footerEl = document.createElement('div');
        footerEl.className = 'kpe-panel__footer';
        const main = document.createElement('div');
        main.className = 'kpe-modal-main';
        main.append(bodyEl, footerEl);
        const layout = document.createElement('div');
        layout.className = 'kpe-modal-layout';
        layout.append(tabsBar, main);
        panel.appendChild(layout);

        backdrop.appendChild(panel);
        document.body.appendChild(backdrop);
        Utils.shieldFromHost(panel);

        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
            if (e.key === 'Tab') {
                const focusable = [...panel.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
                    .filter(el => el.getClientRects().length);
                if (!focusable.length) { e.preventDefault(); panel.focus(); return; }
                const first = focusable[0], last = focusable[focusable.length - 1];
                if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
            } else if (e.target instanceof Element && e.target.closest('[role="tab"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                e.preventDefault();
                const keys = tabDefs.map(tab => tab.key);
                const current = keys.indexOf(activeTab);
                const next = e.key === 'Home' ? 0 : e.key === 'End' ? keys.length - 1 : (current + (e.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length;
                activeTab = keys[next];
                render();
                tabButtons[activeTab].focus();
            }
        };
        const onBackdropClick = (e) => { if (e.target === backdrop) close(); };
        document.addEventListener('keydown', onKey, true);
        backdrop.addEventListener('click', onBackdropClick);

        openFrame = requestAnimationFrame(() => {
            if (closed) return;
            backdrop.classList.add('is-open');
            closeBtn.focus();
        });

        function close() {
            if (closed) return;
            closed = true;
            cancelAnimationFrame(openFrame);
            clearTimeout(providerTimer);
            providerRequest?.abort?.();
            providerRequest = null;
            document.removeEventListener('keydown', onKey, true);
            backdrop.removeEventListener('click', onBackdropClick);
            panel.inert = true;
            panel.setAttribute('aria-hidden', 'true');
            backdrop.classList.remove('is-open');
            if (previouslyFocused?.isConnected && !previouslyFocused.closest('[inert]')) previouslyFocused.focus();
            setTimeout(() => {
                backdrop.remove();
            }, 220);
            try { onClose?.(); } catch (_) {}
        }

        function applyAndClose() {
            const cleaned = ParamSchema.clean(draft);
            const errors = ParamSchema.validate(cleaned);
            errors.push(...SystemPromptManager.validatePrompt(systemPromptDraft.prompt).errors);
            if (errors.length) { showErrors(errors); return; }
            try {
                systemPromptDraft = SystemPromptManager.save(systemPromptDraft);
            } catch (error) {
                Molecules.toast('Não foi possível salvar o system prompt.', 'error', { details: error.message });
                return;
            }
            ParamSchema.save(cleaned);
            State.params = cleaned;
            persistProviderValue('pe_api_url', providerDraft.baseUrl);
            persistProviderValue('pe_model', providerDraft.model);
            persistProviderValue('pe_api_key', providerDraft.apiKey);
            try {
                if (typeof ProviderManager !== 'undefined' && ProviderManager.getActive) {
                    const active = ProviderManager.getActive();
                    const next = {
                        ...(active || { id: providerDraft.id || Utils.uid('prov'), name: 'Kilo', url: DEFAULT_PROVIDER.url, model: DEFAULT_PROVIDER.model, apiKey: 'anonymous', headers: { ...(DEFAULT_PROVIDER.headers || {}) }, builtin: false }),
                        id: providerDraft.id || active?.id || Utils.uid('prov'),
                        name: (active?.name || 'Kilo').trim() || 'Kilo',
                        url: (providerDraft.baseUrl || DEFAULT_PROVIDER.url).trim(),
                        model: (providerDraft.model || DEFAULT_PROVIDER.model).trim(),
                        apiKey: (providerDraft.apiKey || 'anonymous').trim(),
                        headers: { ...(DEFAULT_PROVIDER.headers || {}) }
                    };
                    if (active && active.id === next.id) ProviderManager.update(next.id, next);
                    else if (active) ProviderManager.update(active.id, next);
                    else ProviderManager.add(next);
                    ProviderManager.setActive(next.id);
                }
            } catch (_) {}
            try { GM_setValue('kpe_params_configured', true); } catch (_) {}
            Molecules.toast('Configurações salvas.', 'success');
            try { onSave?.(cleaned); } catch (_) {}
            close();
        }

        function persistProviderValue(key, value) {
            const cleanValue = String(value || '').trim();
            if (cleanValue) GM_setValue(key, cleanValue);
            else GM_deleteValue(key);
        }

        function showErrors(errors) {
            const existing = bodyEl.querySelector('.kpe-settings-errors');
            if (existing) existing.remove();
            const box = document.createElement('div');
            box.className = 'kpe-settings-errors';
            errors.forEach(err => {
                const el = document.createElement('div');
                el.className = 'kpe-panel-error';
                el.textContent = err;
                box.appendChild(el);
            });
            bodyEl.insertBefore(box, bodyEl.firstChild);
            Anim.shake(panel);
        }

        function persistSystemPromptPresets(presets) {
            const config = SystemPromptManager.load();
            config.presets = presets;
            const saved = SystemPromptManager.save(config);
            systemPromptDraft.presets = saved.presets;
        }

        function render() {
            Object.entries(tabButtons).forEach(([k, b]) => {
                const selected = k === activeTab;
                b.classList.toggle('is-active', selected);
                b.setAttribute('aria-selected', String(selected));
                b.tabIndex = selected ? 0 : -1;
            });
            bodyEl.setAttribute('aria-labelledby', `kpe-settings-tab-${activeTab}`);
            bodyEl.innerHTML = '';
            bodyEl.scrollTop = 0;
            footerEl.innerHTML = '';
            const tab = tabDefs.find(item => item.key === activeTab);
            const intro = document.createElement('div');
            intro.className = 'kpe-settings-intro';
            const icon = document.createElement('span');
            icon.className = 'kpe-settings-intro__icon';
            icon.appendChild(Atoms.icon(tab.icon));
            const text = document.createElement('div');
            text.className = 'kpe-settings-intro__text';
            const title = document.createElement('h5');
            title.textContent = tab.title;
            const description = document.createElement('p');
            description.textContent = tab.description;
            text.append(title, description);
            intro.append(icon, text);
            bodyEl.appendChild(intro);
            if (activeTab === 'params') renderParams();
            else if (activeTab === 'context') renderContext();
            else if (activeTab === 'systemPrompt') renderSystemPrompt();
            else if (activeTab === 'provider') renderProvider();
            else renderHistory();
        }

        function renderParams() {
            const form = document.createElement('div');
            form.className = 'kpe-param-body';
            const presetsRow = document.createElement('div');
            presetsRow.className = 'kpe-param-presets';
            presetsRow.setAttribute('role', 'group');
            presetsRow.setAttribute('aria-label', 'Predefinições de parâmetros');
            const presetButtons = [];
            const updatePresetSelection = () => {
                const matchingPreset = ParamSchema.PRESETS.find(preset =>
                    Object.entries(preset.values).every(([key, value]) => Number(draft[key]) === value)
                );
                presetButtons.forEach(({ button, preset }) => {
                    const selected = preset === matchingPreset;
                    button.classList.toggle('is-active', selected);
                    button.setAttribute('aria-pressed', String(selected));
                });
            };
            ParamSchema.PRESETS.forEach(p => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'kpe-param-preset';
                b.textContent = p.label;
                presetButtons.push({ button: b, preset: p });
                b.addEventListener('click', () => {
                    Object.assign(draft, p.values);
                    ParamSchema.SCHEMA.filter(f => f.type === 'number').forEach(f => {
                        const inp = form.querySelector(`#kpe-param-${f.key}`);
                        if (inp) inp.value = draft[f.key] == null ? '' : String(draft[f.key]);
                    });
                    updatePresetSelection();
                });
                presetsRow.appendChild(b);
            });
            updatePresetSelection();
            form.appendChild(presetsRow);

            ParamSchema.SCHEMA.filter(f => f.type === 'number').forEach(f => {
                const row = document.createElement('div');
                row.className = 'kpe-param-row';
                const placeholder = f.key === 'seed' ? 'Aleatório' : (f.default == null ? '' : f.default);
                row.innerHTML = `<label class="kpe-param-label" for="kpe-param-${f.key}">${Utils.escapeHtml(f.label)}</label><div class="kpe-param-control"><input type="number" id="kpe-param-${f.key}" class="kpe-param-input" min="${f.min}" max="${f.max}" step="${f.step}" value="${draft[f.key] == null ? '' : String(draft[f.key])}" placeholder="${placeholder}">${f.hint ? `<div class="kpe-param-hint">${Utils.escapeHtml(f.hint)}</div>` : ''}</div>`;
                form.appendChild(row);
                row.querySelector('input').addEventListener('input', (e) => {
                    const v = e.target.value.trim();
                    draft[f.key] = v === '' ? null : Number(v);
                    updatePresetSelection();
                });
            });

            bodyEl.appendChild(form);
            const cancelBtn = Atoms.button({ icon: 'x', label: 'Cancelar', ariaLabel: 'Cancelar', variant: 'outline', onClick: close });
            const saveBtn = Atoms.button({ icon: 'check', label: 'Salvar', ariaLabel: 'Salvar', variant: 'primary', onClick: applyAndClose });
            footerEl.appendChild(cancelBtn);
            footerEl.appendChild(saveBtn);
        }

        function renderProvider() {
            const form = document.createElement('div');
            form.className = 'kpe-param-body kpe-provider-settings';

            const listWrap = document.createElement('div');
            listWrap.className = 'kpe-provider-list';
            const editorWrap = document.createElement('div');
            editorWrap.className = 'kpe-provider-editor-wrap';

            function createSectionLabel(icon, text) {
                const label = document.createElement('div');
                label.className = 'kpe-section-label';
                label.append(Atoms.icon(icon));
                const title = document.createElement('span');
                title.textContent = text;
                label.appendChild(title);
                return label;
            }

            function parseHeaders(raw) {
                const txt = String(raw || '').trim();
                if (!txt || txt === '{}') return {};
                try {
                    const parsed = JSON.parse(txt);
                    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Headers devem ser um JSON objeto.');
                    return parsed;
                } catch (error) {
                    throw new Error(error?.message || 'JSON de headers inválido.');
                }
            }

            function renderEditor(provider = null) {
                const draft = provider ? {
                    id: provider.id,
                    name: provider.name || '',
                    url: provider.url || '',
                    model: provider.model || '',
                    apiKey: provider.apiKey || '',
                    headers: JSON.stringify(provider.headers || {}, null, 2),
                    fallback: !!provider.fallback
                } : {
                    id: '',
                    name: '',
                    url: '',
                    model: '',
                    apiKey: '',
                    headers: '{\n  "HTTP-Referer": "https://github.com/EdgeTypE/better-deepseek",\n  "X-Title": "Prompt-Enhancer"\n}',
                    fallback: false
                };

                editorWrap.innerHTML = '';
                const card = document.createElement('div');
                card.className = 'kpe-provider-editor';

                const title = document.createElement('div');
                title.className = 'kpe-field-title';
                title.textContent = provider ? 'Editar provider' : 'Adicionar provider';
                card.appendChild(title);

                const rows = [
                    ['Nome', 'text', 'name', draft.name, 'Nome visível do provedor'],
                    ['URL', 'url', 'url', draft.url, 'Endpoint completo do chat completions'],
                    ['Modelo', 'text', 'model', draft.model, 'Ex.: gpt-4o-mini / llama3.2 / openai/gpt-4o-mini'],
                    ['API Key', 'password', 'apiKey', draft.apiKey, 'Opcional para provedor público ou local'],
                    ['Headers extras (JSON)', 'textarea', 'headers', draft.headers, 'Ex.: {"X-Title": "Prompt-Enhancer"}']
                ];

                rows.forEach(([labelText, type, field, value, hint]) => {
                    const row = document.createElement('div');
                    row.className = 'kpe-param-row kpe-param-row--full';
                    const label = document.createElement('label');
                    label.className = 'kpe-param-label';
                    label.htmlFor = `kpe-provider-${field}`;
                    label.textContent = labelText;
                    const control = document.createElement('div');
                    control.className = 'kpe-param-control';
                    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
                    input.className = 'kpe-param-input';
                    input.id = `kpe-provider-${field}`;
                    input.name = field;
                    input.value = String(value || '');
                    if (['name', 'url', 'model'].includes(field)) {
                        input.required = true;
                        input.setAttribute('aria-required', 'true');
                    }
                    if (type !== 'textarea') {
                        input.type = type;
                        input.autocomplete = type === 'password' ? 'new-password' : 'off';
                    } else {
                        input.rows = 5;
                    }
                    control.appendChild(input);
                    if (hint) {
                        const helper = document.createElement('div');
                        helper.className = 'kpe-param-hint';
                        helper.textContent = hint;
                        control.appendChild(helper);
                    }
                    row.append(label, control);
                    card.appendChild(row);
                    draft[field] = input;
                });

                const fallbackRow = document.createElement('label');
                fallbackRow.className = 'kpe-check-row';
                const fallbackCheck = document.createElement('input');
                fallbackCheck.type = 'checkbox';
                fallbackCheck.checked = !!draft.fallback;
                fallbackCheck.disabled = provider?.id === ProviderManager.getActive()?.id;
                const fallbackText = document.createElement('span');
                fallbackText.textContent = 'Definir como provedor de fallback';
                if (fallbackCheck.disabled) fallbackText.title = 'Escolha outro provider como principal antes de defini-lo como fallback.';
                fallbackRow.append(fallbackCheck, fallbackText);
                card.appendChild(fallbackRow);

                const actions = document.createElement('div');
                actions.className = 'kpe-provider-actions';
                const saveBtn = Atoms.buttonNode({ label: provider ? 'Salvar alterações' : 'Adicionar provider', ariaLabel: provider ? 'Salvar alterações do provider' : 'Adicionar novo provider', variant: 'primary' });
                const cancelBtn = Atoms.buttonNode({ label: 'Cancelar', ariaLabel: 'Cancelar edição', variant: 'outline' });
                saveBtn.addEventListener('click', () => {
                    try {
                        const payload = {
                            name: draft.name.value.trim(),
                            url: draft.url.value.trim(),
                            model: draft.model.value.trim(),
                            apiKey: draft.apiKey.value.trim(),
                            headers: parseHeaders(draft.headers.value),
                            fallback: !!fallbackCheck.checked
                        };
                        if (!payload.name) throw new Error('Informe um nome para o provider.');
                        if (!payload.url) throw new Error('Informe a URL do provider.');
                        if (!payload.model) throw new Error('Informe o modelo do provider.');
                        const saved = provider ? ProviderManager.update(provider.id, payload) : ProviderManager.add(payload);
                        const targetId = saved?.id || provider?.id || '';
                        if (fallbackCheck.checked) ProviderManager.setFallback(targetId);
                        else if (provider && provider.id === (ProviderManager.getFallback?.()?.id || '')) ProviderManager.setFallback('');
                        Molecules.toast(provider ? 'Provider atualizado.' : 'Provider adicionado.', 'success');
                        render();
                    } catch (error) {
                        Molecules.toast(error?.message || 'Não foi possível salvar o provider.', 'error');
                    }
                });
                cancelBtn.addEventListener('click', () => render());
                actions.append(saveBtn, cancelBtn);
                card.appendChild(actions);
                editorWrap.appendChild(card);
                card.querySelector('[name="name"]')?.focus();
            }

            function renderList() {
                listWrap.innerHTML = '';
                const list = ProviderManager && ProviderManager.list ? ProviderManager.list() : [];
                const active = ProviderManager && ProviderManager.getActive ? ProviderManager.getActive() : null;
                const fallback = ProviderManager && ProviderManager.getFallback ? ProviderManager.getFallback() : null;

                if (!list.length) {
                    const empty = document.createElement('div');
                    empty.className = 'kpe-provider-empty';
                    empty.textContent = 'Nenhum provider salvo. Adicione o primeiro para configurar a API.';
                    listWrap.appendChild(empty);
                    return;
                }

                list.forEach((provider) => {
                    const card = document.createElement('div');
                    card.className = `kpe-provider-card ${provider.id === active?.id ? 'is-active' : ''}`;
                    card.setAttribute('role', 'group');
                    card.setAttribute('aria-label', `Provider ${provider.name || 'sem nome'}`);

                    const header = document.createElement('div');
                    header.className = 'kpe-provider-card__header';
                    const title = document.createElement('strong');
                    title.textContent = provider.name || 'Provider';
                    const badge = document.createElement('span');
                    badge.className = 'kpe-provider-badge';
                    badge.textContent = provider.builtin ? 'Padrão' : 'Custom';
                    const badges = document.createElement('div');
                    badges.className = 'kpe-provider-card__badges';
                    badges.appendChild(badge);
                    if (provider.id === active?.id) {
                        const activeBadge = document.createElement('span');
                        activeBadge.className = 'kpe-provider-role is-active';
                        activeBadge.textContent = 'Principal';
                        badges.appendChild(activeBadge);
                    }
                    if (provider.id === fallback?.id) {
                        const fallbackBadge = document.createElement('span');
                        fallbackBadge.className = 'kpe-provider-role is-fallback';
                        fallbackBadge.textContent = 'Fallback';
                        badges.appendChild(fallbackBadge);
                    }
                    header.append(title, badges);

                    const meta = document.createElement('div');
                    meta.className = 'kpe-provider-card__meta';
                    meta.textContent = `${provider.model || 'sem modelo'} · ${provider.url || 'sem URL'}`;

                    const actions = document.createElement('div');
                    actions.className = 'kpe-provider-actions';

                    const activeBtn = Atoms.buttonNode({
                        label: provider.id === active?.id ? 'Ativo' : 'Ativar',
                        ariaLabel: provider.id === active?.id ? `${provider.name} é o provider principal` : `Ativar ${provider.name}`,
                        variant: provider.id === active?.id ? 'primary' : 'outline'
                    });
                    activeBtn.setAttribute('aria-pressed', String(provider.id === active?.id));
                    activeBtn.addEventListener('click', () => {
                        ProviderManager.setActive(provider.id);
                        render();
                    });

                    const fallbackBtn = Atoms.buttonNode({
                        label: provider.id === fallback?.id ? 'Fallback' : 'Definir fallback',
                        ariaLabel: provider.id === fallback?.id ? `${provider.name} é o provider de fallback` : `Definir ${provider.name} como fallback`,
                        variant: provider.id === fallback?.id ? 'primary' : 'outline'
                    });
                    fallbackBtn.disabled = provider.id === active?.id;
                    fallbackBtn.title = provider.id === active?.id ? 'Escolha outro provider como principal antes de defini-lo como fallback.' : '';
                    fallbackBtn.setAttribute('aria-pressed', String(provider.id === fallback?.id));
                    fallbackBtn.addEventListener('click', () => {
                        if (provider.id === fallback?.id) ProviderManager.setFallback('');
                        else ProviderManager.setFallback(provider.id);
                        render();
                    });

                    const editBtn = Atoms.buttonNode({ label: 'Editar', ariaLabel: 'Editar provider', variant: 'outline' });
                    editBtn.addEventListener('click', () => renderEditor(provider));

                    const removeBtn = Atoms.buttonNode({ label: 'Remover', ariaLabel: 'Remover provider', variant: 'outline' });
                    removeBtn.disabled = !!provider.builtin;
                    removeBtn.title = provider.builtin ? 'O provedor padrão não pode ser removido.' : 'Remover provider';
                    removeBtn.addEventListener('click', () => {
                        if (provider.builtin) return;
                        if (!confirm(`Remover o provider "${provider.name}"?`)) return;
                        ProviderManager.remove(provider.id);
                        render();
                    });

                    actions.append(activeBtn, fallbackBtn, editBtn, removeBtn);
                    card.append(header, meta, actions);
                    listWrap.appendChild(card);
                });
            }

            const providers = ProviderManager && ProviderManager.list ? ProviderManager.list() : [];
            const active = ProviderManager && ProviderManager.getActive ? ProviderManager.getActive() : null;
            const fallback = ProviderManager && ProviderManager.getFallback ? ProviderManager.getFallback() : null;

            const activeSection = document.createElement('div');
            activeSection.appendChild(createSectionLabel('sliders', 'Modelo padrão'));
            const activeRow = document.createElement('div');
            activeRow.className = 'kpe-param-row kpe-param-row--full';
            const activeLabel = document.createElement('label');
            activeLabel.className = 'kpe-param-label';
            activeLabel.htmlFor = 'kpe-provider-active';
            activeLabel.textContent = 'Provedor principal';
            const activeControl = document.createElement('div');
            activeControl.className = 'kpe-param-control';
            const activeSelect = document.createElement('select');
            activeSelect.className = 'kpe-param-input';
            activeSelect.id = 'kpe-provider-active';
            const activePlaceholder = document.createElement('option');
            activePlaceholder.value = '';
            activePlaceholder.textContent = 'Selecione um provider';
            activeSelect.appendChild(activePlaceholder);
            providers.forEach(provider => {
                const option = document.createElement('option');
                option.value = provider.id;
                option.textContent = `${provider.name || 'Provider'} (${provider.model || 'sem modelo'})`;
                activeSelect.appendChild(option);
            });
            activeSelect.value = active?.id || '';
            activeSelect.addEventListener('change', () => {
                if (!activeSelect.value) return;
                ProviderManager.setActive(activeSelect.value);
                render();
            });
            activeControl.appendChild(activeSelect);
            const activeHint = document.createElement('div');
            activeHint.className = 'kpe-param-hint';
            activeHint.textContent = 'Provedor principal usado em todas as chamadas.';
            activeControl.appendChild(activeHint);
            activeRow.append(activeLabel, activeControl);
            activeSection.appendChild(activeRow);

            const fallbackSection = document.createElement('div');
            fallbackSection.appendChild(createSectionLabel('undo', 'Fallback'));
            const fallbackBadge = document.createElement('span');
            fallbackBadge.className = 'kpe-provider-role is-fallback';
            fallbackBadge.setAttribute('aria-live', 'polite');
            fallbackBadge.textContent = fallback?.name || 'Nenhum fallback definido';
            fallbackSection.appendChild(fallbackBadge);
            const fallbackRow = document.createElement('div');
            fallbackRow.className = 'kpe-param-row kpe-param-row--full';
            const fallbackLabel = document.createElement('label');
            fallbackLabel.className = 'kpe-param-label';
            fallbackLabel.htmlFor = 'kpe-provider-fallback';
            fallbackLabel.textContent = 'Provedor de fallback';
            const fallbackControl = document.createElement('div');
            fallbackControl.className = 'kpe-param-control';
            const fallbackSelect = document.createElement('select');
            fallbackSelect.className = 'kpe-param-input';
            fallbackSelect.id = 'kpe-provider-fallback';
            const fallbackPlaceholder = document.createElement('option');
            fallbackPlaceholder.value = '';
            fallbackPlaceholder.textContent = 'Nenhum fallback definido';
            fallbackSelect.appendChild(fallbackPlaceholder);
            providers.forEach(provider => {
                const option = document.createElement('option');
                option.value = provider.id;
                option.textContent = `${provider.name || 'Provider'} (${provider.model || 'sem modelo'})`;
                if (provider.id === active?.id) {
                    option.disabled = true;
                    option.title = 'O provedor principal não pode ser usado como fallback.';
                }
                fallbackSelect.appendChild(option);
            });
            fallbackSelect.value = fallback?.id || '';
            fallbackSelect.addEventListener('change', () => {
                ProviderManager.setFallback(fallbackSelect.value);
                render();
            });
            fallbackControl.appendChild(fallbackSelect);
            const fallbackHint = document.createElement('div');
            fallbackHint.className = 'kpe-param-hint';
            fallbackHint.textContent = 'Usado automaticamente se o principal falhar.';
            fallbackControl.appendChild(fallbackHint);
            fallbackRow.append(fallbackLabel, fallbackControl);
            fallbackSection.appendChild(fallbackRow);
            const fallbackButton = Atoms.buttonNode({
                label: fallback ? 'Remover fallback' : 'Definir fallback',
                ariaLabel: fallback ? 'Remover provedor de fallback' : 'Definir provedor de fallback',
                variant: 'outline'
            });
            fallbackButton.addEventListener('click', () => {
                ProviderManager.setFallback(fallback ? '' : fallbackSelect.value);
                render();
            });
            fallbackSection.appendChild(fallbackButton);

            const addSection = document.createElement('div');
            addSection.appendChild(createSectionLabel('upload', 'Adicionar provedor'));
            const addBtn = Atoms.buttonNode({ label: 'Adicionar provider', ariaLabel: 'Adicionar novo provider', variant: 'primary' });
            addBtn.addEventListener('click', () => renderEditor(null));
            const toolbar = document.createElement('div');
            toolbar.className = 'kpe-provider-toolbar';
            toolbar.appendChild(addBtn);
            addSection.append(toolbar, editorWrap);

            form.append(activeSection, fallbackSection, addSection, listWrap);
            renderList();
            bodyEl.appendChild(form);

            const cancelBtn = Atoms.button({ icon: 'x', label: 'Cancelar', ariaLabel: 'Cancelar', variant: 'outline', onClick: close });
            const saveBtn = Atoms.button({ icon: 'check', label: 'Salvar', ariaLabel: 'Salvar', variant: 'primary', onClick: applyAndClose });
            footerEl.append(cancelBtn, saveBtn);
        }
        function renderContext() {
            const form = document.createElement('div');
            form.className = 'kpe-param-body';

            const infoBox = document.createElement('div');
            infoBox.className = 'kpe-context-info';
            const activeFiles = ProjectContext.list().filter(f => f.enabled);
            infoBox.innerHTML = `<div class="kpe-context-info__title">Contexto do projeto</div><div class="kpe-context-info__text">${activeFiles.length} arquivo(s) ativo(s) · ${Utils.formatBytes(ProjectContext.getTotalSize())} · ${ProjectContext.isEnabled() ? 'injeção ON' : 'injeção OFF'}</div><div class="kpe-context-info__hint">Anexado automaticamente ao final do system prompt (quando ativado).</div>`;
            const manageBtn = document.createElement('button');
            manageBtn.type = 'button';
            manageBtn.className = 'kpe-context-manage';
            manageBtn.textContent = 'Gerenciar arquivos';
            manageBtn.addEventListener('click', () => { close(); setTimeout(() => State.activeComposer?.actionbar?.contextBtn?.click(), 250); });
            infoBox.appendChild(manageBtn);
            form.appendChild(infoBox);

            ['response_language', 'response_persona'].forEach(key => {
                const f = ParamSchema.SCHEMA.find(x => x.key === key);
                const row = document.createElement('div');
                row.className = 'kpe-param-row';
                const opts = f.options.map(o => `<option value="${o.value}" ${draft[key] === o.value ? 'selected' : ''}>${Utils.escapeHtml(o.label)}</option>`).join('');
                row.innerHTML = `<label class="kpe-param-label" for="kpe-param-${key}">${Utils.escapeHtml(f.label)}</label><div class="kpe-param-control"><select id="kpe-param-${key}" class="kpe-param-input">${opts}</select><div class="kpe-param-hint">${Utils.escapeHtml(f.hint)}</div></div>`;
                form.appendChild(row);
                row.querySelector('select').addEventListener('change', (e) => {
                    draft[key] = e.target.value;
                    if (key === 'response_persona') updateCustomToneVisibility();
                });
            });

            const customTone = ParamSchema.SCHEMA.find(f => f.key === 'response_persona_custom');
            const customToneRow = document.createElement('div');
            customToneRow.className = 'kpe-param-row';
            customToneRow.innerHTML = `<label class="kpe-param-label" for="kpe-param-${customTone.key}">${Utils.escapeHtml(customTone.label)}</label><div class="kpe-param-control"><input type="text" id="kpe-param-${customTone.key}" class="kpe-param-input" maxlength="${customTone.maxLength}" value="${Utils.escapeHtml(draft[customTone.key] || '')}" placeholder="Ex: sarcástico, mas didático"><div class="kpe-param-hint">${Utils.escapeHtml(customTone.hint)}</div></div>`;
            form.appendChild(customToneRow);
            customToneRow.querySelector('input').addEventListener('input', (e) => { draft[customTone.key] = e.target.value; });
            function updateCustomToneVisibility() {
                customToneRow.style.display = draft.response_persona === 'auto' ? 'none' : '';
            }
            updateCustomToneVisibility();

            bodyEl.appendChild(form);
            const cancelBtn = Atoms.button({ icon: 'x', label: 'Cancelar', ariaLabel: 'Cancelar', variant: 'outline', onClick: close });
            const saveBtn = Atoms.button({ icon: 'check', label: 'Salvar', ariaLabel: 'Salvar', variant: 'primary', onClick: applyAndClose });
            footerEl.appendChild(cancelBtn);
            footerEl.appendChild(saveBtn);
        }

        function renderSystemPrompt() {
            const form = document.createElement('div');
            form.className = 'kpe-param-body kpe-system-prompt';

            const intro = document.createElement('div');
            intro.className = 'kpe-system-prompt__intro';
            const title = document.createElement('h5');
            title.className = 'kpe-system-prompt__title';
            title.textContent = 'Instruções de aprimoramento';
            const description = document.createElement('p');
            description.className = 'kpe-system-prompt__description';
            description.textContent = 'Complementa o aprimoramento direto e o fluxo guiado. Contexto do projeto, idioma e personalidade são configurados separadamente.';
            intro.append(title, description);
            form.appendChild(intro);

            const editorCard = document.createElement('section');
            editorCard.className = 'kpe-system-prompt__card kpe-system-prompt__editor-card';
            editorCard.setAttribute('aria-labelledby', 'kpe-system-prompt-heading');
            const editorHeading = document.createElement('div');
            editorHeading.className = 'kpe-system-prompt__section-heading';
            const editorTitle = document.createElement('h6');
            editorTitle.id = 'kpe-system-prompt-heading';
            editorTitle.textContent = 'Prompt ativo';
            const editorHint = document.createElement('p');
            editorHint.textContent = 'Edite as instruções usadas pelo script.';
            editorHeading.append(editorTitle, editorHint);

            const editorLabel = document.createElement('label');
            editorLabel.className = 'kpe-system-prompt__label';
            editorLabel.htmlFor = 'kpe-system-prompt-editor';
            editorLabel.textContent = 'Conteúdo do system prompt';
            const editor = document.createElement('textarea');
            editor.id = 'kpe-system-prompt-editor';
            editor.className = 'kpe-textarea kpe-system-prompt__textarea';
            editor.rows = 12;
            editor.maxLength = SystemPromptManager.MAX_LENGTH;
            editor.value = systemPromptDraft.prompt;
            editor.setAttribute('aria-describedby', 'kpe-system-prompt-feedback kpe-system-prompt-count');
            const count = document.createElement('div');
            count.id = 'kpe-system-prompt-count';
            count.className = 'kpe-system-prompt__count';
            const feedback = document.createElement('div');
            feedback.id = 'kpe-system-prompt-feedback';
            feedback.className = 'kpe-system-prompt__feedback';
            feedback.setAttribute('role', 'status');
            feedback.setAttribute('aria-live', 'polite');
            const updateValidation = () => {
                const result = SystemPromptManager.validatePrompt(systemPromptDraft.prompt);
                count.textContent = `${result.charCount.toLocaleString('pt-BR')} / ${SystemPromptManager.MAX_LENGTH.toLocaleString('pt-BR')} caracteres`;
                const state = result.errors.length ? 'error' : (result.warnings.length ? 'warning' : 'valid');
                feedback.className = `kpe-system-prompt__feedback is-${state}`;
                editor.setAttribute('aria-invalid', String(result.errors.length > 0));
                feedback.textContent = result.errors.length
                    ? result.errors.join(' ')
                    : (result.warnings.length ? result.warnings.join(' ') : 'Prompt válido.');
            };
            editor.addEventListener('input', () => {
                systemPromptDraft.prompt = editor.value;
                updateValidation();
            });
            const editorMeta = document.createElement('div');
            editorMeta.className = 'kpe-system-prompt__meta';
            editorMeta.append(count, feedback);
            const editorControls = document.createElement('div');
            editorControls.className = 'kpe-system-prompt__editor-controls';

            const resetBtn = Atoms.button({
                icon: 'undo', label: 'Redefinir para o padrão', ariaLabel: 'Redefinir para o system prompt padrão',
                variant: 'outline', onClick: () => {
                    systemPromptDraft.prompt = CONFIG.SYSTEM_PROMPT;
                    editor.value = systemPromptDraft.prompt;
                    updateValidation();
                    Molecules.toast('Prompt padrão restaurado no editor. Salve para aplicar.', 'info');
                }
            });
            editorControls.appendChild(resetBtn);
            editorCard.append(editorHeading, editorLabel, editor, editorMeta, editorControls);
            form.appendChild(editorCard);

            const presetCard = document.createElement('section');
            presetCard.className = 'kpe-system-prompt__card kpe-system-prompt__presets';
            presetCard.setAttribute('aria-labelledby', 'kpe-system-presets-heading');
            const presetHeading = document.createElement('div');
            presetHeading.className = 'kpe-system-prompt__section-heading';
            const presetTitle = document.createElement('h6');
            presetTitle.id = 'kpe-system-presets-heading';
            presetTitle.textContent = 'Presets pessoais';
            const presetHint = document.createElement('p');
            presetHint.textContent = `Guarde até ${SystemPromptManager.MAX_PRESETS} versões para reutilizar. As alterações são persistidas ao salvar as configurações.`;
            presetHeading.append(presetTitle, presetHint);

            const presetSelectLabel = document.createElement('label');
            presetSelectLabel.className = 'kpe-system-prompt__label';
            presetSelectLabel.htmlFor = 'kpe-system-preset-select';
            presetSelectLabel.textContent = 'Preset salvo';
            const presetSelect = document.createElement('select');
            presetSelect.id = 'kpe-system-preset-select';
            presetSelect.className = 'kpe-param-input kpe-system-prompt__select';
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Selecione um preset';
            presetSelect.appendChild(emptyOption);
            systemPromptDraft.presets.forEach((preset) => {
                const option = document.createElement('option');
                option.value = preset.name;
                option.textContent = preset.name;
                presetSelect.appendChild(option);
            });
            if (systemPromptDraft.presets.some(preset => preset.name === selectedSystemPreset)) {
                presetSelect.value = selectedSystemPreset;
            } else {
                selectedSystemPreset = '';
            }

            const presetNameLabel = document.createElement('label');
            presetNameLabel.className = 'kpe-system-prompt__label';
            presetNameLabel.htmlFor = 'kpe-system-preset-name';
            presetNameLabel.textContent = 'Nome do preset';
            const presetName = document.createElement('input');
            presetName.id = 'kpe-system-preset-name';
            presetName.className = 'kpe-param-input kpe-system-prompt__name';
            presetName.type = 'text';
            presetName.maxLength = SystemPromptManager.MAX_PRESET_NAME;
            presetName.autocomplete = 'off';
            presetName.placeholder = 'Ex.: Revisão de código';
            presetName.setAttribute('aria-describedby', 'kpe-system-preset-name-hint');
            presetName.value = presetSelect.value;
            const presetNameHint = document.createElement('div');
            presetNameHint.id = 'kpe-system-preset-name-hint';
            presetNameHint.className = 'kpe-system-prompt__helper';
            presetNameHint.textContent = 'Use um nome novo para criar ou o nome selecionado para atualizar.';
            presetSelect.addEventListener('change', () => {
                selectedSystemPreset = presetSelect.value;
                presetName.value = presetSelect.value;
                const hasSelection = Boolean(presetSelect.value);
                loadPresetBtn.disabled = !hasSelection;
                renamePresetBtn.disabled = !hasSelection;
                deletePresetBtn.disabled = !hasSelection;
            });

            const presetFields = document.createElement('div');
            presetFields.className = 'kpe-system-prompt__preset-fields';
            const selectField = document.createElement('div');
            selectField.className = 'kpe-system-prompt__field';
            selectField.append(presetSelectLabel, presetSelect);
            const nameField = document.createElement('div');
            nameField.className = 'kpe-system-prompt__field';
            nameField.append(presetNameLabel, presetName, presetNameHint);
            presetFields.append(selectField, nameField);

            const presetActions = document.createElement('div');
            presetActions.className = 'kpe-system-prompt__preset-actions';
            const loadPresetBtn = Atoms.button({ icon: 'check', label: 'Carregar', ariaLabel: 'Carregar preset selecionado', variant: 'outline', onClick: () => {
                const selected = systemPromptDraft.presets.find(p => p.name === presetSelect.value);
                if (!selected) { Molecules.toast('Selecione um preset para carregar.', 'error'); return; }
                systemPromptDraft.prompt = selected.prompt;
                editor.value = selected.prompt;
                updateValidation();
                Molecules.toast(`Preset "${selected.name}" carregado. Salve para aplicar.`, 'success');
                editor.focus();
            }});
            const savePresetBtn = Atoms.button({ icon: 'check', label: 'Salvar preset', ariaLabel: 'Salvar ou atualizar preset', variant: 'outline', onClick: () => {
                const name = presetName.value.trim();
                const check = SystemPromptManager.validatePrompt(systemPromptDraft.prompt);
                if (check.errors.length) { Molecules.toast(check.errors.join(' '), 'error'); editor.focus(); return; }
                if (!name || name.length > SystemPromptManager.MAX_PRESET_NAME) {
                    Molecules.toast(`Informe um nome de até ${SystemPromptManager.MAX_PRESET_NAME} caracteres.`, 'error');
                    presetName.focus();
                    return;
                }
                const existing = systemPromptDraft.presets.find(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase());
                if (existing && !confirm(`O preset "${existing.name}" já existe. Substituí-lo?`)) return;
                if (!existing && systemPromptDraft.presets.length >= SystemPromptManager.MAX_PRESETS) {
                    Molecules.toast(`Limite de ${SystemPromptManager.MAX_PRESETS} presets atingido.`, 'error');
                    return;
                }
                const presets = systemPromptDraft.presets.map(preset => ({ ...preset }));
                const existingPreset = presets.find(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase());
                if (existingPreset) { existingPreset.name = name; existingPreset.prompt = systemPromptDraft.prompt; }
                else presets.push({ name, prompt: systemPromptDraft.prompt });
                try {
                    persistSystemPromptPresets(presets);
                } catch (error) {
                    Molecules.toast('Não foi possível salvar o preset.', 'error', { details: error.message });
                    return;
                }
                selectedSystemPreset = name;
                render();
                Molecules.toast(`Preset "${name}" salvo.`, 'success');
            }});
            const renamePresetBtn = Atoms.button({ icon: 'doc', label: 'Renomear', ariaLabel: 'Renomear preset selecionado', variant: 'outline', onClick: () => {
                const selectedIndex = systemPromptDraft.presets.findIndex(p => p.name === presetSelect.value);
                const name = presetName.value.trim();
                if (selectedIndex < 0) { Molecules.toast('Selecione um preset para renomear.', 'error'); return; }
                if (!name || name.length > SystemPromptManager.MAX_PRESET_NAME) { Molecules.toast(`Informe um nome de até ${SystemPromptManager.MAX_PRESET_NAME} caracteres.`, 'error'); return; }
                const duplicateIndex = systemPromptDraft.presets.findIndex((p, i) => i !== selectedIndex && p.name.toLocaleLowerCase() === name.toLocaleLowerCase());
                const presets = systemPromptDraft.presets.map(preset => ({ ...preset }));
                if (duplicateIndex >= 0) {
                    if (!confirm(`O preset "${systemPromptDraft.presets[duplicateIndex].name}" já existe. Substituí-lo e excluir o preset renomeado?`)) return;
                    presets.splice(duplicateIndex, 1);
                    const adjustedIndex = selectedIndex > duplicateIndex ? selectedIndex - 1 : selectedIndex;
                    presets.splice(adjustedIndex, 1, { name, prompt: presets[adjustedIndex].prompt });
                } else {
                    presets[selectedIndex].name = name;
                }
                try {
                    persistSystemPromptPresets(presets);
                } catch (error) {
                    Molecules.toast('Não foi possível renomear o preset.', 'error', { details: error.message });
                    return;
                }
                selectedSystemPreset = name;
                render();
                Molecules.toast('Preset renomeado.', 'success');
            }});
            const deletePresetBtn = Atoms.button({ icon: 'trash', label: 'Excluir', ariaLabel: 'Excluir preset selecionado', variant: 'outline', onClick: () => {
                const selectedIndex = systemPromptDraft.presets.findIndex(p => p.name === presetSelect.value);
                if (selectedIndex < 0) { Molecules.toast('Selecione um preset para excluir.', 'error'); return; }
                const name = systemPromptDraft.presets[selectedIndex].name;
                if (!confirm(`Excluir o preset "${name}"?`)) return;
                const presets = systemPromptDraft.presets.map(preset => ({ ...preset }));
                presets.splice(selectedIndex, 1);
                try {
                    persistSystemPromptPresets(presets);
                } catch (error) {
                    Molecules.toast('Não foi possível excluir o preset.', 'error', { details: error.message });
                    return;
                }
                selectedSystemPreset = '';
                render();
                Molecules.toast('Preset excluído.', 'success');
            }});
            [loadPresetBtn, savePresetBtn, renamePresetBtn, deletePresetBtn].forEach(button => presetActions.appendChild(button));
            const hasSelection = Boolean(presetSelect.value);
            loadPresetBtn.disabled = !hasSelection;
            renamePresetBtn.disabled = !hasSelection;
            deletePresetBtn.disabled = !hasSelection;
            presetCard.append(presetHeading, presetFields, presetActions);
            form.appendChild(presetCard);

            const defaultDetails = document.createElement('details');
            defaultDetails.className = 'kpe-system-prompt__default';
            const defaultSummary = document.createElement('summary');
            defaultSummary.textContent = 'Ver prompt padrão original';
            const defaultDescription = document.createElement('p');
            defaultDescription.className = 'kpe-system-prompt__helper';
            defaultDescription.textContent = 'Referência somente leitura; redefinir copia este conteúdo para o editor.';
            const defaultEditor = document.createElement('textarea');
            defaultEditor.id = 'kpe-system-prompt-default';
            defaultEditor.className = 'kpe-textarea kpe-system-prompt__default-textarea';
            defaultEditor.rows = 6;
            defaultEditor.readOnly = true;
            defaultEditor.setAttribute('aria-label', 'System prompt padrão original do script, somente leitura');
            defaultEditor.value = CONFIG.SYSTEM_PROMPT;
            defaultDetails.append(defaultSummary, defaultDescription, defaultEditor);
            form.appendChild(defaultDetails);

            bodyEl.appendChild(form);
            updateValidation();
            const cancelBtn = Atoms.button({ icon: 'x', label: 'Cancelar', ariaLabel: 'Cancelar', variant: 'outline', onClick: close });
            const testBtn = Atoms.button({ icon: 'check', label: 'Testar localmente', ariaLabel: 'Validar e simular o system prompt localmente', variant: 'outline', onClick: () => {
                const result = SystemPromptManager.simulate(systemPromptDraft.prompt);
                if (!result.ok) {
                    feedback.className = 'kpe-system-prompt__feedback is-error';
                    feedback.textContent = result.errors.join(' ') || result.message;
                    Molecules.toast(result.errors.join(' ') || result.message, 'error');
                    Anim.shake(editor);
                    return;
                }
                feedback.className = `kpe-system-prompt__feedback is-${result.warnings.length ? 'warning' : 'valid'}`;
                feedback.textContent = [result.message, ...result.warnings].join(' ');
                Molecules.toast(result.message, 'success');
            }});
            const saveBtn = Atoms.button({ icon: 'check', label: 'Salvar', ariaLabel: 'Salvar system prompt e configurações', variant: 'primary', onClick: applyAndClose });
            footerEl.appendChild(cancelBtn);
            footerEl.appendChild(testBtn);
            footerEl.appendChild(saveBtn);
        }

        function renderHistory() {
            const runs = EnhancementHistory.listRuns();
            if (!runs.length) {
                const empty = document.createElement('div');
                empty.className = 'kpe-history-empty';
                empty.textContent = 'Nenhuma execução registrada ainda. Cada execução (Aprimorar ou Guiado) aparecerá aqui com suas chamadas à API aninhadas.';
                bodyEl.appendChild(empty);
                const closeBtn = Atoms.button({ icon: 'x', label: 'Fechar', ariaLabel: 'Fechar', variant: 'primary', onClick: close });
                footerEl.appendChild(closeBtn);
                return;
            }
            const container = document.createElement('div');
            const statusIconMap = { success: '✓', error: '✗', aborted: '⏸', pending: '○' };
            const outcomeLabels = { applied: 'Aplicado', cancelled: 'Cancelado', error: 'Erro', aborted: 'Abortado', pending: 'Pendente' };
            const copyRunJson = async (run) => {
                const json = JSON.stringify(run, null, 2);
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(json);
                } else {
                    const textarea = document.createElement('textarea');
                    textarea.value = json;
                    textarea.setAttribute('readonly', '');
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    textarea.style.pointerEvents = 'none';
                    document.body.appendChild(textarea);
                    try {
                        textarea.select();
                        if (!document.execCommand('copy')) throw new Error('O navegador não permitiu copiar para a área de transferência.');
                    } finally {
                        textarea.remove();
                    }
                }
            };
            runs.forEach((run) => {
                const card = document.createElement('div');
                card.className = 'kpe-history-item';

                const heading = document.createElement('div');
                heading.className = 'kpe-history-item__heading';
                const header = document.createElement('button');
                header.type = 'button';
                header.className = 'kpe-history-item__header';
                header.setAttribute('aria-expanded', 'false');

                const statusIcon = statusIconMap[run.status] || '○';
                const statusClass = run.status === 'success' ? 'is-success' : run.status === 'error' ? 'is-error' : run.status === 'aborted' ? 'is-aborted' : '';
                const typeBadge = run.type === 'guided' ? 'Guiado' : 'Aprimorar';
                const preview = Utils.truncate(run.input || '', 100);
                const time = new Date(run.startedAt).toLocaleString('pt-BR');
                const dur = run.durationMs >= 1000 ? `${(run.durationMs / 1000).toFixed(2)}s` : `${run.durationMs}ms`;
                const callsCount = (run.calls && run.calls.length) || 0;
                const outcomeLabel = outcomeLabels[run.outcome] || run.outcome || '—';
                const outcomeClass = `kpe-outcome-${run.outcome || 'pending'}`;
                const legacyBadge = run.meta && run.meta.legacy ? '<span class="kpe-history-legacy-badge">legado</span>' : '';

                header.innerHTML = `
                    <span class="kpe-history-item__status ${statusClass}">${statusIcon}</span>
                    <span class="kpe-history-item__main">
                        <span class="kpe-history-item__preview">
                            <span class="kpe-history-badge">${Utils.escapeHtml(typeBadge)}</span>${legacyBadge}
                            ${Utils.escapeHtml(preview)}
                        </span>
                        <span class="kpe-history-item__meta">
                            <span>${Utils.escapeHtml(time)}</span>
                            <span>· ${dur}</span>
                            <span>· ${callsCount} chamada(s)</span>
                            <span class="kpe-history-outcome ${outcomeClass}">${Utils.escapeHtml(outcomeLabel)}</span>
                        </span>
                    </span>
                    <span class="kpe-history-item__chevron">${Atoms.icon('chevronD').outerHTML}</span>
                `;
                header.addEventListener('click', () => {
                    const isExpanded = card.classList.toggle('is-expanded');
                    header.setAttribute('aria-expanded', String(isExpanded));
                });
                heading.appendChild(header);

                const copyBtn = Atoms.buttonNode({
                    label: 'Copiar JSON',
                    ariaLabel: `Copiar execução ${typeBadge} como JSON`,
                    variant: 'outline',
                    onClick: async () => {
                        try {
                            await copyRunJson(run);
                            Molecules.toast('Execução copiada como JSON.', 'success');
                        } catch (error) {
                            console.error('[KPE] Falha ao copiar execução do histórico:', error);
                            Molecules.toast('Não foi possível copiar o JSON desta execução.', 'error', { details: error.message });
                        }
                    }
                });
                copyBtn.classList.add('kpe-history-item__copy');
                copyBtn.prepend(Atoms.icon('copy'));
                heading.appendChild(copyBtn);
                card.appendChild(heading);

                const details = document.createElement('div');
                details.className = 'kpe-history-item__details';

                const addSection = (label, content, opts = {}) => {
                    const sec = document.createElement('div');
                    sec.className = 'kpe-history-section';
                    const lbl = document.createElement('div');
                    lbl.className = 'kpe-history-section__label';
                    lbl.textContent = label;
                    sec.appendChild(lbl);
                    if (opts.isKV) {
                        const kv = document.createElement('div');
                        kv.className = 'kpe-history-kv';
                        kv.textContent = content;
                        sec.appendChild(kv);
                    } else {
                        const pre = document.createElement('pre');
                        pre.className = 'kpe-history-pre' + (opts.isError ? ' is-error' : '');
                        pre.textContent = content;
                        sec.appendChild(pre);
                    }
                    details.appendChild(sec);
                };

                addSection('Entrada', run.input || '(vazio)');

                const ctx = run.contextInfo;
                if (ctx && (ctx.activeCount || ctx.totalBytes || ctx.enabled)) {
                    addSection('Contexto', `${ctx.activeCount || 0} arquivo(s) · ${Utils.formatBytes(ctx.totalBytes || 0)} · ${ctx.enabled ? 'injeção ON' : 'injeção OFF'}`, { isKV: true });
                } else {
                    addSection('Contexto', '—', { isKV: true });
                }

                addSection('Parâmetros', JSON.stringify(run.params || {}, null, 2));

                if (run.error) {
                    addSection('Resultado final — Erro', JSON.stringify(run.error, null, 2), { isError: true });
                } else if (run.output) {
                    addSection('Resultado final', run.output);
                } else {
                    addSection('Resultado final', '(sem saída)', { isKV: true });
                }

                if (run.calls && run.calls.length) {
                    const callsLabel = document.createElement('div');
                    callsLabel.className = 'kpe-history-section__label';
                    callsLabel.textContent = `Chamadas à API (${run.calls.length})`;
                    details.appendChild(callsLabel);

                    run.calls.forEach((call) => {
                        const callEl = document.createElement('div');
                        callEl.className = 'kpe-history-call';
                        const callHeader = document.createElement('button');
                        callHeader.type = 'button';
                        callHeader.className = 'kpe-history-call__header';
                        callHeader.setAttribute('aria-expanded', 'false');

                        const callStatus = call.error ? 'is-error' : 'is-success';
                        const callStatusIcon = call.error ? '✗' : '✓';
                        const callDur = call.durationMs >= 1000 ? `${(call.durationMs / 1000).toFixed(2)}s` : `${call.durationMs}ms`;
                        const kindLabel = call.kind === 'questions' ? 'Perguntas' : call.kind === 'enhance-with-answers' ? 'Aprimorar c/ respostas' : 'Principal';
                        const retryTag = call.retryOf ? ' · retry' : '';
                        const streamTag = call.streamUsed ? ' · stream' : '';
                        const fbTag = call.fallbackUsed ? ' · fallback' : '';

                        callHeader.innerHTML = `
                            <span class="kpe-history-call__status ${callStatus}">${callStatusIcon}</span>
                            <span class="kpe-history-call__main">
                                <span class="kpe-history-call__title">${Utils.escapeHtml(kindLabel)} · tentativa ${call.attempt}${retryTag}</span>
                                <span class="kpe-history-call__meta">${callDur}${streamTag}${fbTag}</span>
                            </span>
                            <span class="kpe-history-call__chevron">${Atoms.icon('chevronD').outerHTML}</span>
                        `;
                        callHeader.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const isExp = callEl.classList.toggle('is-expanded');
                            callHeader.setAttribute('aria-expanded', String(isExp));
                        });
                        callEl.appendChild(callHeader);

                        const callDetails = document.createElement('div');
                        callDetails.className = 'kpe-history-call__details';

                        const addCallSection = (label, content, opts = {}) => {
                            const sec = document.createElement('div');
                            sec.className = 'kpe-history-section';
                            const lbl = document.createElement('div');
                            lbl.className = 'kpe-history-section__label';
                            lbl.textContent = label;
                            sec.appendChild(lbl);
                            if (opts.isKV) {
                                const kv = document.createElement('div');
                                kv.className = 'kpe-history-kv';
                                kv.textContent = content;
                                sec.appendChild(kv);
                            } else {
                                const pre = document.createElement('pre');
                                pre.className = 'kpe-history-pre' + (opts.isError ? ' is-error' : '');
                                pre.textContent = content;
                                sec.appendChild(pre);
                            }
                            callDetails.appendChild(sec);
                        };

                        if (call.payload) {
                            if (call.payload.system) addCallSection('System prompt', call.payload.system);
                            if (call.payload.messages && call.payload.messages.length) addCallSection('Mensagens', JSON.stringify(call.payload.messages, null, 2));
                            if (call.payload.params) addCallSection('Parâmetros', JSON.stringify(call.payload.params, null, 2));
                            if (call.payload.meta) addCallSection('Metadados', JSON.stringify(call.payload.meta, null, 2));
                        }
                        if (call.output) addCallSection('Saída', call.output);
                        else addCallSection('Saída', '(vazio)', { isKV: true });
                        if (call.error) addCallSection('Erro', JSON.stringify(call.error, null, 2), { isError: true });

                        callEl.appendChild(callDetails);
                        details.appendChild(callEl);
                    });
                }

                card.appendChild(details);
                container.appendChild(card);
            });
            bodyEl.appendChild(container);

            const clearBtn = Atoms.button({ icon: 'trash', label: 'Limpar histórico', ariaLabel: 'Limpar histórico', variant: 'outline', onClick: () => {
                if (confirm('Limpar todo o histórico de aprimoramentos?')) { EnhancementHistory.clear(); render(); }
            }});
            const closeBtn = Atoms.button({ icon: 'x', label: 'Fechar', ariaLabel: 'Fechar', variant: 'primary', onClick: close });
            footerEl.appendChild(clearBtn);
            footerEl.appendChild(closeBtn);
        }

        render();
        return { close };
    }
