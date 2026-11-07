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
            console.error('[PE] Falha ao carregar o system prompt:', error);
            Molecules.toast('Não foi possível carregar o system prompt salvo. Redefina-o ou tente novamente.', 'error', { details: error.message });
        }
        let activeTab = initialTab;
        let selectedSystemPreset = '';
        let closed = false;
        let openFrame;
        let providerTimer;
        let providerRequest;
        let isSaving = false;
        let prevFooterDirty = false;

        const backdrop = document.createElement('div');
        backdrop.className = 'pe-modal-backdrop pe-scope';

        const panel = document.createElement('div');
        panel.className = 'pe-panel pe-modal';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-label', 'Configurações');

        const header = document.createElement('div');
        header.className = 'pe-panel__header';
        const heading = document.createElement('div');
        heading.className = 'pe-modal-heading';
        const h4 = document.createElement('h4');
        h4.textContent = 'Configurações';
        const headingHint = document.createElement('p');
        headingHint.textContent = 'Personalize como o Prompt Enhancer trabalha.';
        heading.append(h4, headingHint);
        header.appendChild(heading);
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'pe-panel__close';
        closeBtn.setAttribute('aria-label', 'Fechar');
        closeBtn.appendChild(Atoms.icon('x'));
        closeBtn.addEventListener('click', close);
        header.appendChild(closeBtn);
        panel.appendChild(header);

        const tabsBar = document.createElement('div');
        tabsBar.className = 'pe-modal-tabs';
        tabsBar.setAttribute('role', 'tablist');
        tabsBar.setAttribute('aria-label', 'Abas de configurações');
        const tabDefs = [
            { key: 'params', label: 'Parâmetros', icon: 'sliders', title: 'Parâmetros de aprimoramento', description: 'Defina os limites e a intensidade usados nas respostas.' },
            { key: 'context', label: 'Contexto & Idioma', icon: 'folder', title: 'Contexto e idioma', description: 'Configure o contexto do projeto e o estilo das respostas.' },
            { key: 'systemPrompt', label: 'System prompt', icon: 'doc', title: 'System prompt', description: 'Edite as instruções e gerencie seus presets pessoais.' },
            { key: 'history', label: 'Histórico', icon: 'guide', title: 'Histórico de execuções', description: 'Revise resultados e detalhes das chamadas anteriores.' },
            { key: 'provider', label: 'Provedor', icon: 'gear', title: 'Provedor de API', description: 'Configure e teste o endpoint usado pelo script.' }
        ];
        if (!tabDefs.some(tab => tab.key === activeTab)) activeTab = 'params';
        const tabButtons = {};
        tabDefs.forEach(t => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'pe-modal-tab';
            b.id = `pe-settings-tab-${t.key}`;
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-controls', 'pe-settings-panel-body');
            b.setAttribute('aria-label', t.label);
            b.append(Atoms.icon(t.icon), Object.assign(document.createElement('span'), {
                className: 'pe-modal-tab__label',
                textContent: t.label
            }));
            b.addEventListener('click', () => { if (activeTab !== t.key) { activeTab = t.key; render(); } });
            tabsBar.appendChild(b);
            tabButtons[t.key] = b;
        });

        const bodyEl = document.createElement('div');
        bodyEl.className = 'pe-panel__body';
        bodyEl.id = 'pe-settings-panel-body';
        bodyEl.setAttribute('role', 'tabpanel');
        bodyEl.tabIndex = 0;

        const footerEl = document.createElement('div');
        footerEl.className = 'pe-panel__footer';
        const main = document.createElement('div');
        main.className = 'pe-modal-main';
        main.append(bodyEl);
        const layout = document.createElement('div');
        layout.className = 'pe-modal-layout';
        layout.append(tabsBar, main);
        panel.appendChild(layout);
        panel.appendChild(footerEl);

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
            if (errors.length) { showErrors(errors); isSaving = false; renderFooter(activeTab, computeDirty(activeTab), false); return; }
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
            try { GM_setValue('pe_params_configured', true); } catch (_) {}
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
            const existing = bodyEl.querySelector('.pe-settings-errors');
            if (existing) existing.remove();
            const box = document.createElement('div');
            box.className = 'pe-settings-errors';
            errors.forEach(err => {
                const el = document.createElement('div');
                el.className = 'pe-panel-error';
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

        function computeDirty(tab) {
            if (tab === 'params') return JSON.stringify(ParamSchema.clean(draft)) !== JSON.stringify(ParamSchema.clean(ParamSchema.load()));
            if (tab === 'systemPrompt') return JSON.stringify(systemPromptDraft) !== JSON.stringify(SystemPromptManager.load());
            if (tab === 'context') {
                const cleaned = ParamSchema.clean(draft);
                const saved = ParamSchema.clean(ParamSchema.load());
                return ['response_language', 'response_persona', 'response_persona_custom']
                    .some(k => (cleaned[k] ?? '') !== (saved[k] ?? ''));
            }
            return false;
        }
        function syncFooter(tab) {
            if (isSaving || tab !== activeTab) return;
            const dirty = computeDirty(tab);
            if (prevFooterDirty === dirty) return; // evita animação a cada tecla
            prevFooterDirty = dirty;
            renderFooter(tab, dirty, false);
        }
        function renderFooter(tab, dirty, saving) {
            isSaving = !!saving;
            prevFooterDirty = dirty;
            footerEl.innerHTML = '';
            footerEl.setAttribute('aria-live', 'polite');
            const editing = tab === 'params' || tab === 'context' || tab === 'systemPrompt';
            if (!editing || !dirty) {
                footerEl.appendChild(Atoms.button({ icon: 'x', label: 'Fechar', ariaLabel: 'Fechar', variant: 'outline', onClick: close }));
            } else {
                const cancelBtn = Atoms.button({ icon: 'x', label: 'Cancelar', ariaLabel: 'Cancelar', variant: 'outline', onClick: () => { close(); }, disabled: saving });
                const saveBtn = Atoms.button({ icon: 'check', label: saving ? 'Salvando' : 'Salvar', ariaLabel: 'Salvar', variant: 'primary', onClick: () => { renderFooter(tab, true, true); applyAndClose(); }, disabled: saving });
                if (saving) saveBtn.classList.add('is-loading');
                footerEl.appendChild(cancelBtn);
                footerEl.appendChild(saveBtn);
            }
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(footerEl, { opacity: 0.6 }, { opacity: 1, duration: 0.3, ease: 'power2.inOut' });
            }
        }

        function render() {
            prevFooterDirty = false;
            Object.entries(tabButtons).forEach(([k, b]) => {
                const selected = k === activeTab;
                b.classList.toggle('is-active', selected);
                b.setAttribute('aria-selected', String(selected));
                b.tabIndex = selected ? 0 : -1;
            });
            bodyEl.setAttribute('aria-labelledby', `pe-settings-tab-${activeTab}`);
            bodyEl.innerHTML = '';
            bodyEl.scrollTop = 0;
            bodyEl.style.overflowY = '';
            footerEl.innerHTML = '';
            const tab = tabDefs.find(item => item.key === activeTab);
            const intro = document.createElement('div');
            intro.className = 'pe-settings-intro';
            const icon = document.createElement('span');
            icon.className = 'pe-settings-intro__icon';
            icon.appendChild(Atoms.icon(tab.icon));
            const text = document.createElement('div');
            text.className = 'pe-settings-intro__text';
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
            renderFooter(activeTab, computeDirty(activeTab), false);
        }

        function renderParams() {
            const form = document.createElement('div');
            form.className = 'pe-param-body';
            const presetsRow = document.createElement('div');
            presetsRow.className = 'pe-param-presets';
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
                b.className = 'pe-param-preset';
                b.textContent = p.label;
                presetButtons.push({ button: b, preset: p });
                b.addEventListener('click', () => {
                    Object.assign(draft, p.values);
                    ParamSchema.SCHEMA.filter(f => f.type === 'number').forEach(f => {
                        const inp = form.querySelector(`#pe-param-${f.key}`);
                        if (inp) inp.value = draft[f.key] == null ? '' : String(draft[f.key]);
                    });
                    updatePresetSelection();
                    syncFooter('params');
                });
                presetsRow.appendChild(b);
            });
            updatePresetSelection();
            form.appendChild(presetsRow);

            ParamSchema.SCHEMA.filter(f => f.type === 'number').forEach(f => {
                const row = document.createElement('div');
                row.className = 'pe-param-row';
                const placeholder = f.key === 'seed' ? 'Aleatório' : (f.default == null ? '' : f.default);
                row.innerHTML = `<label class="pe-param-label" for="pe-param-${f.key}">${Utils.escapeHtml(f.label)}</label><div class="pe-param-control"><input type="number" id="pe-param-${f.key}" class="pe-param-input" min="${f.min}" max="${f.max}" step="${f.step}" value="${draft[f.key] == null ? '' : String(draft[f.key])}" placeholder="${placeholder}">${f.hint ? `<div class="pe-param-hint">${Utils.escapeHtml(f.hint)}</div>` : ''}</div>`;
                form.appendChild(row);
                row.querySelector('input').addEventListener('input', (e) => {
                    const v = e.target.value.trim();
                    draft[f.key] = v === '' ? null : Number(v);
                    updatePresetSelection();
                    syncFooter('params');
                });
            });

            bodyEl.appendChild(form);
            renderFooter('params', computeDirty('params'), false);
        }

        function renderProvider() {
            const form = document.createElement('div');
            form.className = 'pe-param-body pe-provider-settings';

            const heading = document.createElement('div');
            heading.className = 'pe-provider-section-heading';
            heading.innerHTML = '<h6>Escolha um modelo</h6><p>Selecione um provedor ou busque diretamente pelo modelo. Abra um modelo para ver detalhes e gerenciar o roteamento.</p>';
            form.appendChild(heading);

            // Painel de roteamento (Principal + Fallback)
            const routingPanel = document.createElement('div');
            routingPanel.className = 'pe-routing-panel';
            routingPanel.setAttribute('aria-label', 'Roteamento de provedores');

            const primaryStep = document.createElement('div');
            primaryStep.className = 'pe-routing-step';
            const primaryLabel = document.createElement('span');
            primaryLabel.className = 'pe-routing-label is-primary';
            primaryLabel.textContent = 'Principal';
            const primaryValue = document.createElement('span');
            primaryValue.className = 'pe-routing-value';
            primaryValue.id = 'pe-routing-primary';
            primaryStep.append(primaryLabel, primaryValue);

            const arrow = document.createElement('span');
            arrow.className = 'pe-routing-arrow';
            arrow.textContent = '→';
            arrow.setAttribute('aria-hidden', 'true');

            const fallbackStep = document.createElement('div');
            fallbackStep.className = 'pe-routing-step';
            const fallbackLabel = document.createElement('span');
            fallbackLabel.className = 'pe-routing-label is-fallback';
            fallbackLabel.textContent = 'Fallback';
            const fallbackValue = document.createElement('span');
            fallbackValue.className = 'pe-routing-value';
            fallbackValue.id = 'pe-routing-fallback';
            fallbackStep.append(fallbackLabel, fallbackValue);

            const clearBtn = Atoms.button({
                icon: 'trash',
                label: 'Limpar roteamento',
                ariaLabel: 'Limpar rota principal e fallback',
                variant: 'ghost',
                onClick: () => {
                    try {
                        if (typeof ProviderManager !== 'undefined') {
                            ProviderManager.unpin();
                            ProviderManager.setFallback('');
                            Molecules.toast('Roteamento limpo. O sistema usará a rota padrão.', 'success');
                            renderList();
                        }
                    } catch (err) {
                        console.warn('[PE] Falha ao limpar roteamento:', err);
                        Molecules.toast('Não foi possível limpar o roteamento.', 'error');
                    }
                }
            });
            clearBtn.className = 'pe-routing-clear';

            routingPanel.append(primaryStep, arrow, fallbackStep, clearBtn);
            form.appendChild(routingPanel);

            const loading = document.createElement('div');
            loading.className = 'pe-catalog-loading';
            loading.textContent = 'Atualizando catálogo…';
            loading.hidden = true;
            form.appendChild(loading);

            const filters = document.createElement('div');
            filters.className = 'pe-catalog-filters';
            const search = document.createElement('input');
            search.type = 'search';
            search.className = 'pe-param-input';
            search.placeholder = 'Buscar modelo…';
            search.setAttribute('aria-label', 'Buscar modelo');

            const keylessLabel = document.createElement('label');
            keylessLabel.className = 'pe-catalog-toggle';
            const keyless = document.createElement('input');
            keyless.type = 'checkbox';
            keylessLabel.append(keyless, document.createTextNode('Sem chave'));

            const streamLabel = document.createElement('label');
            streamLabel.className = 'pe-catalog-toggle';
            const streaming = document.createElement('input');
            streaming.type = 'checkbox';
            streamLabel.append(streaming, document.createTextNode('Streaming'));

            filters.append(search, keylessLabel, streamLabel);
            form.appendChild(filters);

            const accordion = document.createElement('div');
            accordion.className = 'pe-provider-accordion';
            accordion.setAttribute('aria-label', 'Modelos por provedor');
            form.appendChild(accordion);

            bodyEl.appendChild(form);

            let expandedModelId = null;

            function limitsLabel(entry) {
                const parts = [];
                if (entry.limits && entry.limits.rpm !== null && entry.limits.rpm !== undefined) parts.push(`${entry.limits.rpm} req/min`);
                if (entry.limits && entry.limits.rpd !== null && entry.limits.rpd !== undefined) parts.push(`${entry.limits.rpd} req/dia`);
                if (entry.limits && entry.limits.note) parts.push(entry.limits.note);
                return parts.join(' · ') || 'Não informados';
            }

            function authLabel(entry) {
                if (!entry.auth || entry.auth.type === 'none') return 'Sem autenticação';
                return entry.auth.key === 'anonymous' ? 'Bearer anonymous' : 'Bearer';
            }

            function isFreeBadge(entry) {
                return (entry.auth && (entry.auth.type === 'none' || entry.auth.key === 'anonymous'))
                    || /free|gratuit/i.test((entry.limits && entry.limits.note) || '');
            }

            function fallbackMatchesEntry(fallback, entry) {
                    if (!fallback || !entry) return false;
                    // fallback is a ProviderManager entry (id, name, url, model)
                    // entry is a ProviderRegistry entry (id, modelId, baseUrl)
                    if (fallback.id === entry.id) return true;
                    if (fallback.url && entry.baseUrl) {
                        const normUrl = (s) => String(s || '').replace(/\/+$/, '').replace(/\/chat\/completions\/?$/, '');
                        if (normUrl(fallback.url) === normUrl(entry.baseUrl) && fallback.model === entry.modelId) return true;
                    }
                    return false;
                }

                function renderDetails(entry, pinned, fallback) {
                    const details = document.createElement('dl');
                    details.className = 'pe-model-details';

                const addField = (label, value) => {
                    const dt = document.createElement('dt');
                    dt.textContent = label;
                    const dd = document.createElement('dd');
                    dd.textContent = value;
                    details.append(dt, dd);
                };

                addField('Provedor', entry.providerLabel || entry.providerId || 'Desconhecido');
                addField('Autenticação', authLabel(entry));
                addField('Limites', limitsLabel(entry));
                addField('Contexto', entry.modelId || 'Não informado');

                const actions = document.createElement('div');
                actions.className = 'pe-model-details__actions';

                const copyButton = Atoms.buttonNode({
                    label: 'Copiar JSON',
                    ariaLabel: `Copiar configuração JSON de ${entry.label}`,
                    variant: 'ghost'
                });
                copyButton.type = 'button';
                copyButton.addEventListener('click', async (event) => {
                    event.stopPropagation();
                    if (!navigator.clipboard?.writeText) {
                        Molecules.toast('A cópia para a área de transferência não está disponível.', 'error');
                        return;
                    }
                    const safeEntry = {
                        ...entry,
                        auth: entry.auth ? { type: entry.auth.type, headerName: entry.auth.headerName } : undefined,
                        headers: entry.headers ? Object.fromEntries(Object.entries(entry.headers).map(([name, value]) => [
                            name,
                            /authorization|api[-_]?key|token|secret/i.test(name) ? '[redigido]' : value
                        ])) : undefined
                    };
                    try {
                        await navigator.clipboard.writeText(JSON.stringify(safeEntry, null, 2));
                        Molecules.toast('Configuração copiada.', 'success');
                    } catch (err) {
                        console.warn('[PE] Falha ao copiar a configuração do modelo.', err);
                        Molecules.toast('Não foi possível copiar a configuração.', 'error');
                    }
                });

                const pinButton = Atoms.buttonNode({
                    label: pinned && pinned.id === entry.id ? 'Rota fixada' : 'Fixar esta rota',
                    ariaLabel: pinned && pinned.id === entry.id ? 'Esta rota já está fixada' : `Fixar ${entry.label}`,
                    variant: 'primary'
                });
                pinButton.type = 'button';
                pinButton.disabled = !!(pinned && pinned.id === entry.id);
                pinButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (pinned && pinned.id === entry.id) return;
                    if (entry.auth && entry.auth.type === 'bearer' && entry.auth.key === '') {
                        const apiKey = prompt(`Informe a chave de API para ${entry.providerLabel || 'este provedor'}:`);
                        if (apiKey === null) return;
                        if (!apiKey.trim()) {
                            Molecules.toast('A chave de API não pode ficar vazia.', 'error');
                            return;
                        }
                        try {
                            GM_setValue('pe_api_key', apiKey.trim());
                        } catch (err) {
                            Molecules.toast('Não foi possível salvar a chave de API.', 'error', { details: err && err.message });
                            return;
                        }
                    }
                    if (!ProviderManager.pin(entry.id)) {
                        Molecules.toast('Não foi possível fixar esta rota.', 'error');
                        return;
                    }
                    Molecules.toast(`Rota fixada: ${entry.label}`, 'success');
                    renderList();
                });

                const isFallback = fallbackMatchesEntry(fallback, entry);
                const isPinned = pinned && pinned.id === entry.id;
                const fallbackButton = Atoms.buttonNode({
                    label: isFallback ? 'Remover fallback' : 'Definir como fallback',
                    ariaLabel: isFallback ? `Remover ${entry.label} do fallback` : `Definir ${entry.label} como fallback`,
                    variant: isFallback ? 'ghost' : 'outline'
                });
                fallbackButton.type = 'button';
                fallbackButton.disabled = !!isPinned;
                if (isPinned) {
                    fallbackButton.title = 'Este modelo já é a rota principal; não pode ser fallback.';
                }
                fallbackButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (isPinned) return;
                    if (isFallback) {
                        try {
                            ProviderManager.setFallback('');
                            Molecules.toast(`Fallback removido: ${entry.label}`, 'success');
                            renderList();
                        } catch (err) {
                            console.warn('[PE] Falha ao remover fallback:', err);
                            Molecules.toast('Não foi possível remover o fallback.', 'error');
                        }
                        return;
                    }
                    // Definir como fallback
                    if (entry.auth && entry.auth.type === 'bearer' && entry.auth.key === '') {
                        const apiKey = prompt(`Informe a chave de API para ${entry.providerLabel || 'este provedor'}:`);
                        if (apiKey === null) return;
                        if (!apiKey.trim()) {
                            Molecules.toast('A chave de API não pode ficar vazia.', 'error');
                            return;
                        }
                        try {
                            GM_setValue('pe_api_key', apiKey.trim());
                        } catch (err) {
                            Molecules.toast('Não foi possível salvar a chave de API.', 'error', { details: err && err.message });
                            return;
                        }
                    }
                    // Criar provider no ProviderManager a partir do entry do catálogo
                    let ok = false;
                    let errMsg = '';
                    try {
                        if (typeof ProviderManager === 'undefined') {
                            errMsg = 'ProviderManager indisponível';
                        } else if (typeof ProviderManager.add !== 'function') {
                            errMsg = 'ProviderManager.add não é função';
                        } else {
                            const providerPayload = {
                                name: String(entry.providerLabel || entry.label || 'Fallback').trim().slice(0, 60),
                                url: String(entry.baseUrl || '').trim(),
                                model: String(entry.modelId || '').trim(),
                                apiKey: String(entry.auth?.key || (entry.auth?.type === 'none' ? '' : 'anonymous')).trim(),
                                headers: { ...(entry.headers || {}) }
                            };
                            if (!providerPayload.url || !providerPayload.model) {
                                errMsg = 'URL ou modelo vazio';
                            } else {
                                const newProvider = ProviderManager.add(providerPayload);
                                if (newProvider && newProvider.id) {
                                    ProviderManager.setFallback(newProvider.id);
                                    ok = true;
                                } else {
                                    errMsg = 'add retornou: ' + JSON.stringify(newProvider);
                                }
                            }
                        }
                    } catch (err) {
                        console.warn('[PE] Falha ao definir fallback:', err);
                        errMsg = err && err.message ? err.message : String(err);
                    }
                    if (ok) {
                        Molecules.toast(`Fallback definido: ${entry.label}`, 'success');
                        renderList();
                    } else {
                        console.error('[PE] Detalhes falha fallback:', errMsg);
                        Molecules.toast('Não foi possível definir este modelo como fallback.' + (errMsg ? ' (' + errMsg + ')' : ''), 'error');
                    }
                });

                actions.append(copyButton, pinButton, fallbackButton);
                details.appendChild(actions);
                return details;
            }

            function renderList() {
                const query = search.value.trim();
                const pinned = ProviderManager.getPinned ? ProviderManager.getPinned() : null;
                const fallback = ProviderManager.getFallback ? ProviderManager.getFallback() : null;
                const activeProvider = ProviderManager.getActive ? ProviderManager.getActive() : null;
                const groups = ProviderRegistry.groupByProvider(ProviderRegistry.list({
                    keylessOnly: keyless.checked,
                    streamingOnly: streaming.checked,
                    search: query
                }));
                const entries = groups.flatMap((group) => group.entries || []);
                if (expandedModelId && !entries.some((entry) => entry.id === expandedModelId)) {
                    expandedModelId = null;
                }
                accordion.replaceChildren();

                // Atualizar painel de roteamento
                const primaryEl = form.querySelector('#pe-routing-primary');
                const fallbackEl = form.querySelector('#pe-routing-fallback');
                if (primaryEl) {
                    if (pinned) {
                        primaryEl.textContent = `${pinned.label} (${pinned.modelId || pinned.id})`;
                    } else if (activeProvider) {
                        primaryEl.textContent = `${activeProvider.name || 'Kilo'} (${activeProvider.model || 'padrão'})`;
                    } else {
                        primaryEl.textContent = 'Padrão do sistema';
                    }
                }
                if (fallbackEl) {
                    if (fallback) {
                        fallbackEl.textContent = `${fallback.name || 'Fallback'} (${fallback.model || ''})`.trim();
                    } else {
                        fallbackEl.textContent = 'Nenhum';
                    }
                }

                if (!groups.length) {
                    const empty = document.createElement('div');
                    empty.className = 'pe-provider-empty';
                    empty.setAttribute('role', 'status');
                    const message = document.createElement('p');
                    message.textContent = query
                        ? `Nenhum modelo corresponde à busca “${query}”.`
                        : 'Nenhum modelo encontrado com os filtros atuais.';
                    const clear = Atoms.buttonNode({ label: 'Limpar filtros', variant: 'ghost' });
                    clear.type = 'button';
                    clear.setAttribute('aria-label', 'Limpar busca e filtros');
                    clear.addEventListener('click', () => {
                        search.value = '';
                        keyless.checked = false;
                        streaming.checked = false;
                        expandedModelId = null;
                        renderList();
                        search.focus({ preventScroll: true });
                    });
                    empty.append(message, clear);
                    accordion.appendChild(empty);
                    return;
                }

                groups.forEach((group) => {
                    const title = document.createElement('h6');
                    title.className = 'pe-provider-group-title';
                    title.textContent = group.providerLabel || group.providerId || 'Provedor';
                    accordion.appendChild(title);

                    (group.entries || []).forEach((entry) => {
                        const isActive = expandedModelId === entry.id;
                        const card = document.createElement('div');
                        card.className = 'pe-model-card';
                        if (isActive) card.classList.add('is-active');

                        const header = document.createElement('div');
                        header.className = 'pe-model-header';
                        header.setAttribute('role', 'button');
                        header.tabIndex = 0;
                        header.setAttribute('aria-expanded', String(isActive));
                        header.setAttribute('aria-label', `${entry.label}, ${group.providerLabel || 'provedor'}. ${isActive ? 'Recolher detalhes' : 'Expandir detalhes'}.`);

                        const info = document.createElement('div');
                        info.className = 'pe-model-info';
                        const name = document.createElement('span');
                        name.className = 'pe-model-info__name';
                        name.textContent = entry.label;
                        const id = document.createElement('span');
                        id.className = 'pe-model-info__id';
                        id.textContent = entry.modelId || entry.id;
                        info.append(name, id);

                        const meta = document.createElement('div');
                        meta.className = 'pe-model-header__meta';
                        const badges = document.createElement('div');
                        badges.className = 'pe-model-badges';
                        const addBadge = (text, opts = {}) => {
                            const badge = document.createElement('span');
                            badge.className = 'pe-model-badge';
                            if (opts.isPrimary) badge.classList.add('is-primary');
                            if (opts.isFallback) badge.classList.add('is-fallback');
                            badge.textContent = text;
                            badges.appendChild(badge);
                        };
                        if (isFreeBadge(entry)) addBadge('grátis');
                        if (entry.capabilities && entry.capabilities.streaming) addBadge('streaming');
                        if (pinned && pinned.id === entry.id) addBadge('Principal', { isPrimary: true });
                        if (fallback && fallbackMatchesEntry(fallback, entry)) addBadge('Fallback', { isFallback: true });
                        const chevron = document.createElement('span');
                        chevron.className = 'pe-chevron';
                        chevron.setAttribute('aria-hidden', 'true');
                        chevron.textContent = '▾';
                        meta.append(badges, chevron);

                        header.append(info, meta);

                        const expand = document.createElement('div');
                        expand.className = 'pe-model-expand';
                        const clip = document.createElement('div');
                        clip.className = 'pe-model-expand__clip';
                        if (isActive) clip.appendChild(renderDetails(entry, pinned, fallback));
                        expand.appendChild(clip);

                        const regionId = Utils.uid('pe-model-region');
                        header.setAttribute('aria-controls', regionId);
                        expand.id = regionId;

                        const toggle = () => {
                            expandedModelId = expandedModelId === entry.id ? null : entry.id;
                            renderList();
                        };
                        header.addEventListener('click', toggle);
                        header.addEventListener('keydown', (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                toggle();
                            }
                        });

                        card.append(header, expand);
                        accordion.appendChild(card);
                    });
                });
            }

            [keyless, streaming].forEach((control) => control.addEventListener('change', () => {
                expandedModelId = null;
                renderList();
            }));
            search.addEventListener('input', () => {
                expandedModelId = null;
                renderList();
            });

            loading.hidden = false;
            renderList();
            ProviderRegistry.hydrate().then(() => {
                loading.hidden = true;
                renderList();
            }).catch((err) => {
                console.warn('[PE] Falha ao atualizar catálogo na aba Provedor.', err);
                loading.hidden = false;
                loading.textContent = 'Não foi possível atualizar o catálogo; exibindo entradas disponíveis.';
                renderList();
            });

            const closeBtn = Atoms.button({ icon: 'x', label: 'Fechar', ariaLabel: 'Fechar janela de configurações', variant: 'primary', onClick: close });
            footerEl.appendChild(closeBtn);
        }
        function renderContext() {
            const form = document.createElement('div');
            form.className = 'pe-param-body';

            const infoBox = document.createElement('div');
            infoBox.className = 'pe-context-info';
            const activeFiles = ProjectContext.list().filter(f => f.enabled);
            infoBox.innerHTML = `<div class="pe-context-info__title">Contexto do projeto</div><div class="pe-context-info__text">${activeFiles.length} arquivo(s) ativo(s) · ${Utils.formatBytes(ProjectContext.getTotalSize())} · ${ProjectContext.isEnabled() ? 'injeção ON' : 'injeção OFF'}</div><div class="pe-context-info__hint">Anexado automaticamente ao final do system prompt (quando ativado).</div>`;
            const manageBtn = document.createElement('button');
            manageBtn.type = 'button';
            manageBtn.className = 'pe-context-manage';
            manageBtn.textContent = 'Gerenciar arquivos';
            manageBtn.addEventListener('click', () => { close(); setTimeout(() => State.activeComposer?.actionbar?.contextBtn?.click(), 250); });
            infoBox.appendChild(manageBtn);
            form.appendChild(infoBox);

            ['response_language', 'response_persona'].forEach(key => {
                const f = ParamSchema.SCHEMA.find(x => x.key === key);
                const row = document.createElement('div');
                row.className = 'pe-param-row';
                const opts = f.options.map(o => `<option value="${o.value}" ${draft[key] === o.value ? 'selected' : ''}>${Utils.escapeHtml(o.label)}</option>`).join('');
                row.innerHTML = `<label class="pe-param-label" for="pe-param-${key}">${Utils.escapeHtml(f.label)}</label><div class="pe-param-control"><select id="pe-param-${key}" class="pe-param-input">${opts}</select><div class="pe-param-hint">${Utils.escapeHtml(f.hint)}</div></div>`;
                form.appendChild(row);
                row.querySelector('select').addEventListener('change', (e) => {
                    draft[key] = e.target.value;
                    if (key === 'response_persona') updateCustomToneVisibility();
                    syncFooter('context');
                });
            });

            const customTone = ParamSchema.SCHEMA.find(f => f.key === 'response_persona_custom');
            const customToneRow = document.createElement('div');
            customToneRow.className = 'pe-param-row';
            customToneRow.innerHTML = `<label class="pe-param-label" for="pe-param-${customTone.key}">${Utils.escapeHtml(customTone.label)}</label><div class="pe-param-control"><input type="text" id="pe-param-${customTone.key}" class="pe-param-input" maxlength="${customTone.maxLength}" value="${Utils.escapeHtml(draft[customTone.key] || '')}" placeholder="Ex: sarcástico, mas didático"><div class="pe-param-hint">${Utils.escapeHtml(customTone.hint)}</div></div>`;
            form.appendChild(customToneRow);
            customToneRow.querySelector('input').addEventListener('input', (e) => { draft[customTone.key] = e.target.value; syncFooter('context'); });
            function updateCustomToneVisibility() {
                customToneRow.style.display = draft.response_persona === 'auto' ? 'none' : '';
            }
            updateCustomToneVisibility();

            bodyEl.appendChild(form);
            renderFooter('context', computeDirty('context'), false);
        }

        function renderSystemPrompt() {
            const form = document.createElement('div');
            form.className = 'pe-param-body pe-system-prompt';

            const intro = document.createElement('div');
            intro.className = 'pe-system-prompt__intro';
            const title = document.createElement('h5');
            title.className = 'pe-system-prompt__title';
            title.textContent = 'Instruções de aprimoramento';
            const description = document.createElement('p');
            description.className = 'pe-system-prompt__description';
            description.textContent = 'Complementa o aprimoramento direto e o fluxo guiado. Contexto do projeto, idioma e personalidade são configurados separadamente.';
            intro.append(title, description);
            form.appendChild(intro);

            const editorCard = document.createElement('section');
            editorCard.className = 'pe-system-prompt__card pe-system-prompt__editor-card';
            editorCard.setAttribute('aria-labelledby', 'pe-system-prompt-heading');
            const editorHeading = document.createElement('div');
            editorHeading.className = 'pe-system-prompt__section-heading';
            const editorTitle = document.createElement('h6');
            editorTitle.id = 'pe-system-prompt-heading';
            editorTitle.textContent = 'Prompt ativo';
            const editorHint = document.createElement('p');
            editorHint.textContent = 'Edite as instruções usadas pelo script.';
            editorHeading.append(editorTitle, editorHint);

            const editorLabel = document.createElement('label');
            editorLabel.className = 'pe-system-prompt__label';
            editorLabel.htmlFor = 'pe-system-prompt-editor';
            editorLabel.textContent = 'Conteúdo do system prompt';
            const editor = document.createElement('textarea');
            editor.id = 'pe-system-prompt-editor';
            editor.className = 'pe-textarea pe-system-prompt__textarea';
            editor.rows = 12;
            editor.maxLength = SystemPromptManager.MAX_LENGTH;
            editor.value = systemPromptDraft.prompt;
            editor.setAttribute('aria-describedby', 'pe-system-prompt-feedback pe-system-prompt-count');
            const count = document.createElement('div');
            count.id = 'pe-system-prompt-count';
            count.className = 'pe-system-prompt__count';
            const feedback = document.createElement('div');
            feedback.id = 'pe-system-prompt-feedback';
            feedback.className = 'pe-system-prompt__feedback';
            feedback.setAttribute('role', 'status');
            feedback.setAttribute('aria-live', 'polite');
            const updateValidation = () => {
                const result = SystemPromptManager.validatePrompt(systemPromptDraft.prompt);
                count.textContent = `${result.charCount.toLocaleString('pt-BR')} / ${SystemPromptManager.MAX_LENGTH.toLocaleString('pt-BR')} caracteres`;
                const state = result.errors.length ? 'error' : (result.warnings.length ? 'warning' : 'valid');
                feedback.className = `pe-system-prompt__feedback is-${state}`;
                editor.setAttribute('aria-invalid', String(result.errors.length > 0));
                feedback.textContent = result.errors.length
                    ? result.errors.join(' ')
                    : (result.warnings.length ? result.warnings.join(' ') : 'Prompt válido.');
            };
            editor.addEventListener('input', () => {
                systemPromptDraft.prompt = editor.value;
                updateValidation();
                syncFooter('systemPrompt');
            });
            const editorMeta = document.createElement('div');
            editorMeta.className = 'pe-system-prompt__meta';
            editorMeta.append(count, feedback);
            const editorControls = document.createElement('div');
            editorControls.className = 'pe-system-prompt__editor-controls';

            const resetBtn = Atoms.button({
                icon: 'undo', label: 'Redefinir para o padrão', ariaLabel: 'Redefinir para o system prompt padrão',
                variant: 'outline', onClick: () => {
                    systemPromptDraft.prompt = CONFIG.SYSTEM_PROMPT;
                    editor.value = systemPromptDraft.prompt;
                    updateValidation();
                    syncFooter('systemPrompt');
                    Molecules.toast('Prompt padrão restaurado no editor. Salve para aplicar.', 'info');
                }
            });
            editorControls.appendChild(resetBtn);
            editorCard.append(editorHeading, editorLabel, editor, editorMeta, editorControls);
            form.appendChild(editorCard);

            const presetCard = document.createElement('section');
            presetCard.className = 'pe-system-prompt__card pe-system-prompt__presets';
            presetCard.setAttribute('aria-labelledby', 'pe-system-presets-heading');
            const presetHeading = document.createElement('div');
            presetHeading.className = 'pe-system-prompt__section-heading';
            const presetTitle = document.createElement('h6');
            presetTitle.id = 'pe-system-presets-heading';
            presetTitle.textContent = 'Presets pessoais';
            const presetHint = document.createElement('p');
            presetHint.textContent = `Guarde até ${SystemPromptManager.MAX_PRESETS} versões para reutilizar. As alterações são persistidas ao salvar as configurações.`;
            presetHeading.append(presetTitle, presetHint);

            const presetSelectLabel = document.createElement('label');
            presetSelectLabel.className = 'pe-system-prompt__label';
            presetSelectLabel.htmlFor = 'pe-system-preset-select';
            presetSelectLabel.textContent = 'Preset salvo';
            const presetSelect = document.createElement('select');
            presetSelect.id = 'pe-system-preset-select';
            presetSelect.className = 'pe-param-input pe-system-prompt__select';
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
            presetNameLabel.className = 'pe-system-prompt__label';
            presetNameLabel.htmlFor = 'pe-system-preset-name';
            presetNameLabel.textContent = 'Nome do preset';
            const presetName = document.createElement('input');
            presetName.id = 'pe-system-preset-name';
            presetName.className = 'pe-param-input pe-system-prompt__name';
            presetName.type = 'text';
            presetName.maxLength = SystemPromptManager.MAX_PRESET_NAME;
            presetName.autocomplete = 'off';
            presetName.placeholder = 'Ex.: Revisão de código';
            presetName.setAttribute('aria-describedby', 'pe-system-preset-name-hint');
            presetName.value = presetSelect.value;
            const presetNameHint = document.createElement('div');
            presetNameHint.id = 'pe-system-preset-name-hint';
            presetNameHint.className = 'pe-system-prompt__helper';
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
            presetFields.className = 'pe-system-prompt__preset-fields';
            const selectField = document.createElement('div');
            selectField.className = 'pe-system-prompt__field';
            selectField.append(presetSelectLabel, presetSelect);
            const nameField = document.createElement('div');
            nameField.className = 'pe-system-prompt__field';
            nameField.append(presetNameLabel, presetName, presetNameHint);
            presetFields.append(selectField, nameField);

            const presetActions = document.createElement('div');
            presetActions.className = 'pe-system-prompt__preset-actions';
            const loadPresetBtn = Atoms.button({ icon: 'check', label: 'Carregar', ariaLabel: 'Carregar preset selecionado', variant: 'outline', onClick: () => {
                const selected = systemPromptDraft.presets.find(p => p.name === presetSelect.value);
                if (!selected) { Molecules.toast('Selecione um preset para carregar.', 'error'); return; }
                systemPromptDraft.prompt = selected.prompt;
                editor.value = selected.prompt;
                updateValidation();
                syncFooter('systemPrompt');
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
            defaultDetails.className = 'pe-system-prompt__default';
            const defaultSummary = document.createElement('summary');
            defaultSummary.textContent = 'Ver prompt padrão original';
            const defaultDescription = document.createElement('p');
            defaultDescription.className = 'pe-system-prompt__helper';
            defaultDescription.textContent = 'Referência somente leitura; redefinir copia este conteúdo para o editor.';
            const defaultEditor = document.createElement('textarea');
            defaultEditor.id = 'pe-system-prompt-default';
            defaultEditor.className = 'pe-textarea pe-system-prompt__default-textarea';
            defaultEditor.rows = 6;
            defaultEditor.readOnly = true;
            defaultEditor.setAttribute('aria-label', 'System prompt padrão original do script, somente leitura');
            defaultEditor.value = CONFIG.SYSTEM_PROMPT;
            defaultDetails.append(defaultSummary, defaultDescription, defaultEditor);
            form.appendChild(defaultDetails);

            bodyEl.appendChild(form);
            updateValidation();
            renderFooter('systemPrompt', computeDirty('systemPrompt'), false);
        }

        function renderHistory() {
            const runs = EnhancementHistory.listRuns();
            if (!runs.length) {
                const empty = document.createElement('div');
                empty.className = 'pe-history-empty';
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
            const deleteRun = (runId, runCard) => {
                if (!runId) return;
                if (!confirm('Excluir esta execução do histórico? Esta ação não pode ser desfeita.')) return;
                try {
                    const raw = GM_getValue('pe_runs', '[]');
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    const list = Array.isArray(parsed) ? parsed : [];
                    const filtered = list.filter(r => r && r.id !== runId);
                    GM_setValue('pe_runs', JSON.stringify(filtered));
                    Molecules.toast('Execução removida do histórico.', 'success');
                    runCard?.remove();
                    render();
                    setTimeout(() => {
                        const closeBtn = footerEl.querySelector('.pe-btn');
                        if (closeBtn) closeBtn.focus();
                    }, 0);
                } catch (error) {
                    console.error('[PE] Falha ao excluir execução do histórico:', error);
                    Molecules.toast('Não foi possível excluir a execução.', 'error', { details: error.message });
                }
            };
            runs.forEach((run) => {
                const card = document.createElement('div');
                card.className = 'pe-history-item';

                const heading = document.createElement('div');
                heading.className = 'pe-history-item__heading';
                const header = document.createElement('button');
                header.type = 'button';
                header.className = 'pe-history-item__header';
                header.setAttribute('aria-expanded', 'false');

                const statusIcon = statusIconMap[run.status] || '○';
                const statusClass = run.status === 'success' ? 'is-success' : run.status === 'error' ? 'is-error' : run.status === 'aborted' ? 'is-aborted' : '';
                const typeBadge = run.type === 'guided' ? 'Guiado' : 'Aprimorar';
                const preview = Utils.truncate(run.input || '', 100);
                const time = new Date(run.startedAt).toLocaleString('pt-BR');
                const dur = run.durationMs >= 1000 ? `${(run.durationMs / 1000).toFixed(2)}s` : `${run.durationMs}ms`;
                const callsCount = (run.calls && run.calls.length) || 0;
                const outcomeLabel = outcomeLabels[run.outcome] || run.outcome || '—';
                const outcomeClass = `pe-outcome-${run.outcome || 'pending'}`;
                const legacyBadge = run.meta && run.meta.legacy ? '<span class="pe-history-legacy-badge">legado</span>' : '';

                header.innerHTML = `
                    <span class="pe-history-item__status ${statusClass}">${statusIcon}</span>
                    <span class="pe-history-item__main">
                        <span class="pe-history-item__preview">
                            <span class="pe-history-badge">${Utils.escapeHtml(typeBadge)}</span>${legacyBadge}
                            ${Utils.escapeHtml(preview)}
                        </span>
                        <span class="pe-history-item__meta">
                            <span>${Utils.escapeHtml(time)}</span>
                            <span>· ${dur}</span>
                            <span>· ${callsCount} chamada(s)</span>
                            <span class="pe-history-outcome ${outcomeClass}">${Utils.escapeHtml(outcomeLabel)}</span>
                        </span>
                    </span>
                    <span class="pe-history-item__chevron">${Atoms.icon('chevronD').outerHTML}</span>
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
                            console.error('[PE] Falha ao copiar execução do histórico:', error);
                            Molecules.toast('Não foi possível copiar o JSON desta execução.', 'error', { details: error.message });
                        }
                    }
                });
                copyBtn.classList.add('pe-history-item__copy');
                copyBtn.prepend(Atoms.icon('copy'));
                heading.appendChild(copyBtn);
                card.appendChild(heading);

                const details = document.createElement('div');
                details.className = 'pe-history-item__details';

                const addSection = (label, content, opts = {}) => {
                    const sec = document.createElement('div');
                    sec.className = 'pe-history-section';
                    const lbl = document.createElement('div');
                    lbl.className = 'pe-history-section__label';
                    lbl.textContent = label;
                    sec.appendChild(lbl);
                    if (opts.isKV) {
                        const kv = document.createElement('div');
                        kv.className = 'pe-history-kv';
                        kv.textContent = content;
                        sec.appendChild(kv);
                    } else {
                        const pre = document.createElement('pre');
                        pre.className = 'pe-history-pre' + (opts.isError ? ' is-error' : '');
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

                const deleteSection = document.createElement('div');
                deleteSection.className = 'pe-history-section';
                deleteSection.style.display = 'flex';
                deleteSection.style.justifyContent = 'flex-end';
                const deleteBtn = Atoms.button({
                    icon: 'trash',
                    label: 'Excluir execução',
                    ariaLabel: `Excluir execução de ${typeBadge.toLowerCase()} de ${time} do histórico`,
                    variant: 'outline',
                    onClick: () => deleteRun(run.id, card)
                });
                deleteSection.appendChild(deleteBtn);
                details.appendChild(deleteSection);

                if (run.calls && run.calls.length) {
                    const callsLabel = document.createElement('div');
                    callsLabel.className = 'pe-history-section__label';
                    callsLabel.textContent = `Chamadas à API (${run.calls.length})`;
                    details.appendChild(callsLabel);

                    run.calls.forEach((call) => {
                        const callEl = document.createElement('div');
                        callEl.className = 'pe-history-call';
                        const callHeader = document.createElement('button');
                        callHeader.type = 'button';
                        callHeader.className = 'pe-history-call__header';
                        callHeader.setAttribute('aria-expanded', 'false');

                        const callStatus = call.error ? 'is-error' : 'is-success';
                        const callStatusIcon = call.error ? '✗' : '✓';
                        const callDur = call.durationMs >= 1000 ? `${(call.durationMs / 1000).toFixed(2)}s` : `${call.durationMs}ms`;
                        const kindLabel = call.kind === 'questions' ? 'Perguntas' : call.kind === 'enhance-with-answers' ? 'Aprimorar c/ respostas' : 'Principal';
                        const retryTag = call.retryOf ? ' · retry' : '';
                        const streamTag = call.streamUsed ? ' · stream' : '';
                        const fbTag = call.fallbackUsed ? ' · fallback' : '';

                        callHeader.innerHTML = `
                            <span class="pe-history-call__status ${callStatus}">${callStatusIcon}</span>
                            <span class="pe-history-call__main">
                                <span class="pe-history-call__title">${Utils.escapeHtml(kindLabel)} · tentativa ${call.attempt}${retryTag}</span>
                                <span class="pe-history-call__meta">${callDur}${streamTag}${fbTag}</span>
                            </span>
                            <span class="pe-history-call__chevron">${Atoms.icon('chevronD').outerHTML}</span>
                        `;
                        callHeader.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const isExp = callEl.classList.toggle('is-expanded');
                            callHeader.setAttribute('aria-expanded', String(isExp));
                        });
                        callEl.appendChild(callHeader);

                        const callDetails = document.createElement('div');
                        callDetails.className = 'pe-history-call__details';

                        const addCallSection = (label, content, opts = {}) => {
                            const sec = document.createElement('div');
                            sec.className = 'pe-history-section';
                            const lbl = document.createElement('div');
                            lbl.className = 'pe-history-section__label';
                            lbl.textContent = label;
                            sec.appendChild(lbl);
                            if (opts.isKV) {
                                const kv = document.createElement('div');
                                kv.className = 'pe-history-kv';
                                kv.textContent = content;
                                sec.appendChild(kv);
                            } else {
                                const pre = document.createElement('pre');
                                pre.className = 'pe-history-pre' + (opts.isError ? ' is-error' : '');
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
