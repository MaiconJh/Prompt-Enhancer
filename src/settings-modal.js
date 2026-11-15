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
            Molecules.toast(I18n.t('sm.sp.toast.loadFail'), 'error', { details: error.message });
        }
        let activeTab = initialTab === 'context' ? 'manualContext' : initialTab;
        let selectedSystemPreset = '';
        let closed = false;
        let openFrame;
        let providerTimer;
        let providerRequest;
        let isSaving = false;
        let prevFooterDirty = false;
        let i18nRefresh = null;

        const backdrop = document.createElement('div');
        backdrop.className = 'pe-modal-backdrop pe-scope';

        const panel = document.createElement('div');
        panel.className = 'pe-panel pe-modal';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-label', I18n.t('sm.title'));

        const header = document.createElement('div');
        header.className = 'pe-panel__header';
        const heading = document.createElement('div');
        heading.className = 'pe-modal-heading';
        const h4 = document.createElement('h4');
        h4.textContent = I18n.t('sm.title');
        const headingHint = document.createElement('p');
        headingHint.textContent = I18n.t('sm.hint');
        heading.append(h4, headingHint);
        header.appendChild(heading);
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'pe-panel__close';
        closeBtn.setAttribute('aria-label', I18n.t('sm.footer.closeAria'));
        closeBtn.appendChild(Atoms.icon('x'));
        closeBtn.addEventListener('click', close);
        header.appendChild(closeBtn);
        panel.appendChild(header);

        const tabsBar = document.createElement('div');
        tabsBar.className = 'pe-modal-tabs';
        tabsBar.setAttribute('data-section-label', I18n.t('sm.tabs.section'));
        tabsBar.setAttribute('role', 'tablist');
        tabsBar.setAttribute('aria-label', I18n.t('sm.tabs.aria'));
        const getTabDefs = () => [
            { key: 'params', label: I18n.t('sm.tab.params.label'), icon: 'sliders', title: I18n.t('sm.tab.params.title'), description: I18n.t('sm.tab.params.desc') },
            { key: 'workspace', label: I18n.t('sm.tab.workspace.label'), icon: 'folder', title: I18n.t('sm.tab.workspace.title'), description: I18n.t('sm.tab.workspace.desc') },
            { key: 'manualContext', label: I18n.t('sm.tab.manualContext.label'), icon: 'doc', title: I18n.t('sm.tab.manualContext.title'), description: I18n.t('sm.tab.manualContext.desc') },
            { key: 'response', label: I18n.t('sm.tab.response.label'), icon: 'sparkles', title: I18n.t('sm.tab.response.title'), description: I18n.t('sm.tab.response.desc') },
            { key: 'interface', label: I18n.t('sm.tab.interface.label'), icon: 'gear', title: I18n.t('sm.tab.interface.title'), description: I18n.t('sm.tab.interface.desc') },
            { key: 'systemPrompt', label: I18n.t('sm.tab.systemPrompt.label'), icon: 'doc', title: I18n.t('sm.tab.systemPrompt.title'), description: I18n.t('sm.tab.systemPrompt.desc') },
            { key: 'history', label: I18n.t('sm.tab.history.label'), icon: 'guide', title: I18n.t('sm.tab.history.title'), description: I18n.t('sm.tab.history.desc') },
            { key: 'provider', label: I18n.t('sm.tab.provider.label'), icon: 'gear', title: I18n.t('sm.tab.provider.title'), description: I18n.t('sm.tab.provider.desc') }
        ];
        const tabDefs = getTabDefs();
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
            b.title = t.label;
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
                const keys = getTabDefs().map(tab => tab.key);
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
            if (i18nRefresh) { window.removeEventListener('pe:i18n-changed', i18nRefresh); i18nRefresh = null; }
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
                Molecules.toast(I18n.t('sm.sp.toast.spSaveFail'), 'error', { details: error.message });
                return;
            }
            ParamSchema.save(cleaned);
            State.params = cleaned;
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
            Molecules.toast(I18n.t('sm.saved'), 'success');
            try { onSave?.(cleaned); } catch (_) {}
            close();
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
            if (tab === 'response') {
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
            const editing = tab === 'params' || tab === 'response' || tab === 'systemPrompt';
            footerEl.hidden = !editing || !dirty;
            if (editing && dirty) {
                const cancelBtn = Atoms.button({ icon: 'x', label: I18n.t('sm.footer.cancel'), ariaLabel: I18n.t('sm.footer.cancelAria'), variant: 'outline', onClick: () => { close(); }, disabled: saving });
                const saveBtn = Atoms.button({ icon: 'check', label: saving ? I18n.t('sm.footer.saving') : I18n.t('sm.footer.save'), ariaLabel: I18n.t('sm.footer.saveAria'), variant: 'primary', onClick: () => { renderFooter(tab, true, true); applyAndClose(); }, disabled: saving });
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
            panel.classList.toggle('is-workspace-expanded', activeTab === 'workspace');
            Object.entries(tabButtons).forEach(([k, b]) => {
                const selected = k === activeTab;
                b.classList.toggle('is-active', selected);
                b.setAttribute('aria-selected', String(selected));
                b.title = getTabDefs().find(tab => tab.key === k)?.label || '';
                b.tabIndex = selected ? 0 : -1;
            });
            bodyEl.setAttribute('aria-labelledby', `pe-settings-tab-${activeTab}`);
            bodyEl.innerHTML = '';
            bodyEl.scrollTop = 0;
            bodyEl.style.overflowY = '';
            footerEl.innerHTML = '';
            const tab = getTabDefs().find(item => item.key === activeTab);
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
            else if (activeTab === 'workspace') renderWorkspace();
            else if (activeTab === 'manualContext') renderManualContext();
            else if (activeTab === 'response') renderResponse();
            else if (activeTab === 'interface') renderInterface();
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
            presetsRow.setAttribute('aria-label', I18n.t('sm.params.presetsAria'));
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
                const placeholder = f.key === 'seed' ? I18n.t('param.seed.placeholder') : (f.default == null ? '' : f.default);
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

    // ── Heading ──────────────────────────────────────────────────────
    const heading = document.createElement('div');
    heading.className = 'pe-provider-section-heading';
    heading.innerHTML = `<h6>${Utils.escapeHtml(I18n.t('sm.provider.heading'))}</h6><p>${Utils.escapeHtml(I18n.t('sm.provider.headingDesc'))}</p>`;
    form.appendChild(heading);

    // ── Painel de roteamento (preservado) ────────────────────────────
    const routingPanel = document.createElement('div');
    routingPanel.className = 'pe-routing-panel';
    routingPanel.setAttribute('aria-label', I18n.t('sm.provider.routingAria'));

    const primaryStep = document.createElement('div');
    primaryStep.className = 'pe-routing-step';
    const primaryLabel = document.createElement('span');
    primaryLabel.className = 'pe-routing-label is-primary';
    primaryLabel.textContent = I18n.t('sm.provider.primary');
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
    fallbackLabel.textContent = I18n.t('sm.provider.fallback');
    const fallbackValue = document.createElement('span');
    fallbackValue.className = 'pe-routing-value';
    fallbackValue.id = 'pe-routing-fallback';
    fallbackStep.append(fallbackLabel, fallbackValue);

    const clearBtn = Atoms.button({
        icon: 'trash',
        label: I18n.t('sm.provider.clearRouting'),
        ariaLabel: I18n.t('sm.provider.clearRoutingAria'),
        variant: 'ghost',
        onClick: () => {
            try {
                if (typeof ProviderManager !== 'undefined') {
                    ProviderManager.unpin();
                    ProviderManager.setFallback('');
                    Molecules.toast(I18n.t('sm.provider.clearRoutingOk'), 'success');
                    updateRoutingPanel();
                    rebuildVisible();
                }
            } catch (err) {
                console.warn('[PE] Falha ao limpar roteamento:', err);
                Molecules.toast(I18n.t('sm.provider.clearRoutingFail'), 'error');
            }
        }
    });
    clearBtn.className = 'pe-routing-clear';

    routingPanel.append(primaryStep, arrow, fallbackStep, clearBtn);
    form.appendChild(routingPanel);

    // ── Estado de hidratação ─────────────────────────────────────────
    const loading = document.createElement('div');
    loading.className = 'pe-catalog-loading';
    loading.textContent = I18n.t('sm.provider.updating');
    loading.hidden = true;
    form.appendChild(loading);

    // ── Filtros (preservados) ────────────────────────────────────────
    const filters = document.createElement('div');
    filters.className = 'pe-catalog-filters';
    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'pe-param-input';
    search.placeholder = I18n.t('sm.provider.searchPlaceholder');
    search.setAttribute('aria-label', I18n.t('sm.provider.searchAria'));

    const keylessLabel = document.createElement('label');
    keylessLabel.className = 'pe-catalog-toggle';
    const keyless = document.createElement('input');
    keyless.type = 'checkbox';
    keylessLabel.append(keyless, document.createTextNode(I18n.t('sm.provider.noKey')));

    const streamLabel = document.createElement('label');
    streamLabel.className = 'pe-catalog-toggle';
    const streaming = document.createElement('input');
    streaming.type = 'checkbox';
    streamLabel.append(streaming, document.createTextNode(I18n.t('sm.provider.streaming')));

    filters.append(search, keylessLabel, streamLabel);
    form.appendChild(filters);

    // ── Viewport virtualizado ────────────────────────────────────────
    const scroller = document.createElement('div');
    scroller.className = 'pe-virtual-list';
    scroller.setAttribute('role', 'list');
    scroller.setAttribute('aria-label', I18n.t('sm.provider.modelsAria'));
    const canvas = document.createElement('div');
    canvas.className = 'pe-virtual-canvas';
    scroller.appendChild(canvas);
    form.appendChild(scroller);
    bodyEl.appendChild(form);

    // ═══════════════════════════════════════════════════════════════
    // Estado da virtualização
    // ═══════════════════════════════════════════════════════════════
    let expandedModelId = null;
    const heights = new Map();          // key -> altura medida (px)
    let flatItems = [];                 // [{ type:'group'|'model', key, ... }]
    let offsetsCache = [];
    let cachedTotalHeight = 0;
    let offsetsDirty = true;
    let rafScheduled = false;
    let scrollRAF = null;

    const VIRTUAL_BUFFER = 50;
    const OVERSCAN_PX = 200;
    const GROUP_EST = 44;        // 36 (texto) + 8 (padding-bottom)
    const MODEL_EST = 74;        // 66 (card) + 8 (padding-bottom)
    const MODEL_EXPANDED_EST = 368; // 360 + 8

    // ── Helpers de labels ────────────────────────────────────────────
    function limitsLabel(entry) {
        const parts = [];
        if (entry.limits && entry.limits.rpm != null) parts.push(I18n.t('sm.provider.limits.rpm', { n: entry.limits.rpm }));
        if (entry.limits && entry.limits.rpd != null) parts.push(I18n.t('sm.provider.limits.rpd', { n: entry.limits.rpd }));
        if (entry.limits && entry.limits.note) {
            parts.push(entry.limits.noteKey ? I18n.t(entry.limits.noteKey) : entry.limits.note);
        }
        return parts.join(' · ') || I18n.t('sm.provider.notInformedPl');
    }
    function authLabel(entry) {
        if (!entry.auth || entry.auth.type === 'none') return I18n.t('sm.provider.noAuth');
        return entry.auth.key === 'anonymous' ? I18n.t('sm.provider.bearerAnon') : I18n.t('sm.provider.bearer');
    }
    function isFreeBadge(entry) {
        return (entry.auth && (entry.auth.type === 'none' || entry.auth.key === 'anonymous'))
            || /free|gratuit/i.test((entry.limits && entry.limits.note) || '');
    }
    function fallbackMatchesEntry(fallback, entry) {
        if (!fallback || !entry) return false;
        if (fallback.id === entry.id) return true;
        if (fallback.url && entry.baseUrl) {
            const norm = (s) => String(s || '').replace(/\/+$/, '').replace(/\/chat\/completions\/?$/, '');
            if (norm(fallback.url) === norm(entry.baseUrl) && fallback.model === entry.modelId) return true;
        }
        return false;
    }

    // ── Builder: detalhes de um modelo (conteúdo expandido) ─────────
    function renderDetails(entry, pinned, fallback) {
        const details = document.createElement('dl');
        details.className = 'pe-model-details';
        const addField = (label, value) => {
            const dt = document.createElement('dt'); dt.textContent = label;
            const dd = document.createElement('dd'); dd.textContent = value;
            details.append(dt, dd);
        };
        addField(I18n.t('sm.provider.fieldProvider'), entry.providerLabel || entry.providerId || I18n.t('sm.provider.unknown'));
        addField(I18n.t('sm.provider.fieldAuth'), authLabel(entry));
        addField(I18n.t('sm.provider.fieldLimits'), limitsLabel(entry));
        addField(I18n.t('sm.provider.fieldContext'), entry.modelId || I18n.t('sm.provider.notInformed'));

        const actions = document.createElement('div');
        actions.className = 'pe-model-details__actions';

        // Copiar JSON
        const copyButton = Atoms.buttonNode({
            label: I18n.t('sm.provider.copyJson'),
            ariaLabel: I18n.t('sm.provider.copyJsonAria', { label: entry.label }),
            variant: 'ghost'
        });
        copyButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            if (!navigator.clipboard?.writeText) {
                Molecules.toast(I18n.t('sm.provider.copyUnavailable'), 'error'); return;
            }
            const safeEntry = {
                ...entry,
                auth: entry.auth ? { type: entry.auth.type, headerName: entry.auth.headerName } : undefined,
                headers: entry.headers ? Object.fromEntries(Object.entries(entry.headers).map(([n, v]) => [
                    n, /authorization|api[-_]?key|token|secret/i.test(n) ? I18n.t('sm.provider.redacted') : v
                ])) : undefined
            };
            try {
                await navigator.clipboard.writeText(JSON.stringify(safeEntry, null, 2));
                Molecules.toast(I18n.t('sm.provider.copyOk'), 'success');
            } catch (err) {
                console.warn('[PE] Falha ao copiar a configuração do modelo.', err);
                Molecules.toast(I18n.t('sm.provider.copyFail'), 'error');
            }
        });

        // Pin
        const pinButton = Atoms.buttonNode({
            label: pinned && pinned.id === entry.id ? I18n.t('sm.provider.routePinned') : I18n.t('sm.provider.pinRoute'),
            ariaLabel: pinned && pinned.id === entry.id ? I18n.t('sm.provider.pinnedAria') : I18n.t('sm.provider.pinAria', { label: entry.label }),
            variant: 'primary'
        });
        pinButton.disabled = !!(pinned && pinned.id === entry.id);
        pinButton.addEventListener('click', (event) => {
            event.stopPropagation();
            if (pinned && pinned.id === entry.id) return;
            if (entry.auth && entry.auth.type === 'bearer' && entry.auth.key === '') {
                const apiKey = prompt(I18n.t('sm.provider.apiKeyPrompt', { provider: entry.providerLabel || I18n.t('sm.provider.fieldProvider') }));
                if (apiKey === null) return;
                if (!apiKey.trim()) { Molecules.toast(I18n.t('sm.provider.apiKeyEmpty'), 'error'); return; }
                try { GM_setValue('pe_api_key', apiKey.trim()); }
                catch (err) { Molecules.toast(I18n.t('sm.provider.apiKeySaveFail'), 'error', { details: err && err.message }); return; }
            }
            if (!ProviderManager.pin(entry.id)) { Molecules.toast(I18n.t('sm.provider.pinFail'), 'error'); return; }
            Molecules.toast(I18n.t('sm.provider.pinOk', { label: entry.label }), 'success');
            updateRoutingPanel();
            rebuildVisible();
        });

        const isFallback = fallbackMatchesEntry(fallback, entry);
        const isPinned = pinned && pinned.id === entry.id;
        const fallbackButton = Atoms.buttonNode({
            label: isFallback ? I18n.t('sm.provider.removeFallback') : I18n.t('sm.provider.setFallback'),
            ariaLabel: isFallback ? I18n.t('sm.provider.removeFallbackAria', { label: entry.label }) : I18n.t('sm.provider.setFallbackAria', { label: entry.label }),
            variant: isFallback ? 'ghost' : 'outline'
        });
        fallbackButton.disabled = !!isPinned;
        if (isPinned) fallbackButton.title = I18n.t('sm.provider.fallbackPinnedTitle');
        fallbackButton.addEventListener('click', (event) => {
            event.stopPropagation();
            if (isPinned) return;
            if (isFallback) {
                try {
                    ProviderManager.setFallback('');
                    Molecules.toast(I18n.t('sm.provider.fallbackRemovedOk', { label: entry.label }), 'success');
                    updateRoutingPanel();
                    rebuildVisible();
                } catch (err) {
                    console.warn('[PE] Falha ao remover fallback:', err);
                    Molecules.toast(I18n.t('sm.provider.fallbackRemoveFail'), 'error');
                }
                return;
            }
            if (entry.auth && entry.auth.type === 'bearer' && entry.auth.key === '') {
                const apiKey = prompt(I18n.t('sm.provider.apiKeyPrompt', { provider: entry.providerLabel || I18n.t('sm.provider.fieldProvider') }));
                if (apiKey === null) return;
                if (!apiKey.trim()) { Molecules.toast(I18n.t('sm.provider.apiKeyEmpty'), 'error'); return; }
                try { GM_setValue('pe_api_key', apiKey.trim()); }
                catch (err) { Molecules.toast(I18n.t('sm.provider.apiKeySaveFail'), 'error', { details: err && err.message }); return; }
            }
            try {
                const providerPayload = {
                    name: String(entry.providerLabel || entry.label || 'Fallback').trim().slice(0, 60),
                    url: String(entry.baseUrl || '').trim(),
                    model: String(entry.modelId || '').trim(),
                    apiKey: String(entry.auth?.key || (entry.auth?.type === 'none' ? '' : 'anonymous')).trim(),
                    headers: { ...(entry.headers || {}) }
                };
                if (!providerPayload.url || !providerPayload.model) throw new Error('Empty URL or model');
                const newProvider = ProviderManager.add(providerPayload);
                if (newProvider && newProvider.id) {
                    ProviderManager.setFallback(newProvider.id);
                    Molecules.toast(I18n.t('sm.provider.fallbackOk', { label: entry.label }), 'success');
                    updateRoutingPanel();
                    rebuildVisible();
                } else {
                    throw new Error('ProviderManager.add returned no id');
                }
            } catch (err) {
                console.warn('[PE] Falha ao definir fallback:', err);
                Molecules.toast(I18n.t('sm.provider.fallbackFail'), 'error');
            }
        });

        actions.append(copyButton, pinButton, fallbackButton);
        details.appendChild(actions);
        return details;
    }

    // ── Builder: card de modelo (header + conteúdo expansível) ──────
    function buildModelCard(entry, isActive, pinned, fallback) {
        const card = document.createElement('div');
        card.className = 'pe-model-card' + (isActive ? ' is-active' : '');
        card.dataset.modelId = entry.id;

        const header = document.createElement('div');
        header.className = 'pe-model-header';
        header.setAttribute('role', 'button');
        header.tabIndex = 0;
        header.setAttribute('aria-expanded', String(isActive));
        header.setAttribute('aria-label', I18n.t('sm.provider.cardAria', {
            label: entry.label,
            provider: entry.providerLabel || I18n.t('sm.provider.fieldProvider'),
            action: isActive ? I18n.t('sm.provider.collapseDetails') : I18n.t('sm.provider.expandDetails')
        }));

        const info = document.createElement('div');
        info.className = 'pe-model-info';
        const name = document.createElement('span'); name.className = 'pe-model-info__name'; name.textContent = entry.label;
        const id = document.createElement('span'); id.className = 'pe-model-info__id'; id.textContent = entry.modelId || entry.id;
        info.append(name, id);

        const meta = document.createElement('div');
        meta.className = 'pe-model-header__meta';
        const badges = document.createElement('div');
        badges.className = 'pe-model-badges';
        const addBadge = (text, opts = {}) => {
            const b = document.createElement('span');
            b.className = 'pe-model-badge';
            if (opts.isPrimary) b.classList.add('is-primary');
            if (opts.isFallback) b.classList.add('is-fallback');
            b.textContent = text;
            badges.appendChild(b);
        };
        if (isFreeBadge(entry)) addBadge(I18n.t('sm.provider.free'));
        if (entry.capabilities && entry.capabilities.streaming) addBadge(I18n.t('sm.provider.streaming'));
        if (pinned && pinned.id === entry.id) addBadge(I18n.t('sm.provider.primaryBadge'), { isPrimary: true });
        if (fallback && fallbackMatchesEntry(fallback, entry)) addBadge(I18n.t('sm.provider.fallbackBadge'), { isFallback: true });
        const chevron = document.createElement('span');
        chevron.className = 'pe-chevron';
        chevron.setAttribute('aria-hidden', 'true');
        chevron.textContent = '▾';
        meta.append(badges, chevron);
        header.append(info, meta);

        const toggle = () => {
            const prev = expandedModelId;
            expandedModelId = expandedModelId === entry.id ? null : entry.id;
            // Invalida medições dos itens afetados; estimativas voltam a valer.
            if (prev) heights.delete(`m:${prev}`);
            if (expandedModelId) heights.delete(`m:${expandedModelId}`);
            offsetsDirty = true;
            renderWindow();
            // Reaplica foco no header reconstruído (preserva posição e navegação por teclado).
            const newHeader = canvas.querySelector(
                `.pe-virtual-item[data-vkey="m:${CSS.escape(entry.id)}"] .pe-model-header`
            );
            if (newHeader) newHeader.focus({ preventScroll: false });
        };

        header.addEventListener('click', toggle);
        header.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
        });
        card.appendChild(header);

        if (isActive) {
            const expand = document.createElement('div');
            expand.className = 'pe-model-expand';
            const clip = document.createElement('div');
            clip.className = 'pe-model-expand__clip';
            clip.appendChild(renderDetails(entry, pinned, fallback));
            expand.appendChild(clip);
            const regionId = Utils.uid('pe-model-region');
            header.setAttribute('aria-controls', regionId);
            expand.id = regionId;
            card.appendChild(expand);
        }
        return card;
    }

    function buildGroupHeader(group) {
        const title = document.createElement('h6');
        title.className = 'pe-provider-group-title';
        title.textContent = group.providerLabel || group.providerId || I18n.t('sm.provider.fieldProvider');
        return title;
    }

    // ═══════════════════════════════════════════════════════════════
    // Núcleo da virtualização
    // ═══════════════════════════════════════════════════════════════
    function estimate(item) {
        if (item.type === 'group') return GROUP_EST;
        if (item.entry.id === expandedModelId) return MODEL_EXPANDED_EST;
        return MODEL_EST;
    }
    function measureOrEstimate(item) {
        const m = heights.get(item.key);
        return m != null ? m : estimate(item);
    }
    function recomputeOffsets() {
        if (!offsetsDirty && offsetsCache.length === flatItems.length) {
            return { offsets: offsetsCache, totalHeight: cachedTotalHeight };
        }
        const offsets = new Array(flatItems.length);
        let acc = 0;
        for (let i = 0; i < flatItems.length; i++) {
            offsets[i] = acc;
            acc += measureOrEstimate(flatItems[i]);
        }
        offsetsCache = offsets;
        cachedTotalHeight = acc;
        offsetsDirty = false;
        return { offsets, totalHeight: acc };
    }
    // Busca binária: maior índice com offset <= y
    function findIndex(offsets, y) {
        if (!offsets.length) return 0;
        let lo = 0, hi = offsets.length - 1, res = 0;
        while (lo <= hi) {
            const mid = (lo + hi) >>> 1;
            if (offsets[mid] <= y) { res = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return res;
    }
    function buildFlatItems(groups) {
        const items = [];
        groups.forEach((group) => {
            items.push({ type: 'group', key: `g:${group.providerId}`, group });
            (group.entries || []).forEach((entry) => {
                items.push({ type: 'model', key: `m:${entry.id}`, entry, group });
            });
        });
        return items;
    }
    function getFilteredGroups() {
        return ProviderRegistry.groupByProvider(ProviderRegistry.list({
            keylessOnly: keyless.checked,
            streamingOnly: streaming.checked,
            search: search.value.trim()
        }));
    }
    function updateRoutingPanel() {
        const pinned = ProviderManager.getPinned ? ProviderManager.getPinned() : null;
        const fallback = ProviderManager.getFallback ? ProviderManager.getFallback() : null;
        const activeProvider = ProviderManager.getActive ? ProviderManager.getActive() : null;

        if (pinned) primaryValue.textContent = `${pinned.label} (${pinned.modelId || pinned.id})`;
        else if (activeProvider) primaryValue.textContent = `${activeProvider.name || 'Kilo'} (${activeProvider.model || I18n.t('sm.provider.default')})`;
        else primaryValue.textContent = I18n.t('sm.provider.defaultSystem');

        if (fallback) fallbackValue.textContent = `${fallback.name || 'Fallback'} (${fallback.model || ''})`.trim();
        else fallbackValue.textContent = I18n.t('sm.provider.none');
    }
    function renderEmpty() {
        if (resizeObserver) canvas.querySelectorAll('.pe-virtual-item').forEach((el) => resizeObserver.unobserve(el));
        canvas.style.height = '';
        canvas.innerHTML = '';
        const empty = document.createElement('div');
        empty.className = 'pe-provider-empty';
        empty.setAttribute('role', 'status');
        const message = document.createElement('p');
        message.textContent = search.value.trim()
            ? I18n.t('sm.provider.emptySearch', { query: search.value.trim() })
            : I18n.t('sm.provider.emptyFilters');
        const clear = Atoms.buttonNode({ label: I18n.t('sm.provider.clearFilters'), variant: 'ghost' });
        clear.type = 'button';
        clear.setAttribute('aria-label', I18n.t('sm.provider.clearFiltersAria'));
        clear.addEventListener('click', () => {
            search.value = '';
            keyless.checked = false;
            streaming.checked = false;
            expandedModelId = null;
            heights.clear();
            offsetsDirty = true;
            refresh();
            search.focus({ preventScroll: true });
        });
        empty.append(message, clear);
        canvas.appendChild(empty);
    }

    function renderWindow() {
        if (!flatItems.length) return;
        const scrollTop = scroller.scrollTop;
        const vh = scroller.clientHeight || 400;
        const { offsets, totalHeight } = recomputeOffsets();
        canvas.style.height = totalHeight + 'px';

        const startVisible = findIndex(offsets, Math.max(0, scrollTop - OVERSCAN_PX));
        const endVisible = findIndex(offsets, scrollTop + vh + OVERSCAN_PX);
        const start = Math.max(0, startVisible - VIRTUAL_BUFFER);
        const end = Math.min(flatItems.length - 1, endVisible + VIRTUAL_BUFFER);

        const pinned = ProviderManager.getPinned ? ProviderManager.getPinned() : null;
        const fallback = ProviderManager.getFallback ? ProviderManager.getFallback() : null;

        const existingByKey = new Map();
        canvas.querySelectorAll('.pe-virtual-item').forEach((el) => {
            existingByKey.set(el.getAttribute('data-vkey'), el);
        });

        const seen = new Set();
        for (let i = start; i <= end; i++) {
            const item = flatItems[i];
            const offset = offsets[i];
            seen.add(item.key);

            let el = existingByKey.get(item.key);
            if (!el) {
                el = document.createElement('div');
                el.className = 'pe-virtual-item';
                el.setAttribute('data-vkey', item.key);
                el.setAttribute('role', 'listitem');
                if (item.type === 'group') {
                    el.appendChild(buildGroupHeader(item.group));
                } else {
                    el.appendChild(buildModelCard(item.entry, item.entry.id === expandedModelId, pinned, fallback));
                }
                if (resizeObserver) resizeObserver.observe(el);
                canvas.appendChild(el);
            } else if (item.type === 'model') {
                const card = el.querySelector('.pe-model-card');
                const shouldBeActive = item.entry.id === expandedModelId;
                if (card && card.classList.contains('is-active') !== shouldBeActive) {
                    if (resizeObserver) resizeObserver.unobserve(el);
                    el.innerHTML = '';
                    el.appendChild(buildModelCard(item.entry, shouldBeActive, pinned, fallback));
                    if (resizeObserver) resizeObserver.observe(el);
                }
            }
            el.style.top = offset + 'px';
        }

        existingByKey.forEach((el, key) => {
            if (!seen.has(key)) {
                if (resizeObserver) resizeObserver.unobserve(el);
                el.remove();
            }
        });
    }

    // Re-renderiza apenas os cards visíveis (usado em pin/fallback/clear-routing).
    function rebuildVisible() {
        const pinned = ProviderManager.getPinned ? ProviderManager.getPinned() : null;
        const fallback = ProviderManager.getFallback ? ProviderManager.getFallback() : null;
        canvas.querySelectorAll('.pe-virtual-item[data-vkey^="m:"]').forEach((el) => {
            const key = el.getAttribute('data-vkey');
            const item = flatItems.find((it) => it.key === key);
            if (!item || item.type !== 'model') return;
            if (resizeObserver) resizeObserver.unobserve(el);
            el.innerHTML = '';
            const isActive = item.entry.id === expandedModelId;
            el.appendChild(buildModelCard(item.entry, isActive, pinned, fallback));
            if (resizeObserver) resizeObserver.observe(el);
        });
    }

    function refresh(opts = {}) {
        const groups = getFilteredGroups();
        flatItems = buildFlatItems(groups);

        // Estado expandido inválido após mudança de filtro → colapsa.
        if (expandedModelId && !flatItems.some((it) => it.type === 'model' && it.entry.id === expandedModelId)) {
            expandedModelId = null;
        }

        updateRoutingPanel();

        if (!groups.length) { renderEmpty(); return; }

        offsetsDirty = true;
        if (opts.forceRebuild) {
            canvas.querySelectorAll('.pe-virtual-item').forEach((el) => {
                if (resizeObserver) resizeObserver.unobserve(el);
                el.remove();
            });
        }
        renderWindow();

        if (opts.focusKey) {
            const target = canvas.querySelector(
                `.pe-virtual-item[data-vkey="${CSS.escape(opts.focusKey)}"] .pe-model-header`
            );
            if (target) target.focus({ preventScroll: false });
        }
    }

    // ── ResizeObserver: corrige estimativas com medições reais ──────
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver((entries) => {
            let changed = false;
            entries.forEach((entry) => {
                const el = entry.target;
                const key = el.getAttribute('data-vkey');
                if (!key) return;
                // Mede a border-box (inclui padding-bottom) — contentRect
                // ignora o padding e subestima o offset do próximo item.
                const h = entry.borderBoxSize?.[0]?.blockSize
                       ?? entry.target.offsetHeight;
                const prev = heights.get(key);
                if (prev == null || Math.abs(prev - h) > 1) {
                    heights.set(key, h);
                    changed = true;
                }
            });
            if (changed) {
                offsetsDirty = true;
                const { offsets, totalHeight } = recomputeOffsets();
                canvas.style.height = totalHeight + 'px';
                // Reposiciona apenas os itens já montados (O(k) com k = janela).
                canvas.querySelectorAll('.pe-virtual-item').forEach((el) => {
                    const key = el.getAttribute('data-vkey');
                    const idx = flatItems.findIndex((it) => it.key === key);
                    if (idx >= 0) el.style.top = offsets[idx] + 'px';
                });
            }
        });
    }

    // ── Scroll com rAF throttle (60 fps) ────────────────────────────
    scroller.addEventListener('scroll', () => {
        if (scrollRAF) return;
        scrollRAF = requestAnimationFrame(() => {
            scrollRAF = null;
            renderWindow();
        });
    }, { passive: true });

    // ── Filtros ─────────────────────────────────────────────────────
    [keyless, streaming].forEach((control) => control.addEventListener('change', () => {
        expandedModelId = null;
        heights.clear();
        offsetsDirty = true;
        refresh();
    }));
    search.addEventListener('input', () => {
        expandedModelId = null;
        heights.clear();
        offsetsDirty = true;
        refresh();
    });

    // ── Primeira renderização + hidratação ──────────────────────────
    loading.hidden = false;
    refresh();
    ProviderRegistry.hydrate().then(() => {
        loading.hidden = true;
        heights.clear();
        offsetsDirty = true;
        refresh();
    }).catch((err) => {
        console.warn('[PE] Falha ao atualizar catálogo na aba Provedor.', err);
        loading.hidden = false;
        loading.textContent = I18n.t('sm.provider.updateFail');
        refresh();
    });

    const closeBtn = Atoms.button({ icon: 'x', label: I18n.t('sm.footer.close'), ariaLabel: I18n.t('sm.footer.closeWindowAria'), variant: 'primary', onClick: close });
    footerEl.appendChild(closeBtn);
}
        function renderWorkspace() {
            WorkspaceUI.render(bodyEl);
        }

        function renderManualContext() {
            const form = document.createElement('div');
            form.className = 'pe-param-body';
            const infoBox = document.createElement('div');
            infoBox.className = 'pe-context-info';
            const activeFiles = ProjectContext.list().filter(f => f.enabled);
            infoBox.innerHTML = `<div class="pe-context-info__title">${Utils.escapeHtml(I18n.t('sm.context.infoTitle'))}</div><div class="pe-context-info__text">${Utils.escapeHtml(I18n.tPlural('sm.context.fileActive', activeFiles.length, { one: I18n.t('sm.context.fileActive.one', { n: activeFiles.length }), other: I18n.t('sm.context.fileActive.other', { n: activeFiles.length }) }))} · ${Utils.formatBytes(ProjectContext.getTotalSize())} · ${ProjectContext.isEnabled() ? I18n.t('sm.context.injectionOn') : I18n.t('sm.context.injectionOff')}</div><div class="pe-context-info__hint">${Utils.escapeHtml(I18n.t('sm.context.hint'))}</div>`;
            const manageBtn = document.createElement('button');
            manageBtn.type = 'button';
            manageBtn.className = 'pe-context-manage';
            manageBtn.textContent = I18n.t('sm.context.manage');
            manageBtn.addEventListener('click', () => { close(); setTimeout(() => State.activeComposer?.actionbar?.contextBtn?.click(), 250); });
            infoBox.appendChild(manageBtn);
            form.appendChild(infoBox);
            bodyEl.appendChild(form);
        }

        function renderInterface() {
            const form = document.createElement('div');
            form.className = 'pe-param-body';
            // ── Seção 2: idioma da interface (script) ──────────────────────
            const uiLangLabel = document.createElement('div');
            uiLangLabel.className = 'pe-section-label';
            uiLangLabel.innerHTML = `${Atoms.icon('gear').outerHTML}<span>${Utils.escapeHtml(I18n.t('sm.context.section.uiLanguage'))}</span>`;
            form.appendChild(uiLangLabel);

            const langRow = document.createElement('div');
            langRow.className = 'pe-param-row';
            langRow.innerHTML = `<label class="pe-param-label" for="pe-ui-language">${Utils.escapeHtml(I18n.t('param.ui_language.label'))}</label><div class="pe-param-control"><select id="pe-ui-language" class="pe-param-input"><option value="auto">${Utils.escapeHtml(I18n.t('param.ui_language.opt.auto'))}</option><option value="pt-BR">${Utils.escapeHtml(I18n.t('param.ui_language.opt.ptBR'))}</option><option value="en">${Utils.escapeHtml(I18n.t('param.ui_language.opt.en'))}</option></select><div class="pe-param-hint">${Utils.escapeHtml(I18n.t('param.ui_language.hint'))}</div></div>`;
            const langSelect = langRow.querySelector('select');
            langSelect.value = I18n.getStoredLanguage() || 'auto';
            langSelect.addEventListener('change', (e) => { I18n.setLanguage(e.target.value); Molecules.toast(I18n.t('bs.langChanged'), 'info'); });
            form.appendChild(langRow);
            // ── Seção: aparência (tema) ──────────────────────────────────
            const appearanceLabel = document.createElement('div');
            appearanceLabel.className = 'pe-section-label';
            appearanceLabel.innerHTML = `${Atoms.icon('sparkles').outerHTML}<span>${Utils.escapeHtml(I18n.t('sm.context.section.appearance'))}</span>`;
            form.appendChild(appearanceLabel);

            const themeRow = document.createElement('div');
            themeRow.className = 'pe-param-row';
            const themeOpts = Theme.MODES.map(m => `<option value="${m}">${Utils.escapeHtml(I18n.t(`param.theme.opt.${m}`))}</option>`).join('');
            themeRow.innerHTML = `<label class="pe-param-label" for="pe-ui-theme">${Utils.escapeHtml(I18n.t('param.theme.label'))}</label><div class="pe-param-control"><select id="pe-ui-theme" class="pe-param-input">${themeOpts}</select><div class="pe-param-hint">${Utils.escapeHtml(I18n.t('param.theme.hint'))}</div></div>`;
            const themeSelect = themeRow.querySelector('select');
            themeSelect.value = Theme.get();
            themeSelect.addEventListener('change', (e) => Theme.set(e.target.value));
            form.appendChild(themeRow);
            bodyEl.appendChild(form);
        }

        function renderResponse() {
            const form = document.createElement('div');
            form.className = 'pe-param-body';
            // ── Seção 3: idioma e estilo da resposta ───────────────────────
            const responseStyleLabel = document.createElement('div');
            responseStyleLabel.className = 'pe-section-label';
            responseStyleLabel.innerHTML = `${Atoms.icon('sparkles').outerHTML}<span>${Utils.escapeHtml(I18n.t('sm.context.section.responseStyle'))}</span>`;
            form.appendChild(responseStyleLabel);

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
                    syncFooter('response');
                });
            });

            const customTone = ParamSchema.SCHEMA.find(f => f.key === 'response_persona_custom');
            const customToneRow = document.createElement('div');
            customToneRow.className = 'pe-param-row';
            customToneRow.innerHTML = `<label class="pe-param-label" for="pe-param-${customTone.key}">${Utils.escapeHtml(customTone.label)}</label><div class="pe-param-control"><input type="text" id="pe-param-${customTone.key}" class="pe-param-input" maxlength="${customTone.maxLength}" value="${Utils.escapeHtml(draft[customTone.key] || '')}" placeholder="${I18n.t('param.response_persona_custom.placeholder')}"><div class="pe-param-hint">${Utils.escapeHtml(customTone.hint)}</div></div>`;
            form.appendChild(customToneRow);
            customToneRow.querySelector('input').addEventListener('input', (e) => { draft[customTone.key] = e.target.value; syncFooter('response'); });
            function updateCustomToneVisibility() {
                customToneRow.style.display = draft.response_persona === 'auto' ? 'none' : '';
            }
            updateCustomToneVisibility();
            bodyEl.appendChild(form);
            renderFooter('response', computeDirty('response'), false);
        }

        function renderSystemPrompt() {
            const form = document.createElement('div');
            form.className = 'pe-param-body pe-system-prompt';

            const intro = document.createElement('div');
            intro.className = 'pe-system-prompt__intro';
            const title = document.createElement('h5');
            title.className = 'pe-system-prompt__title';
            title.textContent = I18n.t('sm.sp.introTitle');
            const description = document.createElement('p');
            description.className = 'pe-system-prompt__description';
            description.textContent = I18n.t('sm.sp.introDesc');
            intro.append(title, description);
            form.appendChild(intro);

            const editorCard = document.createElement('section');
            editorCard.className = 'pe-system-prompt__card pe-system-prompt__editor-card';
            editorCard.setAttribute('aria-labelledby', 'pe-system-prompt-heading');
            const editorHeading = document.createElement('div');
            editorHeading.className = 'pe-system-prompt__section-heading';
            const editorTitle = document.createElement('h6');
            editorTitle.id = 'pe-system-prompt-heading';
            editorTitle.textContent = I18n.t('sm.sp.editorTitle');
            const editorHint = document.createElement('p');
            editorHint.textContent = I18n.t('sm.sp.editorHint');
            editorHeading.append(editorTitle, editorHint);

            const editorLabel = document.createElement('label');
            editorLabel.className = 'pe-system-prompt__label';
            editorLabel.htmlFor = 'pe-system-prompt-editor';
            editorLabel.textContent = I18n.t('sm.sp.editorLabel');
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
                const loc = I18n.getLanguage() === 'en' ? 'en-US' : 'pt-BR';
                count.textContent = `${result.charCount.toLocaleString(loc)} / ${SystemPromptManager.MAX_LENGTH.toLocaleString(loc)} ${I18n.t('spm.charsLabel')}`;
                const state = result.errors.length ? 'error' : (result.warnings.length ? 'warning' : 'valid');
                feedback.className = `pe-system-prompt__feedback is-${state}`;
                editor.setAttribute('aria-invalid', String(result.errors.length > 0));
                feedback.textContent = result.errors.length
                    ? result.errors.join(' ')
                    : (result.warnings.length ? result.warnings.join(' ') : I18n.t('spm.valid'));
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
                icon: 'undo', label: I18n.t('sm.sp.reset'), ariaLabel: I18n.t('sm.sp.resetAria'),
                variant: 'outline', onClick: () => {
                    systemPromptDraft.prompt = CONFIG.SYSTEM_PROMPT;
                    editor.value = systemPromptDraft.prompt;
                    updateValidation();
                    syncFooter('systemPrompt');
                    Molecules.toast(I18n.t('sm.sp.resetToast'), 'info');
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
            presetTitle.textContent = I18n.t('sm.sp.presetsTitle');
            const presetHint = document.createElement('p');
            presetHint.textContent = I18n.t('sm.sp.presetsHint', { max: SystemPromptManager.MAX_PRESETS });
            presetHeading.append(presetTitle, presetHint);

            const presetSelectLabel = document.createElement('label');
            presetSelectLabel.className = 'pe-system-prompt__label';
            presetSelectLabel.htmlFor = 'pe-system-preset-select';
            presetSelectLabel.textContent = I18n.t('sm.sp.presetSaved');
            const presetSelect = document.createElement('select');
            presetSelect.id = 'pe-system-preset-select';
            presetSelect.className = 'pe-param-input pe-system-prompt__select';
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = I18n.t('sm.sp.presetSelect');
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
            presetNameLabel.textContent = I18n.t('sm.sp.presetName');
            const presetName = document.createElement('input');
            presetName.id = 'pe-system-preset-name';
            presetName.className = 'pe-param-input pe-system-prompt__name';
            presetName.type = 'text';
            presetName.maxLength = SystemPromptManager.MAX_PRESET_NAME;
            presetName.autocomplete = 'off';
            presetName.placeholder = I18n.t('sm.sp.presetNamePlaceholder');
            presetName.setAttribute('aria-describedby', 'pe-system-preset-name-hint');
            presetName.value = presetSelect.value;
            const presetNameHint = document.createElement('div');
            presetNameHint.id = 'pe-system-preset-name-hint';
            presetNameHint.className = 'pe-system-prompt__helper';
            presetNameHint.textContent = I18n.t('sm.sp.presetNameHint');
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
            const loadPresetBtn = Atoms.button({ icon: 'check', label: I18n.t('sm.sp.load'), ariaLabel: I18n.t('sm.sp.loadAria'), variant: 'outline', onClick: () => {
                const selected = systemPromptDraft.presets.find(p => p.name === presetSelect.value);
                if (!selected) { Molecules.toast(I18n.t('sm.sp.toast.selectLoad'), 'error'); return; }
                systemPromptDraft.prompt = selected.prompt;
                editor.value = selected.prompt;
                updateValidation();
                syncFooter('systemPrompt');
                Molecules.toast(I18n.t('sm.sp.toast.loaded', { name: selected.name }), 'success');
                editor.focus();
            }});
            const savePresetBtn = Atoms.button({ icon: 'check', label: I18n.t('sm.sp.savePreset'), ariaLabel: I18n.t('sm.sp.savePresetAria'), variant: 'outline', onClick: () => {
                const name = presetName.value.trim();
                const check = SystemPromptManager.validatePrompt(systemPromptDraft.prompt);
                if (check.errors.length) { Molecules.toast(check.errors.join(' '), 'error'); editor.focus(); return; }
                if (!name || name.length > SystemPromptManager.MAX_PRESET_NAME) {
                    Molecules.toast(I18n.t('sm.sp.toast.nameLen', { max: SystemPromptManager.MAX_PRESET_NAME }), 'error');
                    presetName.focus();
                    return;
                }
                const existing = systemPromptDraft.presets.find(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase());
                if (existing && !confirm(I18n.t('sm.sp.toast.existsReplace', { name: existing.name }))) return;
                if (!existing && systemPromptDraft.presets.length >= SystemPromptManager.MAX_PRESETS) {
                    Molecules.toast(I18n.t('sm.sp.toast.limit', { max: SystemPromptManager.MAX_PRESETS }), 'error');
                    return;
                }
                const presets = systemPromptDraft.presets.map(preset => ({ ...preset }));
                const existingPreset = presets.find(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase());
                if (existingPreset) { existingPreset.name = name; existingPreset.prompt = systemPromptDraft.prompt; }
                else presets.push({ name, prompt: systemPromptDraft.prompt });
                try {
                    persistSystemPromptPresets(presets);
                } catch (error) {
                    Molecules.toast(I18n.t('sm.sp.toast.saveFail'), 'error', { details: error.message });
                    return;
                }
                selectedSystemPreset = name;
                render();
                Molecules.toast(I18n.t('sm.sp.toast.saved', { name }), 'success');
            }});
            const renamePresetBtn = Atoms.button({ icon: 'doc', label: I18n.t('sm.sp.rename'), ariaLabel: I18n.t('sm.sp.renameAria'), variant: 'outline', onClick: () => {
                const selectedIndex = systemPromptDraft.presets.findIndex(p => p.name === presetSelect.value);
                const name = presetName.value.trim();
                if (selectedIndex < 0) { Molecules.toast(I18n.t('sm.sp.toast.selectRename'), 'error'); return; }
                if (!name || name.length > SystemPromptManager.MAX_PRESET_NAME) { Molecules.toast(I18n.t('sm.sp.toast.nameLen', { max: SystemPromptManager.MAX_PRESET_NAME }), 'error'); return; }
                const duplicateIndex = systemPromptDraft.presets.findIndex((p, i) => i !== selectedIndex && p.name.toLocaleLowerCase() === name.toLocaleLowerCase());
                const presets = systemPromptDraft.presets.map(preset => ({ ...preset }));
                if (duplicateIndex >= 0) {
                    if (!confirm(I18n.t('sm.sp.toast.existsReplaceDelete', { name: systemPromptDraft.presets[duplicateIndex].name }))) return;
                    presets.splice(duplicateIndex, 1);
                    const adjustedIndex = selectedIndex > duplicateIndex ? selectedIndex - 1 : selectedIndex;
                    presets.splice(adjustedIndex, 1, { name, prompt: presets[adjustedIndex].prompt });
                } else {
                    presets[selectedIndex].name = name;
                }
                try {
                    persistSystemPromptPresets(presets);
                } catch (error) {
                    Molecules.toast(I18n.t('sm.sp.toast.renameFail'), 'error', { details: error.message });
                    return;
                }
                selectedSystemPreset = name;
                render();
                Molecules.toast(I18n.t('sm.sp.toast.renamed'), 'success');
            }});
            const deletePresetBtn = Atoms.button({ icon: 'trash', label: I18n.t('sm.sp.delete'), ariaLabel: I18n.t('sm.sp.deleteAria'), variant: 'outline', onClick: () => {
                const selectedIndex = systemPromptDraft.presets.findIndex(p => p.name === presetSelect.value);
                if (selectedIndex < 0) { Molecules.toast(I18n.t('sm.sp.toast.selectDelete'), 'error'); return; }
                const name = systemPromptDraft.presets[selectedIndex].name;
                if (!confirm(I18n.t('sm.sp.toast.confirmDelete', { name }))) return;
                const presets = systemPromptDraft.presets.map(preset => ({ ...preset }));
                presets.splice(selectedIndex, 1);
                try {
                    persistSystemPromptPresets(presets);
                } catch (error) {
                    Molecules.toast(I18n.t('sm.sp.toast.deleteFail'), 'error', { details: error.message });
                    return;
                }
                selectedSystemPreset = '';
                render();
                Molecules.toast(I18n.t('sm.sp.toast.deleted'), 'success');
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
            defaultSummary.textContent = I18n.t('sm.sp.defaultSummary');
            const defaultDescription = document.createElement('p');
            defaultDescription.className = 'pe-system-prompt__helper';
            defaultDescription.textContent = I18n.t('sm.sp.defaultHint');
            const defaultEditor = document.createElement('textarea');
            defaultEditor.id = 'pe-system-prompt-default';
            defaultEditor.className = 'pe-textarea pe-system-prompt__default-textarea';
            defaultEditor.rows = 6;
            defaultEditor.readOnly = true;
            defaultEditor.setAttribute('aria-label', I18n.t('sm.sp.defaultAria'));
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
                empty.textContent = I18n.t('sm.history.empty');
                bodyEl.appendChild(empty);
                const closeBtn = Atoms.button({ icon: 'x', label: I18n.t('sm.footer.close'), ariaLabel: I18n.t('sm.footer.closeWindowAria'), variant: 'primary', onClick: close });
                footerEl.appendChild(closeBtn);
                return;
            }
            const container = document.createElement('div');
            const statusIconMap = { success: '✓', error: '✗', aborted: '⏸', pending: '○' };
            const outcomeLabels = { applied: I18n.t('sm.history.outcome.applied'), cancelled: I18n.t('sm.history.outcome.cancelled'), error: I18n.t('sm.history.outcome.error'), aborted: I18n.t('sm.history.outcome.aborted'), pending: I18n.t('sm.history.outcome.pending') };
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
                        if (!document.execCommand('copy')) throw new Error(I18n.t('sm.provider.copyUnavailable'));
                    } finally {
                        textarea.remove();
                    }
                }
            };
            const deleteRun = (runId, runCard) => {
                if (!runId) return;
                if (!confirm(I18n.t('sm.history.deleteConfirm'))) return;
                try {
                    const raw = GM_getValue('pe_runs', '[]');
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    const list = Array.isArray(parsed) ? parsed : [];
                    const filtered = list.filter(r => r && r.id !== runId);
                    GM_setValue('pe_runs', JSON.stringify(filtered));
                    Molecules.toast(I18n.t('sm.history.deleteOk'), 'success');
                    runCard?.remove();
                    render();
                    setTimeout(() => {
                        const closeBtn = footerEl.querySelector('.pe-btn');
                        if (closeBtn) closeBtn.focus();
                    }, 0);
                } catch (error) {
                    console.error('[PE] Falha ao excluir execução do histórico:', error);
                    Molecules.toast(I18n.t('sm.history.deleteFail'), 'error', { details: error.message });
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
                const typeBadge = run.type === 'guided' ? I18n.t('sm.history.type.guided') : I18n.t('sm.history.type.enhance');
                const preview = Utils.truncate(run.input || '', 100);
                const time = I18n.formatDate(run.startedAt);
                const dur = run.durationMs >= 1000 ? `${(run.durationMs / 1000).toFixed(2)}s` : `${run.durationMs}ms`;
                const callsCount = (run.calls && run.calls.length) || 0;
                const outcomeLabel = outcomeLabels[run.outcome] || run.outcome || I18n.t('sm.history.dash');
                const outcomeClass = `pe-outcome-${run.outcome || 'pending'}`;
                const legacyBadge = run.meta && run.meta.legacy ? `<span class="pe-history-legacy-badge">${Utils.escapeHtml(I18n.t('sm.history.legacy'))}</span>` : '';

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
                            <span>· ${I18n.t('sm.history.callsCount', { n: callsCount })}</span>
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
                    label: I18n.t('sm.history.copyJson'),
                    ariaLabel: I18n.t('sm.history.copyJsonAria', { type: typeBadge }),
                    variant: 'outline',
                    onClick: async () => {
                        try {
                            await copyRunJson(run);
                            Molecules.toast(I18n.t('sm.history.copyOk'), 'success');
                        } catch (error) {
                            console.error('[PE] Falha ao copiar execução do histórico:', error);
                            Molecules.toast(I18n.t('sm.history.copyFail'), 'error', { details: error.message });
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

                addSection(I18n.t('sm.history.section.input'), run.input || I18n.t('sm.history.empty.value'));

                const ctx = run.contextInfo;
                if (ctx && (ctx.activeCount || ctx.totalBytes || ctx.enabled)) {
                    addSection(I18n.t('sm.history.section.context'), `${I18n.tPlural('sm.context.fileActive', ctx.activeCount || 0, { one: I18n.t('sm.context.fileActive.one', { n: ctx.activeCount || 0 }), other: I18n.t('sm.context.fileActive.other', { n: ctx.activeCount || 0 }) })} · ${Utils.formatBytes(ctx.totalBytes || 0)} · ${ctx.enabled ? I18n.t('sm.context.injectionOn') : I18n.t('sm.context.injectionOff')}`, { isKV: true });
                } else {
                    addSection(I18n.t('sm.history.section.context'), I18n.t('sm.history.dash'), { isKV: true });
                }

                addSection(I18n.t('sm.history.section.params'), JSON.stringify(run.params || {}, null, 2));

                if (run.error) {
                    addSection(I18n.t('sm.history.section.resultError'), JSON.stringify(run.error, null, 2), { isError: true });
                } else if (run.output) {
                    addSection(I18n.t('sm.history.section.result'), run.output);
                } else {
                    addSection(I18n.t('sm.history.section.result'), I18n.t('sm.history.empty.output'), { isKV: true });
                }

                const deleteSection = document.createElement('div');
                deleteSection.className = 'pe-history-section';
                deleteSection.style.display = 'flex';
                deleteSection.style.justifyContent = 'flex-end';
                const deleteBtn = Atoms.button({
                    icon: 'trash',
                    label: I18n.t('sm.history.delete'),
                    ariaLabel: I18n.t('sm.history.deleteAria', { type: typeBadge.toLowerCase(), time }),
                    variant: 'outline',
                    onClick: () => deleteRun(run.id, card)
                });
                deleteSection.appendChild(deleteBtn);
                details.appendChild(deleteSection);

                if (run.calls && run.calls.length) {
                    const callsLabel = document.createElement('div');
                    callsLabel.className = 'pe-history-section__label';
                    callsLabel.textContent = I18n.t('sm.history.section.calls', { n: run.calls.length });
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
                        const kindLabel = call.kind === 'questions' ? I18n.t('sm.history.call.questions') : call.kind === 'enhance-with-answers' ? I18n.t('sm.history.call.enhanceWithAnswers') : call.kind === 'repair' ? I18n.t('sm.history.call.repair') : I18n.t('sm.history.call.main');
                        const retryTag = call.retryOf ? ` · ${I18n.t('sm.history.call.retry')}` : '';
                        const streamTag = call.streamUsed ? ` · ${I18n.t('sm.history.call.stream')}` : '';
                        const fbTag = call.fallbackUsed ? ` · ${I18n.t('sm.history.call.fallback')}` : '';

                        callHeader.innerHTML = `
                            <span class="pe-history-call__status ${callStatus}">${callStatusIcon}</span>
                            <span class="pe-history-call__main">
                                <span class="pe-history-call__title">${Utils.escapeHtml(kindLabel)} · ${I18n.t('sm.history.call.attempt', { n: call.attempt })}${retryTag}</span>
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
                            if (call.payload.system) addCallSection(I18n.t('sm.history.call.systemPrompt'), call.payload.system);
                            if (call.payload.messages && call.payload.messages.length) addCallSection(I18n.t('sm.history.call.messages'), JSON.stringify(call.payload.messages, null, 2));
                            if (call.payload.params) addCallSection(I18n.t('sm.history.call.params'), JSON.stringify(call.payload.params, null, 2));
                            if (call.payload.meta) addCallSection(I18n.t('sm.history.call.meta'), JSON.stringify(call.payload.meta, null, 2));
                        }
                        if (call.output) addCallSection(I18n.t('sm.history.call.output'), call.output);
                        else addCallSection(I18n.t('sm.history.call.output'), I18n.t('sm.history.empty.value'), { isKV: true });
                        if (call.error) addCallSection(I18n.t('sm.history.call.error'), JSON.stringify(call.error, null, 2), { isError: true });

                        callEl.appendChild(callDetails);
                        details.appendChild(callEl);
                    });
                }

                card.appendChild(details);
                container.appendChild(card);
            });
            bodyEl.appendChild(container);

            const clearBtn = Atoms.button({ icon: 'trash', label: I18n.t('sm.history.clear'), ariaLabel: I18n.t('sm.history.clearAria'), variant: 'outline', onClick: () => {
                if (confirm(I18n.t('sm.history.clearConfirm'))) { EnhancementHistory.clear(); render(); }
            }});
            const closeBtn = Atoms.button({ icon: 'x', label: I18n.t('sm.footer.close'), ariaLabel: I18n.t('sm.footer.closeWindowAria'), variant: 'primary', onClick: close });
            footerEl.appendChild(clearBtn);
            footerEl.appendChild(closeBtn);
        }

        i18nRefresh = () => {
            const sc = bodyEl.scrollTop;
            h4.textContent = I18n.t('sm.title');
            headingHint.textContent = I18n.t('sm.hint');
            panel.setAttribute('aria-label', I18n.t('sm.title'));
            closeBtn.setAttribute('aria-label', I18n.t('sm.footer.closeAria'));
            tabsBar.setAttribute('aria-label', I18n.t('sm.tabs.aria'));
            tabsBar.setAttribute('data-section-label', I18n.t('sm.tabs.section'));
            const tabs = getTabDefs();
            Object.entries(tabButtons).forEach(([k, b]) => {
                const t = tabs.find(tab => tab.key === k);
                if (!t) return;
                b.setAttribute('aria-label', t.label);
                const lbl = b.querySelector('.pe-modal-tab__label');
                if (lbl) lbl.textContent = t.label;
            });
            render();
            bodyEl.scrollTop = sc;
        };
        window.addEventListener('pe:i18n-changed', i18nRefresh);
        render();
        return { close };
    }
