// ===== src/orchestration.js =====
    const getAnchor = () => State.activeComposer?.mount || State.activeInput || document.body;
    const closePreview = () => { State.preview?.close?.(); State.preview = null; };
    const closeWizard = () => { State.wizard?.close?.(); State.wizard = null; };
    const closeAll = () => { closePreview(); closeWizard(); };

    function _activeAdapter() {
        if (typeof SiteAdapterRegistry === 'undefined') return null;
        const host = (location.hostname || '').toLowerCase();
        return SiteAdapterRegistry.getAdapter({ hostname: host, href: location.href, pathname: location.pathname || '' });
    }
    function _insertText(el, text) {
        const adapter = _activeAdapter();
        if (adapter && typeof adapter.insertText === 'function') {
            const ok = adapter.insertText(el, text);
            if (ok === false) { Utils.applyText(el, text); }
            return;
        }
        Utils.applyText(el, text);
    }

    async function onParams() {
        return new Promise((resolve) => {
            let settled = false, saved = null;
            Molecules.settingsModal({
                initialTab: 'params',
                onSave: (vals) => { saved = vals; },
                onClose: () => { if (settled) return; settled = true; resolve(saved); }
            });
        });
    }

    async function onSettings() {
        Molecules.settingsModal({
            initialTab: 'params',
            onSave: (vals) => { State.params = vals; },
            onClose: () => {}
        });
    }

    function handleEnhanceError(err) {
        if (err?.code === 'ABORTED') return;
        const idx = ErrorIndexer.classify(err);
        ErrorIndexer.record(err);
        const description = String(idx.description || '').slice(0, 200);
        try { console.groupCollapsed(`[PE] ❌ ${idx.code} — ${idx.title}`); console.debug('description:', description); console.groupEnd(); } catch (_) {}
        const text = description ? `${idx.title}\n${description}` : idx.title;
        const ACTION_MAP = { 'retry': () => retryEnhance(), 'retry-no-context': () => retryEnhanceNoContext(), 'retry-nostream': () => retryEnhanceNoStream(), 'open-params': () => onParams() };
        const labels = { retry: I18n.t('orq.action.retry'), 'retry-no-context': I18n.t('orq.action.retryNoContext'), 'retry-nostream': I18n.t('orq.action.retryNoStream'), 'open-params': I18n.t('orq.action.params') };
        const action = idx.actionKey && ACTION_MAP[idx.actionKey] ? idx.actionKey : null;
        if (action) Molecules.toast(text, 'error', { actionLabel: labels[action], onAction: ACTION_MAP[action], details: idx.technical });
        else Molecules.toast(text, 'error', { details: idx.technical });
    }

    let lastEnhance = null;
    function retryEnhance() {
        if (!lastEnhance) return;
        onEnhance(lastEnhance.btn, { skipParamsCheck: true, skipContext: false, forceNonStream: false, retryOfRunId: lastEnhance.runId || null });
    }
    function retryEnhanceNoContext() {
        if (!lastEnhance) return;
        onEnhance(lastEnhance.btn, { skipParamsCheck: true, skipContext: true, forceNonStream: false, retryOfRunId: lastEnhance.runId || null });
    }
    function retryEnhanceNoStream() {
        if (!lastEnhance) return;
        onEnhance(lastEnhance.btn, { skipParamsCheck: true, skipContext: false, forceNonStream: true, retryOfRunId: lastEnhance.runId || null });
    }

