// ===== src/molecules.js =====
    const Molecules = {
        codeAttachment, contextPopover, settingsModal,

        actionBar({ onEnhance, onGuided, onUndo, onParams, onSettings }) {
            const bar = document.createElement('div');
            bar.className = 'pe-actionbar';
            bar.setAttribute('role', 'toolbar');
            bar.setAttribute('aria-label', I18n.t('action.bar.aria'));

            const enhanceBtn = Atoms.button({ icon: 'sparkles', label: I18n.t('action.enhance'), ariaLabel: I18n.t('action.enhance.aria'), variant: 'primary', onClick: () => onEnhance(enhanceBtn) });
            const guidedBtn = Atoms.button({ icon: 'guide', label: I18n.t('action.guided'), ariaLabel: I18n.t('action.guided.aria'), variant: 'outline', onClick: () => onGuided(guidedBtn) });
            const contextBtn = Atoms.button({ icon: 'agentDoc', label: I18n.t('action.context'), ariaLabel: I18n.t('action.context.aria'), variant: 'ghost', onClick: () => contextPopoverInst?.toggle() });
            contextBtn.classList.add('pe-btn--agents');
            contextBtn.appendChild(Object.assign(document.createElement('span'), { className: 'pe-status-dot' }));

            let contextPopoverInst = Molecules.contextPopover({ anchor: contextBtn, onChange: () => refreshContextBtn() });
            function refreshContextBtn() {
                const active = ProjectContext.list().filter(f => f.enabled);
                const has = active.length > 0 && ProjectContext.isEnabled();
                contextBtn.classList.toggle('is-loaded', has);
                const lbl = contextBtn.querySelector('.pe-label');
                if (lbl) {
                    if (!has) lbl.textContent = I18n.t('action.context');
                    else if (active.length === 1) lbl.textContent = active[0].name;
                    else lbl.textContent = I18n.t('action.context.multi', { n: active.length });
                }
            }
            refreshContextBtn();

            const paramsBtn = Atoms.button({ icon: 'sliders', label: '', ariaLabel: I18n.t('action.params.aria'), variant: 'ghost', onClick: () => onParams?.(paramsBtn) });
            const settingsBtn = Atoms.button({ icon: 'gear', label: '', ariaLabel: I18n.t('action.settings.aria'), variant: 'ghost', onClick: () => onSettings?.(settingsBtn) });
            const undoBtn = Atoms.button({ icon: 'undo', label: '', ariaLabel: I18n.t('action.undo.aria'), variant: 'ghost', onClick: () => onUndo() });
            undoBtn.disabled = true;

            bar.appendChild(enhanceBtn);
            bar.appendChild(guidedBtn);

            const spacer = document.createElement('span');
            spacer.style.flex = '1 1 auto';
            bar.appendChild(spacer);

            bar.appendChild(contextBtn);
            bar.appendChild(paramsBtn);
            bar.appendChild(settingsBtn);
            bar.appendChild(undoBtn);

            const i18nRefresh = () => { const l = enhanceBtn.querySelector('.pe-label'); if (l && !enhanceBtn.classList.contains('is-loading')) l.textContent = I18n.t('action.enhance'); const g = guidedBtn.querySelector('.pe-label'); if (g && !guidedBtn.classList.contains('is-loading')) g.textContent = I18n.t('action.guided'); enhanceBtn.setAttribute('aria-label', I18n.t('action.enhance.aria')); guidedBtn.setAttribute('aria-label', I18n.t('action.guided.aria')); contextBtn.setAttribute('aria-label', I18n.t('action.context.aria')); paramsBtn.setAttribute('aria-label', I18n.t('action.params.aria')); settingsBtn.setAttribute('aria-label', I18n.t('action.settings.aria')); undoBtn.setAttribute('aria-label', I18n.t('action.undo.aria')); bar.setAttribute('aria-label', I18n.t('action.bar.aria')); refreshContextBtn(); };
            window.addEventListener('pe:i18n-changed', i18nRefresh);
            return {
                root: bar, enhanceBtn, guidedBtn, contextBtn, paramsBtn, settingsBtn,
                setBusy(isBusy) {
                    enhanceBtn.disabled = isBusy;
                    enhanceBtn.replaceChildren(Atoms.icon(isBusy ? 'loader' : 'sparkles', isBusy ? 'pe-spin' : ''));
                    const lbl = Object.assign(document.createElement('span'), { className: 'pe-label', textContent: isBusy ? I18n.t('action.enhancing') : I18n.t('action.enhance') });
                    enhanceBtn.appendChild(lbl);
                    enhanceBtn.setAttribute('aria-busy', String(!!isBusy));
                    enhanceBtn.classList.toggle('is-loading', !!isBusy);
                },
                setGuidedBusy(isBusy, customLabel) {
                    guidedBtn.disabled = isBusy;
                    guidedBtn.replaceChildren(Atoms.icon(isBusy ? 'loader' : 'guide', isBusy ? 'pe-spin' : ''));
                    const lbl = Object.assign(document.createElement('span'), { className: 'pe-label', textContent: customLabel || (isBusy ? I18n.t('action.analyzing') : I18n.t('action.guided')) });
                    guidedBtn.appendChild(lbl);
                    guidedBtn.setAttribute('aria-busy', String(!!isBusy));
                    guidedBtn.classList.toggle('is-loading', !!isBusy);
                },
                setUndoEnabled(enabled) { undoBtn.disabled = !enabled; },
                refreshContextBtn, refreshAgentsBtn: refreshContextBtn,
                destroy() { window.removeEventListener('pe:i18n-changed', i18nRefresh); try { contextPopoverInst?.destroy?.(); } catch (_) {} }
            };
        },

        loadingOverlay({ text = '', subtext = '' } = {}) {
            const root = document.createElement('div');
            root.className = 'pe-panel-loading pe-scope';
            root.setAttribute('role', 'status');
            root.setAttribute('aria-live', 'polite');
            root.dataset.state = 'connecting';

            root.innerHTML = `
                <div class="pe-panel-loading__card">
                    <div class="pe-panel-loading__halo" aria-hidden="true"></div>
                    <div class="pe-panel-loading__top">
                        <div class="pe-gear-wrap"><canvas data-gear width="48" height="48"></canvas></div>
                    </div>
                    <div class="pe-panel-loading__body">
                        <div class="pe-panel-loading__title-wrap">
                            <div class="pe-panel-loading__title" data-title>${I18n.t('lo.state.connecting.title')}</div>
                        </div>
                        <div class="pe-panel-loading__sub-wrap">
                            <div class="pe-panel-loading__sub" data-sub>
                                <span data-subtext>${I18n.t('lo.state.connecting.sub')}</span>
                                <span class="pe-dots" aria-hidden="true" data-dots><span></span><span></span><span></span></span>
                                <span class="pe-token-pill" data-tokpill hidden>${I18n.t('lo.tok0')}</span>
                                <span class="pe-retry-pill" data-retrypill hidden></span>
                            </div>
                        </div>
                    </div>
                    <div class="pe-shimmer" aria-hidden="true"></div>
                    <div class="pe-panel-loading__meta">
                        <div class="pe-panel-loading__meta-l">
                            <span class="pe-time">
                                <span class="pe-time__label">${I18n.t('lo.elapsed')}</span>
                                <span data-elapsed>0.0s</span>
                            </span>
                        </div>
                        <div class="pe-panel-loading__meta-r">
                            <button type="button" class="pe-debug-toggle" aria-expanded="false" data-dtoggle>
                                <span>${I18n.t('lo.details')}</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <button type="button" class="pe-cancel" data-cancel>${I18n.t('lo.cancel')}</button>
                        </div>
                    </div>
                    <div class="pe-debug" data-dpanel>
                        <div class="pe-debug__clip">
                            <div class="pe-debug__inner">
                                <div class="pe-debug__grid" data-dgrid></div>
                                <div class="pe-debug__log" data-dlog></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const titleEl = root.querySelector('[data-title]');
            const subtextEl = root.querySelector('[data-subtext]');
            const dotsEl = root.querySelector('[data-dots]');
            const tokPill = root.querySelector('[data-tokpill]');
            const retryPill = root.querySelector('[data-retrypill]');
            const elapsedEl = root.querySelector('[data-elapsed]');
            const elapsedLabelEl = root.querySelector('.pe-time__label');
            const debugToggle = root.querySelector('[data-dtoggle]');
            const debugPanel = root.querySelector('[data-dpanel]');
            const debugGrid = root.querySelector('[data-dgrid]');
            const debugLog = root.querySelector('[data-dlog]');
            const cancelBtn = root.querySelector('[data-cancel]');
            const gearCanvas = root.querySelector('[data-gear]');

            const METRIC_DEFS = [
                ['model', I18n.t('lo.metric.model')], ['endpoint', I18n.t('lo.metric.endpoint')],
                ['stream', I18n.t('lo.metric.stream')], ['timeout', I18n.t('lo.metric.timeout')],
                ['payload', I18n.t('lo.metric.payload')], ['attempt', I18n.t('lo.metric.attempt')],
                ['status', I18n.t('lo.metric.status')], ['bytes', I18n.t('lo.metric.bytes')],
                ['first_token', I18n.t('lo.metric.first_token')], ['tokens', I18n.t('lo.metric.tokens')],
                ['rate', I18n.t('lo.metric.rate')], ['retry', I18n.t('lo.metric.retry')]
            ];
            const metricEls = {};
            const metricKeyEls = {};
            METRIC_DEFS.forEach(([key, label]) => {
                const row = document.createElement('div');
                row.className = 'pe-debug__row';
                const k = document.createElement('span');
                k.className = 'pe-debug__key';
                k.textContent = label;
                const v = document.createElement('span');
                v.className = 'pe-debug__val is-muted';
                v.textContent = '—';
                row.appendChild(k); row.appendChild(v);
                debugGrid.appendChild(row);
                metricEls[key] = v;
                metricKeyEls[key] = k;
            });

            const getStateLabels = (state) => ({
                connecting: { title: I18n.t('lo.state.connecting.title'), sub: I18n.t('lo.state.connecting.sub') },
                preparing: { title: I18n.t('lo.state.preparing.title'), sub: I18n.t('lo.state.preparing.sub') },
                dispatching: { title: I18n.t('lo.state.dispatching.title'), sub: I18n.t('lo.state.dispatching.sub') },
                awaiting_ttfb: { title: I18n.t('lo.state.awaiting_ttfb.title'), sub: I18n.t('lo.state.awaiting_ttfb.sub') },
                awaiting_token: { title: I18n.t('lo.state.awaiting_token.title'), sub: I18n.t('lo.state.awaiting_token.sub') },
                waiting: { title: I18n.t('lo.state.waiting.title'), sub: I18n.t('lo.state.waiting.sub') },
                streaming: { title: I18n.t('lo.state.streaming.title'), sub: I18n.t('lo.state.streaming.sub') },
                finalizing: { title: I18n.t('lo.state.finalizing.title'), sub: I18n.t('lo.state.finalizing.sub') },
                retrying: { title: I18n.t('lo.state.retrying.title'), sub: I18n.t('lo.state.retrying.sub') }
            }[state] || { title: I18n.t('lo.state.connecting.title'), sub: I18n.t('lo.state.connecting.sub') });
            const PHASE_TO_STATE = {
                routing: 'connecting', connecting: 'connecting',
                preparing: 'preparing', dispatching: 'dispatching',
                awaiting_ttfb: 'awaiting_ttfb', awaiting_token: 'awaiting_token',
                waiting: 'waiting', streaming: 'streaming',
                finalizing: 'finalizing', retrying: 'retrying'
            };

            let startedAt = 0;
            let timer = null;
            let cancelFn = null;
            let firstTokenAt = 0;
            let tokenCount = 0;
            let gear = null;
            const events = [];
            let currentState = 'connecting';
            let warningCode = null;
            const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            let virtualTimer = null;
            let virtualStartTime = 0;
            let virtualStartProgress = 0;

            function tick() {
                if (!startedAt) return;
                const elapsed = (Date.now() - startedAt) / 1000;
                elapsedEl.textContent = elapsed >= 60
                    ? `${Math.floor(elapsed / 60)}m${Math.round(elapsed % 60)}s`
                    : elapsed.toFixed(1) + 's';
            }
            function startTimer() { if (timer) return; startedAt = Date.now(); timer = setInterval(tick, 100); tick(); }
            function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

            function startVirtualProgress(timeoutMs) {
                if (virtualTimer || reducedMotion || !gear) return;
                virtualStartTime = Date.now();
                virtualStartProgress = gear.getMorphProgress();
                const halfTimeout = timeoutMs / 2;
                virtualTimer = setInterval(() => {
                    const elapsed = Date.now() - virtualStartTime;
                    const t = Math.min(elapsed / halfTimeout, 1);
                    const progress = virtualStartProgress + (0.8 - virtualStartProgress) * t;
                    gear.setMorphProgress(progress);
                    if (t >= 1) { clearInterval(virtualTimer); virtualTimer = null; }
                }, 50);
            }
            function cancelVirtualProgress() {
                if (virtualTimer) { clearInterval(virtualTimer); virtualTimer = null; }
            }

            function applyStateLabels(state, opts = {}) {
                const labels = getStateLabels(state);
                let title = labels.title;
                let sub = labels.sub;
                if (state === 'retrying' && opts.backoffMs != null) {
                    sub = I18n.t('lo.retrySub', { s: (opts.backoffMs / 1000).toFixed(1) });
                }
                if (titleEl.textContent !== title) {
                    titleEl.classList.add('is-swapping');
                    setTimeout(() => {
                        titleEl.textContent = title;
                        titleEl.classList.remove('is-swapping');
                    }, 180);
                } else {
                    titleEl.textContent = title;
                }
                if (subtextEl.textContent !== sub) {
                    subtextEl.classList.add('is-swapping');
                    setTimeout(() => {
                        subtextEl.textContent = sub;
                        subtextEl.classList.remove('is-swapping');
                    }, 180);
                } else {
                    subtextEl.textContent = sub;
                }
                dotsEl.hidden = (state === 'streaming' || state === 'retrying');
                retryPill.hidden = (state !== 'retrying');
                if (state === 'retrying') {
                    const total = (opts.total != null) ? opts.total : (CONFIG.RETRY_MAX + 1);
                    const att = (opts.attempt != null) ? opts.attempt : 2;
                    retryPill.textContent = I18n.t('lo.attempt', { a: att, t: total });
                }
                if (state !== 'streaming' && state !== 'finalizing') tokPill.hidden = true;
            }

            function setState(state, opts = {}) {
                const s = PHASE_TO_STATE[state] || state;
                if (!PHASE_TO_STATE[s] && !['connecting','preparing','dispatching','awaiting_ttfb','awaiting_token','waiting','streaming','finalizing','retrying'].includes(s)) return;
                currentState = s;
                if (s === 'streaming' || s === 'finalizing' || s === 'retrying' || s === 'connecting') warningCode = null;
                root.dataset.state = s;
                if (gear) gear.setState(s);
                applyStateLabels(s, opts);
                if (s === 'streaming' && !firstTokenAt) {
                    firstTokenAt = Date.now();
                    if (startedAt) setMetric('first_token', ((firstTokenAt - startedAt) / 1000).toFixed(1) + 's', 'accent');
                }
            }

            function setMetric(key, val, tone = '') {
                const el = metricEls[key];
                if (!el) return;
                el.textContent = val;
                el.className = 'pe-debug__val' + (tone ? ' is-' + tone : '');
            }

            function logEvent(kind, detail = '', tone = '') {
                const t = startedAt ? (Date.now() - startedAt) / 1000 : 0;
                let cls = '';
                if (tone === 'err' || kind === 'error') cls = 'is-err';
                else if (tone === 'warn' || kind === 'retry_sched' || kind === 'warning') cls = 'is-warn';
                else if (tone === 'ok' || kind === 'first_byte' || kind === 'first_token' || kind === 'stream_done' || kind === 'redispatch') cls = 'is-ok';
                events.push({ t, kind, detail, cls });
                if (events.length > 12) events.shift();
                debugLog.innerHTML = events.map(ev => `<div class="pe-debug__log-line ${ev.cls}"><span class="pe-debug__log-time">${ev.t.toFixed(1)}s</span><span class="pe-debug__log-ev">${Utils.escapeHtml(ev.kind)}</span>${ev.detail ? `<span class="pe-debug__log-detail">${Utils.escapeHtml(ev.detail)}</span>` : ''}</div>`).join('');
                debugLog.scrollTop = debugLog.scrollHeight;
            }

            function ensureGear() {
                if (gear || !gearCanvas) return;
                gear = createGear(gearCanvas, currentState);
            }

            function applyWarningLabels(code) {
                if (code === 'NO_FIRST_BYTE') {
                    setMetric('status', I18n.t('lo.warn.awaitingFirstByte'), 'warn');
                    subtextEl.textContent = I18n.t('lo.warn.noResponse');
                } else if (code === 'STALL') {
                    setMetric('status', I18n.t('lo.warn.stalled'), 'warn');
                    subtextEl.textContent = I18n.t('lo.warn.noNewTokens');
                }
            }

            const i18nRefresh = () => {
                applyStateLabels(currentState);
                if (warningCode) applyWarningLabels(warningCode);
                const detailsSpan = debugToggle.querySelector('span');
                if (detailsSpan) detailsSpan.textContent = I18n.t('lo.details');
                if (!cancelBtn.disabled) cancelBtn.textContent = I18n.t('lo.cancel');
                if (elapsedLabelEl) elapsedLabelEl.textContent = I18n.t('lo.elapsed');
                if (tokPill.hidden) tokPill.textContent = I18n.t('lo.tok0');
                METRIC_DEFS.forEach(([key]) => {
                    const kEl = metricKeyEls[key];
                    if (kEl) kEl.textContent = I18n.t(`lo.metric.${key}`);
                });
            };

            function show() {
                if (!root.classList.contains('is-active')) {
                    root.classList.add('is-active');
                }
                ensureGear();
                startTimer();
                applyStateLabels(currentState);
                window.addEventListener('pe:i18n-changed', i18nRefresh);
            }

            function hide() {
                stopTimer();
                cancelVirtualProgress();
                root.classList.remove('is-active');
                window.removeEventListener('pe:i18n-changed', i18nRefresh);
                if (gear) { gear.destroy(); gear = null; }
            }

            debugToggle.addEventListener('click', () => {
                const open = debugToggle.getAttribute('aria-expanded') === 'true';
                debugToggle.setAttribute('aria-expanded', String(!open));
                debugPanel.classList.toggle('is-open', !open);
            });

            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (cancelBtn.disabled) return;
                cancelBtn.textContent = I18n.t('lo.cancelling');
                cancelBtn.disabled = true;
                try { if (cancelFn) cancelFn(); else ApiClient.abort(); } catch (_) {}
            });

            return {
                root,
                show,
                hide,
                setState,
                setPhase(p) { setState(PHASE_TO_STATE[p] || p); },
                setMetric,
                setMeta(meta) {
                    if (!meta) return;
                    if (meta.model) setMetric('model', meta.model);
                    if (meta.endpoint) {
                        const short = String(meta.endpoint).replace(/^https?:\/\//, '').replace(/\/.*$/, '/…');
                        setMetric('endpoint', short);
                    }
                    if (meta.stream != null) setMetric('stream', meta.stream ? 'ON' : 'OFF', meta.stream ? 'accent' : '');
                    if (meta.timeoutMs) setMetric('timeout', (meta.timeoutMs / 1000).toFixed(0) + 's');
                    if (meta.timeoutMs && !virtualTimer) startVirtualProgress(meta.timeoutMs);
                    if (meta.payloadKB) setMetric('payload', meta.payloadKB.toFixed(1) + ' KB');
                    if (meta.attempt != null) {
                        const total = CONFIG.RETRY_MAX + 1;
                        setMetric('attempt', `${meta.attempt} / ${total}`, meta.attempt > 1 ? 'warn' : '');
                    }
                },
                logEvent,
                attachStream({ tokens = 0, tokS = 0 } = {}) {
                    tokenCount = tokens;
                    if (!firstTokenAt && tokens > 0) firstTokenAt = Date.now();
                    if (tokens > 0) {
                        tokPill.hidden = false;
                        tokPill.textContent = `${tokens} tok`;
                        setMetric('tokens', String(tokens), 'accent');
                        if (tokS > 0) {
                            setMetric('rate', Math.round(tokS) + ' tok/s');
                        } else if (firstTokenAt > 0 && tokens > 1) {
                            const elapsedS = (Date.now() - firstTokenAt) / 1000;
                            if (elapsedS > 0.5) setMetric('rate', Math.round(tokens / elapsedS) + ' tok/s');
                        }
                    }
                },
                setEstimate() { /* no-op (indeterminate by design) */ },
                warn(code) {
                    logEvent('warning', '· ' + code, 'warn');
                    warningCode = code;
                    applyWarningLabels(code);
                },
                note(txt) { logEvent('note', '· ' + txt); },
                onCancel(fn) { cancelFn = fn; }
            };
        },

        panel({ title, anchor, ariaLabel, headerExtra, children, footer, onClose }) {
            const panel = document.createElement('div');
            panel.className = 'pe-panel pe-scope';
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-modal', 'false');
            panel.setAttribute('aria-label', ariaLabel || title);
            const header = document.createElement('div');
            header.className = 'pe-panel__header';
            const h4 = document.createElement('h4');
            h4.textContent = title;
            header.appendChild(h4);
            if (headerExtra) { const slot = document.createElement('div'); slot.className = 'pe-panel__header-extra'; slot.appendChild(headerExtra); header.appendChild(slot); }
            const close = document.createElement('button');
            close.type = 'button'; close.className = 'pe-panel__close';
            close.appendChild(Atoms.icon('x'));
            close.addEventListener('click', () => closeFn());
            header.appendChild(close);
            const body = document.createElement('div');
            body.className = 'pe-panel__body';
            if (children) body.appendChild(children);
            const footerEl = document.createElement('div');
            footerEl.className = 'pe-panel__footer';
            if (footer) footer.forEach(el => footerEl.appendChild(el));
            panel.appendChild(header); panel.appendChild(body); panel.appendChild(footerEl);
            const clip = document.createElement('div');
            clip.className = 'pe-inline-clip';
            clip.appendChild(panel);
            const slot = document.createElement('div');
            slot.className = 'pe-inline-slot';
            slot.appendChild(clip);
            Utils.shieldFromHost(slot);
            const parent = anchor?.parentElement;
            if (parent && parent.contains(anchor)) parent.insertBefore(slot, anchor);
            else document.body.appendChild(slot);
            requestAnimationFrame(() => { slot.classList.add('is-open'); Anim.panelIn(panel); });
            let closed = false;
            const closeFn = async (silent = false) => {
                if (closed) return;
                closed = true;
                slot.classList.remove('is-open');
                await Promise.all([Anim.panelOut(panel), new Promise(r => setTimeout(r, 300))]);
                slot.remove();
                if (!silent) onClose?.();
            };
            return { panel, body, footerEl, close: closeFn };
        },

        preview({ original, enhanced, anchor, onApply, onCancel, trigger }) {
            const prevActive = document.activeElement;
            let wasApplied = false;
            const body = document.createElement('div');
            body.innerHTML = `<div class="pe-field"><span class="pe-field-label">${Utils.escapeHtml(I18n.t('pv.original'))}</span><div class="pe-field-text">${Utils.escapeHtml(original)}</div></div><div class="pe-field"><span class="pe-field-label">${Utils.escapeHtml(I18n.t('pv.enhanced'))}</span><div class="pe-field-text" data-pe-stream>${Utils.escapeHtml(enhanced)}</div></div>`;
            const cancelBtn = Atoms.button({ icon: 'x', label: I18n.t('pv.cancel'), ariaLabel: I18n.t('pv.cancel'), variant: 'outline', onClick: () => handleCancel() });
            const applyBtn = Atoms.button({ icon: 'check', label: I18n.t('pv.apply'), ariaLabel: I18n.t('pv.apply'), variant: 'primary', onClick: () => handleApply() });
            const { panel, close } = Molecules.panel({ title: I18n.t('pv.title'), anchor, children: body, footer: [cancelBtn, applyBtn], onClose: () => { try { (trigger || prevActive)?.focus?.(); } catch (_) {} if (!wasApplied) onCancel?.(); } });
            Anim.staggerIn(body, 0.06);
            setTimeout(() => { const stream = panel.querySelector('[data-pe-stream]'); if (stream) Anim.typewriter(stream, { duration: 0.85 }); }, 180);
            function handleCancel() { close(); }
            function handleApply() { wasApplied = true; Anim.pulseSuccess(applyBtn); try { onApply?.(); } finally { close(); } }
            return { close: handleCancel, apply: handleApply };
        },

        promptBaseChip(prompt) {
            const root = document.createElement('div');
            root.className = 'pe-prompt-base';
            const wc = Utils.wordCount(prompt);
            root.innerHTML = `<button type="button" class="pe-prompt-base__trigger" aria-expanded="false">${Atoms.icon('doc', 'pe-prompt-base__icon').outerHTML}<span class="pe-prompt-base__label">${Utils.escapeHtml(I18n.t('pbc.label'))}</span><span class="pe-prompt-base__meta">${Utils.escapeHtml(Utils.truncate(prompt, 100))}</span><span class="pe-prompt-base__count">${wc} ${I18n.tPlural('pbc.word', wc, { one: I18n.t('pbc.word.one'), other: I18n.t('pbc.word.other') })}</span>${Atoms.icon('chevron', 'pe-prompt-base__chevron').outerHTML}</button><div class="pe-prompt-base__content"><div><div class="pe-prompt-base__text">${Utils.escapeHtml(prompt)}</div></div></div>`;
            root.querySelector('.pe-prompt-base__trigger').addEventListener('click', (e) => { e.preventDefault(); const expanded = root.classList.toggle('is-expanded'); root.querySelector('.pe-prompt-base__trigger').setAttribute('aria-expanded', String(expanded)); });
            return root;
        },

        contextIndicator() {
            const root = document.createElement('div');
            root.className = 'pe-agents-indicator';
            const i18nRefresh = () => refresh();
            window.addEventListener('pe:i18n-changed', i18nRefresh);
            function refresh() {
                root.innerHTML = '';
                if (!ProjectContext.hasContent() || !ProjectContext.isEnabled()) { root.style.display = 'none'; return; }
                root.style.display = 'flex';
                const active = ProjectContext.list().filter(f => f.enabled);
                const title = active.length === 1 ? active[0].name : I18n.tPlural('ci.files', active.length, { one: I18n.t('ci.files.one', { n: active.length }), other: I18n.t('ci.files.other', { n: active.length }) });
                root.innerHTML = `${Atoms.icon('check').outerHTML}<div class="pe-agents-indicator__body"><span class="pe-agents-indicator__title">${Utils.escapeHtml(title)}</span><span class="pe-agents-indicator__meta">${Utils.formatBytes(ProjectContext.getTotalSize())} · ${Utils.escapeHtml(I18n.t('ci.injected'))}</span></div>`;
            }
            refresh();
            return { root, refresh, destroy() { window.removeEventListener('pe:i18n-changed', i18nRefresh); } };
        },

        guidedWizard({ questions, prompt, anchor, trigger, onSubmit, onCancel }) {
            const prevActive = document.activeElement;
            const progressInline = document.createElement('div');
            progressInline.className = 'pe-progress-inline';
            progressInline.innerHTML = `<div class="pe-progress-track"><div class="pe-progress-fill"></div></div><span class="pe-progress-label">${I18n.t('gw.progress', { done: 0, total: questions.length })}</span>`;
            const progressFill = progressInline.querySelector('.pe-progress-fill');
            const progressLabel = progressInline.querySelector('.pe-progress-label');
            const bodyContent = document.createElement('div');
            const errorSlot = document.createElement('div');
            errorSlot.setAttribute('aria-live', 'assertive');
            const contextInd = Molecules.contextIndicator();
            const promptLabel = document.createElement('div');
            promptLabel.className = 'pe-section-label';
            promptLabel.innerHTML = `${Atoms.icon('doc').outerHTML}<span>${Utils.escapeHtml(I18n.t('gw.basePrompt'))}</span>`;
            const chip = Molecules.promptBaseChip(prompt);
            const questionsLabel = document.createElement('div');
            questionsLabel.className = 'pe-section-label';
            questionsLabel.innerHTML = `${Atoms.icon('guide').outerHTML}<span>${Utils.escapeHtml(I18n.t('gw.questionsLabel'))}</span>`;
            const list = document.createElement('div');
            bodyContent.appendChild(errorSlot); bodyContent.appendChild(contextInd.root);
            bodyContent.appendChild(promptLabel); bodyContent.appendChild(chip);
            bodyContent.appendChild(questionsLabel); bodyContent.appendChild(list);
            const state = new Map();
            questions.forEach(q => { state.set(q.id, { type: q.type, value: q.type === 'multi' ? null : '', values: q.type === 'multi' ? new Set() : null, freeActive: false, freeText: '', answered: false }); });
            const items = new Map();
            questions.forEach((q, idx) => {
                const qs = state.get(q.id);
                const item = document.createElement('div');
                item.className = 'pe-q-item';
                item.dataset.qid = q.id;
                if (idx === 0) item.classList.add('is-open');
                const header = document.createElement('button');
                header.type = 'button'; header.className = 'pe-q-header';
                header.setAttribute('aria-expanded', String(idx === 0));
                const num = document.createElement('span');
                num.className = 'pe-q-num';
                num.innerHTML = `<span>${idx + 1}</span><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>`;
                const main = document.createElement('div');
                main.className = 'pe-q-header-main';
                const text = document.createElement('div');
                text.className = 'pe-q-text';
                text.textContent = q.question || I18n.t('gw.question', { n: idx + 1 });
                main.appendChild(text);
                const hint = document.createElement('span');
                if (q.allowCode) { hint.className = 'pe-q-hint pe-q-hint--code'; hint.innerHTML = `${Atoms.icon('codeSpark').outerHTML}<span>${Utils.escapeHtml(I18n.t('gw.codeHint'))}</span>`; }
                else { hint.className = 'pe-q-hint'; hint.textContent = q.type === 'multi' ? I18n.t('gw.hint.multi') : (q.type === 'choice' ? I18n.t('gw.hint.choice') : I18n.t('gw.hint.text')); }
                main.appendChild(hint);
                const summary = document.createElement('span');
                summary.className = 'pe-q-summary';
                summary.innerHTML = `${Utils.escapeHtml(I18n.t('gw.answer'))} <span class="pe-q-summary__value">—</span>`;
                const summaryValue = summary.querySelector('.pe-q-summary__value');
                main.appendChild(summary);
                const chevron = Atoms.icon('chevronD');
                chevron.setAttribute('class', 'pe-q-chevron');
                header.appendChild(num); header.appendChild(main); header.appendChild(chevron);
                header.addEventListener('click', () => { const isOpen = item.classList.toggle('is-open'); header.setAttribute('aria-expanded', String(isOpen)); });
                const content = document.createElement('div');
                content.className = 'pe-q-content';
                const contentInnerWrap = document.createElement('div');
                const contentInner = document.createElement('div');
                contentInner.className = 'pe-q-content-inner';
                const group = document.createElement('div');
                group.className = 'pe-options-group';
                if (q.type === 'choice' && Array.isArray(q.options)) {
                    group.setAttribute('role', 'radiogroup');
                    q.options.forEach(opt => {
                        const lab = document.createElement('label');
                        lab.className = 'pe-option';
                        lab.innerHTML = `<span class="pe-radio"></span><span>${Utils.escapeHtml(opt)}</span>`;
                        lab.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); group.querySelectorAll('.pe-option').forEach(o => o.classList.remove('is-checked')); lab.classList.add('is-checked'); qs.value = String(opt); qs.freeActive = false; setAnswered(q, qs, String(opt), { collapse: true }); });
                        group.appendChild(lab);
                    });
                    group.appendChild(Object.assign(document.createElement('div'), { className: 'pe-options-divider', innerHTML: `<span>${Utils.escapeHtml(I18n.t('gw.or'))}</span>` }));
                    group.appendChild(buildFreeText({ q, qs, kind: 'radio', items, onActivate: () => { qs.freeActive = true; qs.value = ''; group.querySelectorAll('.pe-option').forEach(o => o.classList.remove('is-checked')); }, onInput: (v) => { qs.freeText = v; if (v) setAnswered(q, qs, v, { collapse: false }); else if (!qs.value) unsetAnswered(q, qs); } }));
                } else if (q.type === 'multi' && Array.isArray(q.options)) {
                    group.setAttribute('role', 'group');
                    q.options.forEach(opt => {
                        const lab = document.createElement('label');
                        lab.className = 'pe-option';
                        lab.innerHTML = `<span class="pe-checkbox"></span><span>${Utils.escapeHtml(opt)}</span>`;
                        lab.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); lab.classList.toggle('is-checked'); if (lab.classList.contains('is-checked')) qs.values.add(String(opt)); else qs.values.delete(String(opt)); updateMultiAnswer(q, qs); });
                        group.appendChild(lab);
                    });
                    group.appendChild(Object.assign(document.createElement('div'), { className: 'pe-options-divider', innerHTML: `<span>${Utils.escapeHtml(I18n.t('gw.andOr'))}</span>` }));
                    group.appendChild(buildFreeText({ q, qs, kind: 'checkbox', items, onActivate: () => { qs.freeActive = true; }, onInput: (v) => { qs.freeText = v; updateMultiAnswer(q, qs); } }));
                } else {
                    const ta = document.createElement('textarea');
                    ta.className = 'pe-textarea'; ta.rows = 2;
                    ta.placeholder = q.placeholder || I18n.t('gw.yourAnswer');
                    ta.addEventListener('input', () => { qs.value = ta.value.trim(); if (qs.value) setAnswered(q, qs, qs.value, { collapse: false }); else unsetAnswered(q, qs); });
                    ta.addEventListener('click', (e) => e.stopPropagation());
                    group.appendChild(ta);
                }
                contentInner.appendChild(group);
                let codeAttach = null;
                if (q.allowCode === true) {
                    codeAttach = Molecules.codeAttachment({ q, onUpdate: () => {} });
                    contentInner.appendChild(codeAttach.root);
                    if (idx === 0) codeAttach.show();
                }
                contentInnerWrap.appendChild(contentInner);
                content.appendChild(contentInnerWrap);
                item.appendChild(header); item.appendChild(content);
                list.appendChild(item);
                items.set(q.id, { item, header, summaryValue, qs, codeAttach });
            });
            function updateMultiAnswer(q, qs) { const arr = Array.from(qs.values); if (qs.freeText) arr.push(`"${qs.freeText}"`); if (arr.length) setAnswered(q, qs, arr.join(', '), { collapse: false }); else unsetAnswered(q, qs); }
            function setAnswered(q, qs, displayValue, opts = {}) { const ref = items.get(q.id); if (!ref) return; qs.answered = true; ref.item.classList.add('is-answered'); ref.summaryValue.textContent = displayValue; if (opts.collapse === true) { setTimeout(() => { if (ref.item.classList.contains('is-open')) { ref.item.classList.remove('is-open'); ref.header.setAttribute('aria-expanded', 'false'); } }, CONFIG.AUTO_COLLAPSE_DELAY); } updateProgress(); }
            function unsetAnswered(q, qs) { const ref = items.get(q.id); if (!ref) return; qs.answered = false; ref.item.classList.remove('is-answered'); ref.summaryValue.textContent = '—'; updateProgress(); }
            function updateProgress() {
                let done = 0;
                for (const q of questions) {
                    const qs = state.get(q.id);
                    if (!qs) continue;
                    if (q.type === 'multi') { if (qs.values.size > 0 || qs.freeText) done++; }
                    else { if (qs.value || (qs.freeActive && qs.freeText)) done++; }
                }
                progressLabel.textContent = I18n.t('gw.progress', { done, total: questions.length });
                progressFill.style.width = `${(done / questions.length) * 100}%`;
                submitBtn.disabled = done < questions.length;
            }
            function buildFreeText({ q, qs, kind, items, onActivate, onInput }) {
                const wrap = document.createElement('div');
                wrap.className = 'pe-free-text';
                wrap.innerHTML = `<label class="pe-free-text__row"><span class="${kind === 'radio' ? 'pe-radio' : 'pe-checkbox'}"></span><span class="pe-free-text__label">${Utils.escapeHtml(kind === 'radio' ? I18n.t('gw.noneRadio') : I18n.t('gw.noneCheck'))}</span></label><div class="pe-free-text__input-wrap"><div><input type="text" class="pe-free-text__input" placeholder="${Utils.escapeHtml(kind === 'radio' ? I18n.t('gw.typeAnswer') : I18n.t('gw.multiPlaceholder'))}"></div></div>`;
                const row = wrap.querySelector('.pe-free-text__row');
                const input = wrap.querySelector('.pe-free-text__input');
                row.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const isActive = wrap.classList.toggle('is-active');
                    if (isActive) { onActivate?.(); setTimeout(() => input.focus(), 220); }
                    else { qs.freeActive = false; qs.freeText = ''; input.value = ''; if (!qs.value) unsetAnswered(q, qs); }
                });
                input.addEventListener('input', () => onInput?.(input.value.trim()));
                input.addEventListener('click', (e) => e.stopPropagation());
                return wrap;
            }
            let allExpanded = false;
            const expandAllBtn = Atoms.buttonNode({ label: I18n.t('gw.expandAll'), ariaLabel: I18n.t('gw.expandAria'), variant: 'ghost', onClick: (btn) => { allExpanded = !allExpanded; items.forEach(({ item, header }) => { item.classList.toggle('is-open', allExpanded); header.setAttribute('aria-expanded', String(allExpanded)); }); btn.querySelector('.pe-label').textContent = allExpanded ? I18n.t('gw.collapseAll') : I18n.t('gw.expandAll'); } });
            expandAllBtn.classList.add('pe-panel__expand');
            const actions = document.createElement('div');
            actions.className = 'pe-panel__actions';
            const cancelBtn = Atoms.button({ icon: 'x', label: I18n.t('pv.cancel'), ariaLabel: I18n.t('pv.cancel'), variant: 'outline', onClick: () => handleCancel() });
            const submitBtn = Atoms.button({ icon: 'arrow', label: I18n.t('gw.generate'), ariaLabel: I18n.t('gw.generateAria'), variant: 'primary', onClick: () => handleSubmit() });
            submitBtn.disabled = true;
            actions.appendChild(cancelBtn); actions.appendChild(submitBtn);
            const { panel, close } = Molecules.panel({ title: I18n.t('gw.title'), anchor, headerExtra: progressInline, children: bodyContent, footer: [expandAllBtn, actions], onClose: () => { try { contextInd.destroy(); } catch (_) {} try { (trigger || prevActive)?.focus?.(); } catch (_) {} onCancel?.(); } });
            const loading = Molecules.loadingOverlay({});
            panel.appendChild(loading.root);
            const loadingHandler = wireOverlayToEvents(loading);
            let closed = false;
            const animateOut = async (cb) => { if (closed) return; closed = true; contextInd.destroy(); await close(true); try { (trigger || prevActive)?.focus?.(); } catch (_) {} cb?.(); };
            const handleCancel = () => { if (closed) return; closed = true; contextInd.destroy(); close(); };
            async function handleSubmit() {
                const payload = [];
                let incomplete = false;
                for (const q of questions) {
                    const ref = items.get(q.id);
                    const qs = state.get(q.id);
                    if (!qs || !ref) continue;
                    let value = null;
                    if (q.type === 'multi') { const arr = Array.from(qs.values); if (qs.freeText) arr.push(qs.freeText); if (!arr.length) { incomplete = true; break; } value = arr; }
                    else if (q.type === 'choice') { if (qs.freeActive && qs.freeText) value = qs.freeText; else if (qs.value) value = qs.value; else { incomplete = true; break; } }
                    else { if (!qs.value) { incomplete = true; break; } value = qs.value; }
                    const entry = { id: q.id, question: q.question, type: q.type, value };
                    if (ref.codeAttach) { const cv = ref.codeAttach.getValue(); if (cv) { entry.codeContext = cv.code; entry.codeLanguage = cv.language; entry.files = cv.files; } }
                    payload.push(entry);
                }
                if (incomplete || closed) return;
                errorSlot.innerHTML = '';
                submitBtn.disabled = true;
                submitBtn.classList.add('is-loading');
                loading.setState('connecting');
                loading.show();
                try {
                    const result = await onSubmit?.(payload, { onEvent: loadingHandler });
                    loading.setState('finalizing');
                    await new Promise(r => setTimeout(r, 140));
                    loading.hide();
                    await animateOut(() => { result?.onSuccess?.(); });
                } catch (err) {
                    submitBtn.classList.remove('is-loading');
                    submitBtn.disabled = false;
                    loading.hide();
                    Anim.shake(panel);
                    if (err && err.code === 'ABORTED') return;
                    const idx = ErrorIndexer.classify(err);
                    ErrorIndexer.record(err);
                    const box = document.createElement('div');
                    box.className = 'pe-panel-error';
                    const title = document.createElement('div');
                    title.className = 'pe-panel-error__title';
                    title.textContent = idx.title;
                    const desc = document.createElement('div');
                    desc.className = 'pe-panel-error__desc';
                    desc.textContent = idx.description;
                    box.appendChild(title); box.appendChild(desc);
                    const details = document.createElement('details');
                    details.className = 'pe-panel-error__details';
                    const sum = document.createElement('summary');
                    sum.textContent = I18n.t('gw.details');
                    const pre = document.createElement('pre');
                    pre.textContent = JSON.stringify({ code: idx.code, ...idx.technical }, null, 2);
                    details.appendChild(sum); details.appendChild(pre);
                    box.appendChild(details);
                    errorSlot.appendChild(box);
                    Anim.fadeIn(box, { duration: 0.28 });
                    if (err instanceof NetError && err.retryable) Molecules.toast(`${idx.title}\n${idx.description}`, 'error', { actionLabel: I18n.t('gw.retry'), onAction: () => handleSubmit(), details: idx.technical });
                    else Molecules.toast(`${idx.title}\n${idx.description}`, 'error', { details: idx.technical });
                }
            }
            updateProgress();
            return { close: handleCancel };
        },

        toast(message, type = 'info', { actionLabel, onAction, timeout = 3600, details = null } = {}) {
            const t = document.createElement('div');
            t.className = 'pe-toast pe-scope' + (type === 'error' ? ' is-error' : type === 'success' ? ' is-success' : '');
            if (actionLabel && typeof onAction === 'function') t.classList.add('has-action');
            if (details) t.classList.add('has-details');
            t.setAttribute('role', type === 'error' ? 'alert' : 'status');
            t.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
            const row = document.createElement('div');
            row.className = 'pe-toast__row';
            const msg = document.createElement('span');
            msg.className = 'pe-toast__msg';
            const lines = String(message).split('\n').filter(Boolean);
            if (lines.length <= 1) msg.textContent = message;
            else {
                msg.classList.add('is-multiline');
                lines.forEach((line, i) => {
                    const s = document.createElement('span');
                    s.className = i === 0 ? 'pe-toast__line pe-toast__line--headline' : 'pe-toast__line pe-toast__line--detail';
                    s.textContent = line;
                    msg.appendChild(s);
                });
            }
            row.appendChild(msg);
            let finalTimeout = timeout;
            if (lines.length > 1 || details) finalTimeout = Math.max(finalTimeout, 8000);
            if (actionLabel && typeof onAction === 'function') {
                const btn = document.createElement('button');
                btn.type = 'button'; btn.className = 'pe-toast__action';
                btn.textContent = actionLabel;
                btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); try { onAction(); } finally { Anim.toastOut(t); } });
                row.appendChild(btn);
                finalTimeout = Math.max(finalTimeout, 8000);
            }
            t.appendChild(row);
            if (details) {
                const d = document.createElement('details');
                d.className = 'pe-toast__details';
                const sum = document.createElement('summary');
                sum.textContent = I18n.t('toast.details');
                const pre = document.createElement('pre');
                pre.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
                d.appendChild(sum); d.appendChild(pre);
                t.appendChild(d);
            }
            document.body.appendChild(t);
            Anim.toastIn(t);
            setTimeout(() => Anim.toastOut(t), finalTimeout);
            if (document.hidden && typeof GM_notification === 'function') { try { GM_notification({ text: message, title: 'Prompt-Enhancer', timeout: 3000 }); } catch (_) {} }
        },

        floatLoading({ onCancel } = {}) {
            const wrap = document.createElement('div');
            wrap.className = 'pe-float-wrap pe-scope';
            const overlay = Molecules.loadingOverlay({});
            overlay.root.classList.add('is-float');
            wrap.appendChild(overlay.root);
            document.body.appendChild(wrap);
            Anim.toastIn(wrap);
            overlay.onCancel(onCancel);
            overlay.show();
            return {
                wrap,
                setState: (s, o) => overlay.setState(s, o),
                setPhase: (p) => overlay.setPhase(p),
                setMeta: (m) => overlay.setMeta(m),
                setMetric: (k, v, t) => overlay.setMetric(k, v, t),
                logEvent: (k, d, t) => overlay.logEvent(k, d, t),
                attachStream: (o) => overlay.attachStream(o),
                setEstimate: () => {},
                warn: (c) => overlay.warn(c),
                note: (t) => overlay.note(t),
                destroy: () => { overlay.hide(); setTimeout(() => wrap.remove(), 240); }
            };
        }
    };