// Validação e reparo delegados aos módulos output-validator e repair-handler
// (globalThis.PE). Não há validação inline duplicada aqui.
async function _enhanceWithValidation(original, answersOrOpts, opts = {}) {
    let isGuided = Array.isArray(answersOrOpts);
    let answers = null;
    if (isGuided) {
        answers = answersOrOpts;
    } else {
        opts = answersOrOpts;
    }

    const handler = new globalThis.PE.RepairHandler();
    let enhanced;
    let validation;
    let analysis = null;
    let repaired = false;

    if (isGuided) {
        enhanced = await ApiClient.enhanceWithAnswers(original, answers, {
            ...opts,
            callKind: 'enhance-with-answers',
            attempt: 1
        });
    } else {
        const result = await ApiClient.enhance(original, opts);
        enhanced = result.prompt;
        analysis = result.analysis;
        validation = result.validation;
        repaired = result.repaired;
    }

    if (isGuided) {
        validation = globalThis.PE.validateOutput(original, enhanced);
    }

    if (!validation.valid && handler.canRepair()) {
        handler.recordRepair();
        const repairText = [
            'Previous attempt produced invalid output: ' + validation.violations.map(v => v.message || v.type).join('; '),
            'Reply with ONLY the enhanced prompt. No analysis, no meta-commentary.',
            'Original request:',
            original
        ].join('\n\n');

        const firstValidation = validation;
        const firstEnhanced = enhanced;

        if (isGuided) {
            enhanced = await ApiClient.enhanceWithAnswers(repairText, answers, {
                ...opts,
                callKind: 'repair',
                attempt: 2
            });
            validation = globalThis.PE.validateOutput(original, enhanced);
        } else {
            enhanced = await ApiClient.call(repairText, {
                ...opts,
                wrapUserContent: false,
                repairPrevious: enhanced,
                callKind: 'repair',
                attempt: 2
            });
            validation = globalThis.PE.validateOutput(original, enhanced);
        }

        // Melhor das duas tentativas: se o reparo piorou, volta à primeira versão
        if (validation.violations.length > firstValidation.violations.length) {
            enhanced = firstEnhanced;
            validation = firstValidation;
            repaired = false;
        } else {
            repaired = true;
        }
    }

    if (validation && validation.violations && validation.violations.length) {
        if (!analysis) analysis = {};
        analysis.validationWarning = validation.violations.map(v => v.message || v.type).join('; ');
    }

    return { enhanced, validation, analysis: analysis || null, repaired: repaired || false };
}

    async function onEnhance(btn, { skipParamsCheck = false, skipContext = false, forceNonStream = false, retryOfRunId = null } = {}) {
        if (State.isProcessing || State.isGuiding) return;
        const el = State.activeInput;
        if (!el) { Molecules.toast(I18n.t('orq.focusFirst'), 'error'); return; }
        const original = Utils.getText(el).trim();
        if (original.length < CONFIG.MIN_TEXT_LENGTH) { Molecules.toast(I18n.t('orq.tooShort'), 'error'); Anim.shake(btn); return; }
        const params = State.params || ParamSchema.load();
        if (!params || typeof params !== 'object') {
            Molecules.toast(I18n.t('orq.paramsFail'), 'error');
            return;
        }
        const activeFiles = ProjectContext.list().filter(f => f.enabled);
        const contextInfo = { activeCount: activeFiles.length, totalBytes: ProjectContext.getTotalSize(), enabled: ProjectContext.isEnabled() };
        const meta = {};
        if (retryOfRunId) meta.retryOfRunId = retryOfRunId;
        const runId = EnhancementHistory.startRun({ type: 'enhance', input: original, params, contextInfo, meta });
        const capturedRunId = runId;

        lastEnhance = { btn, el, original, runId };
        State.isProcessing = true;
        State.activeComposer?.actionbar.setBusy(true);
        closeAll();

        const overlay = Molecules.floatLoading({ onCancel: () => ApiClient.abort() });
        const overlayHandler = wireOverlayToEvents(overlay);
        overlay.setState('connecting');

        try {
            const { enhanced, validation, analysis } = await _enhanceWithValidation(original, {
                params, skipContext, forceNonStream,
                runId: capturedRunId,
                callKind: 'main',
                attempt: 1,
                onEvent: overlayHandler
            });
            overlay.setState('finalizing');
            await new Promise(r => setTimeout(r, 140));
            overlay.destroy();
            EnhancementHistory.endRun(capturedRunId, { status: 'success', output: enhanced, validation });
            State.preview = Molecules.preview({
                original, enhanced, anchor: getAnchor(), trigger: btn || el, analysis,
                onCancel: () => {
                    const run = EnhancementHistory.listRuns().find(r => r.id === capturedRunId);
                    if (run?.outcome !== 'applied') {
                        EnhancementHistory.setOutcome(capturedRunId, 'cancelled');
                    }
                    State.preview = null;
                },
                onApply: () => {
                    State.previousText = original;
                    _insertText(el, enhanced);
                    State.activeComposer?.actionbar.setUndoEnabled(true);
                    EnhancementHistory.setOutcome(capturedRunId, 'applied');
                    State.preview = null;
                    Molecules.toast(I18n.t('orq.enhanced'), 'success');
                }
            });
        } catch (err) {
            overlay.destroy();
            if (err.code === 'ABORTED') {
                EnhancementHistory.cancelRun(capturedRunId, { reason: 'aborted' });
            } else {
                Anim.shake(btn);
                EnhancementHistory.endRun(capturedRunId, { status: 'error', error: { code: err.code, message: err.message, meta: err.meta } });
            }
            handleEnhanceError(err);
        } finally {
            State.isProcessing = false;
            State.activeComposer?.actionbar.setBusy(false);
        }
    }

    async function onGuided(btn) {
        if (State.isProcessing || State.isGuiding) return;
        const el = State.activeInput;
        if (!el) { Molecules.toast(I18n.t('orq.focusFirst'), 'error'); return; }
        const base = Utils.getText(el).trim();
        if (base.length < CONFIG.MIN_TEXT_LENGTH) { Molecules.toast(I18n.t('orq.tooShort'), 'error'); Anim.shake(btn); return; }
        const params = State.params || ParamSchema.load();
        if (!params || typeof params !== 'object') {
            Molecules.toast(I18n.t('orq.paramsFail'), 'error');
            return;
        }

        State.isGuiding = true;
        State.activeComposer?.actionbar.setGuidedBusy(true, I18n.t('action.analyzing'));
        closeAll();

        const activeFiles = ProjectContext.list().filter(f => f.enabled);
        const contextInfo = { activeCount: activeFiles.length, totalBytes: ProjectContext.getTotalSize(), enabled: ProjectContext.isEnabled() };
        const runId = EnhancementHistory.startRun({ type: 'guided', input: base, params, contextInfo, meta: {} });
        const capturedRunId = runId;
        let wizardSubmitted = false;

        const questionsOverlay = Molecules.floatLoading({ onCancel: () => ApiClient.abort() });
        const questionsHandler = wireOverlayToEvents(questionsOverlay);
        questionsOverlay.setState('connecting');

        let questions;
        try {
            questions = await ApiClient.generateQuestions(base, {
                params,
                runId: capturedRunId,
                callKind: 'questions',
                attempt: 1,
                onEvent: questionsHandler
            });
        } catch (err) {
            questionsOverlay.destroy();
            if (err.code === 'ABORTED') {
                EnhancementHistory.cancelRun(capturedRunId, { reason: 'aborted' });
            } else {
                Anim.shake(btn);
                EnhancementHistory.endRun(capturedRunId, { status: 'error', error: { code: err.code, message: err.message, meta: err.meta } });
            }
            State.isGuiding = false;
            State.activeComposer?.actionbar.setGuidedBusy(false);
            handleEnhanceError(err);
            return;
        }
        questionsOverlay.setState('finalizing');
        await new Promise(r => setTimeout(r, 140));
        questionsOverlay.destroy();
        State.activeComposer?.actionbar.setGuidedBusy(false);

        State.wizard = Molecules.guidedWizard({
            questions, prompt: base, anchor: getAnchor(), trigger: btn || el,
            onCancel: () => {
                State.wizard = null;
                State.isGuiding = false;
                State.activeComposer?.actionbar.setGuidedBusy(false);
                if (!wizardSubmitted) EnhancementHistory.cancelRun(capturedRunId, { reason: 'wizard-cancelled' });
            },
            onSubmit: async (answers, { onEvent } = {}) => {
                wizardSubmitted = true;
                try {
                    const { enhanced, validation, analysis } = await _enhanceWithValidation(base, answers, {
                        params,
                        runId: capturedRunId,
                        callKind: 'enhance-with-answers',
                        attempt: 1,
                        onEvent
                    });
                    EnhancementHistory.endRun(capturedRunId, { status: 'success', output: enhanced, validation });
                    return {
                        onSuccess: () => {
                            State.wizard = null;
                            State.isGuiding = false;
                            State.preview = Molecules.preview({
                                original: base, enhanced, anchor: getAnchor(), trigger: btn || el, analysis,
                                onCancel: () => {
                                    const run = EnhancementHistory.listRuns().find(r => r.id === capturedRunId);
                                    if (run?.outcome !== 'applied') {
                                        EnhancementHistory.setOutcome(capturedRunId, 'cancelled');
                                    }
                                    State.preview = null;
                                },
                                onApply: () => {
                                    State.previousText = base;
                                    _insertText(el, enhanced);
                                    State.activeComposer?.actionbar.setUndoEnabled(true);
                                    EnhancementHistory.setOutcome(capturedRunId, 'applied');
                                    State.preview = null;
                                    Molecules.toast(I18n.t('orq.enhancedGuided'), 'success');
                                }
                            });
                        }
                    };
                } catch (err) {
                    State.isGuiding = false;
                    State.activeComposer?.actionbar.setGuidedBusy(false);
                    if (err.code === 'ABORTED') {
                        EnhancementHistory.cancelRun(capturedRunId, { reason: 'aborted' });
                    } else {
                        EnhancementHistory.endRun(capturedRunId, { status: 'error', error: { code: err.code, message: err.message, meta: err.meta } });
                    }
                    throw err;
                }
            }
        });
    }

    function onUndo() {
        const el = State.activeInput;
        if (!el || State.previousText == null) return;
        Utils.applyText(el, State.previousText);
        State.previousText = null;
        State.activeComposer?.actionbar.setUndoEnabled(false);
        Molecules.toast(I18n.t('orq.undone'), 'info');
    }

    const debouncedEnhance = Utils.debounce(() => { onEnhance(State.activeComposer?.actionbar.enhanceBtn); }, CONFIG.DEBOUNCE_MS);

    function onFocusIn(e) {
        const target = e.target;
        if (!Utils.isEditable(target) || target.disabled || target.readOnly) return;
        if (target.closest && target.closest('.pe-scope')) return;
        State.activeInput = target;
        const composerRoot = Composer.find(target);
        if (!composerRoot) return;
        if (Composer.isMounted(composerRoot) && State.activeComposer?.composer === composerRoot) return;
        State.activeComposer?.destroy();
        State.activeComposer = Composer.mount(target, {
            onEnhance: (b) => onEnhance(b),
            onGuided: (b) => onGuided(b),
            onParams: () => onParams(),
            onSettings: () => onSettings(),
            onUndo
        });
    }

    function onKeydown(e) {
        const inOurScope = e.target && e.target.closest && e.target.closest('.pe-scope');
        if (e.key === 'Escape') { if (State.preview) { e.preventDefault(); closePreview(); return; } if (State.wizard) { e.preventDefault(); closeWizard(); return; } }
        if (!inOurScope && e.ctrlKey && e.shiftKey && (e.key === 'e' || e.key === 'E')) { if (State.activeInput) { e.preventDefault(); debouncedEnhance(); } }
        if (!inOurScope && e.ctrlKey && e.shiftKey && (e.key === 'p' || e.key === 'P')) { if (State.activeComposer) { e.preventDefault(); onParams(); } }
        if (!inOurScope && e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S')) { if (State.activeComposer) { e.preventDefault(); onSettings(); } }
    }

    function observe() {
        const mo = new MutationObserver(() => {
            if (State.activeInput && !document.body.contains(State.activeInput)) {
                State.activeComposer?.destroy(); State.activeComposer = null; State.activeInput = null; closeAll();
            } else if (State.activeInput && State.activeComposer && !document.body.contains(State.activeComposer.composer)) {
                State.activeComposer = Composer.mount(State.activeInput, { onEnhance: (b) => onEnhance(b), onGuided: (b) => onGuided(b), onParams: () => onParams(), onSettings: () => onSettings(), onUndo });
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    function showErrorHistory() {
        const history = ErrorIndexer.history();
        if (!history.length) { alert(I18n.t('orq.noErrors')); return; }
        const lines = history.slice(0, 20).map((h, i) => {
            const date = I18n.formatDate(h.at);
            const status = h.status ? ` (HTTP ${h.status})` : '';
            return `${i + 1}. [${date}] ${h.code}${status} — ${h.title}\n   ${h.description}`;
        });
        const msg = `${I18n.t('orq.errorsCount', { n: history.length })}\n\n${lines.join('\n\n')}`;
        if (confirm(`${msg}\n\n${I18n.t('orq.clearErrorsConfirm')}`)) { ErrorIndexer.clearHistory(); alert(I18n.t('orq.errorsCleared')); }
    }

