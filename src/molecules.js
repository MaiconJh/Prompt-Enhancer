// ===== src/molecules.js =====
    const Molecules = {
        codeAttachment, contextPopover, settingsModal,

        actionBar({ onEnhance, onGuided, onUndo, onParams, onSettings }) {
            const bar = document.createElement('div');
            bar.className = 'kpe-actionbar';
            bar.setAttribute('role', 'toolbar');
            bar.setAttribute('aria-label', 'Ações do prompt');

            const enhanceBtn = Atoms.button({ icon: 'sparkles', label: 'Aprimorar', ariaLabel: 'Aprimorar prompt', variant: 'primary', onClick: () => onEnhance(enhanceBtn) });
            const guidedBtn = Atoms.button({ icon: 'guide', label: 'Guiado', ariaLabel: 'Iniciar aprimoramento guiado', variant: 'outline', onClick: () => onGuided(guidedBtn) });
            const contextBtn = Atoms.button({ icon: 'agentDoc', label: 'Contexto', ariaLabel: 'Gerenciar arquivos de contexto', variant: 'ghost', onClick: () => contextPopoverInst?.toggle() });
            contextBtn.classList.add('kpe-btn--agents');
            contextBtn.appendChild(Object.assign(document.createElement('span'), { className: 'kpe-status-dot' }));

            let contextPopoverInst = Molecules.contextPopover({ anchor: contextBtn, onChange: () => refreshContextBtn() });
            function refreshContextBtn() {
                const active = ProjectContext.list().filter(f => f.enabled);
                const has = active.length > 0 && ProjectContext.isEnabled();
                contextBtn.classList.toggle('is-loaded', has);
                const lbl = contextBtn.querySelector('.kpe-label');
                if (lbl) {
                    if (!has) lbl.textContent = 'Contexto';
                    else if (active.length === 1) lbl.textContent = active[0].name;
                    else lbl.textContent = `Contexto (${active.length})`;
                }
            }
            refreshContextBtn();

            const paramsBtn = Atoms.button({ icon: 'sliders', label: 'Parâmetros', ariaLabel: 'Configurar parâmetros de geração', variant: 'ghost', onClick: () => onParams?.(paramsBtn) });
            const settingsBtn = Atoms.button({ icon: 'gear', label: 'Config', ariaLabel: 'Abrir configurações (histórico, parâmetros, contexto)', variant: 'ghost', onClick: () => onSettings?.(settingsBtn) });
            const undoBtn = Atoms.button({ icon: 'undo', label: 'Desfazer', ariaLabel: 'Desfazer último aprimoramento', variant: 'ghost', onClick: () => onUndo() });
            undoBtn.disabled = true;

            bar.appendChild(enhanceBtn);
            bar.appendChild(guidedBtn);
            bar.appendChild(contextBtn);
            bar.appendChild(paramsBtn);
            bar.appendChild(settingsBtn);
            bar.appendChild(undoBtn);

            return {
                root: bar, enhanceBtn, guidedBtn, contextBtn, paramsBtn, settingsBtn,
                setBusy(isBusy) {
                    enhanceBtn.disabled = isBusy;
                    enhanceBtn.replaceChildren(Atoms.icon(isBusy ? 'loader' : 'sparkles', isBusy ? 'kpe-spin' : ''));
                    const lbl = Object.assign(document.createElement('span'), { className: 'kpe-label', textContent: isBusy ? 'Aprimorando…' : 'Aprimorar' });
                    enhanceBtn.appendChild(lbl);
                    enhanceBtn.setAttribute('aria-busy', String(!!isBusy));
                    enhanceBtn.classList.toggle('is-loading', !!isBusy);
                },
                setGuidedBusy(isBusy, customLabel) {
                    guidedBtn.disabled = isBusy;
                    guidedBtn.replaceChildren(Atoms.icon(isBusy ? 'loader' : 'guide', isBusy ? 'kpe-spin' : ''));
                    const lbl = Object.assign(document.createElement('span'), { className: 'kpe-label', textContent: customLabel || (isBusy ? 'Analisando…' : 'Guiado') });
                    guidedBtn.appendChild(lbl);
                    guidedBtn.setAttribute('aria-busy', String(!!isBusy));
                    guidedBtn.classList.toggle('is-loading', !!isBusy);
                },
                setUndoEnabled(enabled) { undoBtn.disabled = !enabled; },
                refreshContextBtn, refreshAgentsBtn: refreshContextBtn,
                destroy() { try { contextPopoverInst?.destroy?.(); } catch (_) {} }
            };
        },

        loadingOverlay({ text = '', subtext = '' } = {}) {
            const root = document.createElement('div');
            root.className = 'kpe-panel-loading kpe-scope';
            root.setAttribute('role', 'status');
            root.setAttribute('aria-live', 'polite');
            root.dataset.state = 'connecting';

            root.innerHTML = `
                <div class="kpe-panel-loading__card">
                    <div class="kpe-panel-loading__halo" aria-hidden="true"></div>
                    <div class="kpe-panel-loading__top">
                        <div class="kpe-gear-wrap"><canvas data-gear width="48" height="48"></canvas></div>
                    </div>
                    <div class="kpe-panel-loading__body">
                        <div class="kpe-panel-loading__title-wrap">
                            <div class="kpe-panel-loading__title" data-title>Conectando</div>
                        </div>
                        <div class="kpe-panel-loading__sub-wrap">
                            <div class="kpe-panel-loading__sub" data-sub>
                                <span data-subtext>Estabelecendo conexão</span>
                                <span class="kpe-dots" aria-hidden="true" data-dots><span></span><span></span><span></span></span>
                                <span class="kpe-token-pill" data-tokpill hidden>0 tok</span>
                                <span class="kpe-retry-pill" data-retrypill hidden></span>
                            </div>
                        </div>
                    </div>
                    <div class="kpe-shimmer" aria-hidden="true"></div>
                    <div class="kpe-panel-loading__meta">
                        <div class="kpe-panel-loading__meta-l">
                            <span class="kpe-time">
                                <span class="kpe-time__label">decorrido</span>
                                <span data-elapsed>0.0s</span>
                            </span>
                        </div>
                        <div class="kpe-panel-loading__meta-r">
                            <button type="button" class="kpe-debug-toggle" aria-expanded="false" data-dtoggle>
                                <span>detalhes</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <button type="button" class="kpe-cancel" data-cancel>Cancelar</button>
                        </div>
                    </div>
                    <div class="kpe-debug" data-dpanel>
                        <div class="kpe-debug__clip">
                            <div class="kpe-debug__inner">
                                <div class="kpe-debug__grid" data-dgrid></div>
                                <div class="kpe-debug__log" data-dlog></div>
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
            const debugToggle = root.querySelector('[data-dtoggle]');
            const debugPanel = root.querySelector('[data-dpanel]');
            const debugGrid = root.querySelector('[data-dgrid]');
            const debugLog = root.querySelector('[data-dlog]');
            const cancelBtn = root.querySelector('[data-cancel]');
            const gearCanvas = root.querySelector('[data-gear]');

            const METRIC_DEFS = [
                ['model', 'Modelo'], ['endpoint', 'Endpoint'],
                ['stream', 'Stream'], ['timeout', 'Timeout'],
                ['payload', 'Payload'], ['attempt', 'Tentativa'],
                ['status', 'Status'], ['bytes', 'Bytes'],
                ['first_token', '1º token'], ['tokens', 'Tokens'],
                ['rate', 'Taxa'], ['retry', 'Retry']
            ];
            const metricEls = {};
            METRIC_DEFS.forEach(([key, label]) => {
                const row = document.createElement('div');
                row.className = 'kpe-debug__row';
                const k = document.createElement('span');
                k.className = 'kpe-debug__key';
                k.textContent = label;
                const v = document.createElement('span');
                v.className = 'kpe-debug__val is-muted';
                v.textContent = '—';
                row.appendChild(k); row.appendChild(v);
                debugGrid.appendChild(row);
                metricEls[key] = v;
            });

            const STATE_LABELS = {
                connecting: { title: 'Conectando', sub: 'Estabelecendo conexão' },
                waiting: { title: 'Aguardando dados', sub: 'Nenhum byte recebido ainda' },
                streaming: { title: 'Recebendo conteúdo', sub: 'Tokens chegando' },
                finalizing: { title: 'Processando resultado', sub: 'Preparando saída' },
                retrying: { title: 'Retentando', sub: 'Falha de rede · backoff' }
            };
            const PHASE_TO_STATE = {
                routing: 'connecting', connecting: 'connecting',
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

            function tick() {
                if (!startedAt) return;
                const elapsed = (Date.now() - startedAt) / 1000;
                elapsedEl.textContent = elapsed >= 60
                    ? `${Math.floor(elapsed / 60)}m${Math.round(elapsed % 60)}s`
                    : elapsed.toFixed(1) + 's';
            }
            function startTimer() { if (timer) return; startedAt = Date.now(); timer = setInterval(tick, 100); tick(); }
            function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

            function applyStateLabels(state, opts = {}) {
                const labels = STATE_LABELS[state] || STATE_LABELS.connecting;
                let title = labels.title;
                let sub = labels.sub;
                if (state === 'retrying' && opts.backoffMs != null) {
                    sub = `Falha de rede · backoff ${(opts.backoffMs / 1000).toFixed(1)}s`;
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
                    retryPill.textContent = `tentativa ${att} / ${total}`;
                }
                if (state !== 'streaming' && state !== 'finalizing') tokPill.hidden = true;
            }

            function setState(state, opts = {}) {
                const s = PHASE_TO_STATE[state] || state;
                if (!STATE_LABELS[s]) return;
                currentState = s;
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
                el.className = 'kpe-debug__val' + (tone ? ' is-' + tone : '');
            }

            function logEvent(kind, detail = '', tone = '') {
                const t = startedAt ? (Date.now() - startedAt) / 1000 : 0;
                let cls = '';
                if (tone === 'err' || kind === 'error') cls = 'is-err';
                else if (tone === 'warn' || kind === 'retry_sched' || kind === 'warning') cls = 'is-warn';
                else if (tone === 'ok' || kind === 'first_byte' || kind === 'first_token' || kind === 'stream_done' || kind === 'redispatch') cls = 'is-ok';
                events.push({ t, kind, detail, cls });
                if (events.length > 12) events.shift();
                debugLog.innerHTML = events.map(ev => `<div class="kpe-debug__log-line ${ev.cls}"><span class="kpe-debug__log-time">${ev.t.toFixed(1)}s</span><span class="kpe-debug__log-ev">${Utils.escapeHtml(ev.kind)}</span>${ev.detail ? `<span class="kpe-debug__log-detail">${Utils.escapeHtml(ev.detail)}</span>` : ''}</div>`).join('');
                debugLog.scrollTop = debugLog.scrollHeight;
            }

            function ensureGear() {
                if (gear || !gearCanvas) return;
                gear = createGear(gearCanvas, currentState);
            }

            function show() {
                if (!root.classList.contains('is-active')) {
                    root.classList.add('is-active');
                }
                ensureGear();
                startTimer();
                applyStateLabels(currentState);
            }

            function hide() {
                stopTimer();
                root.classList.remove('is-active');
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
                cancelBtn.textContent = 'Cancelando…';
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
                    if (code === 'NO_FIRST_BYTE') {
                        setMetric('status', 'aguardando 1º byte', 'warn');
                        subtextEl.textContent = 'Servidor ainda não respondeu';
                    } else if (code === 'STALL') {
                        setMetric('status', 'streaming estagnado', 'warn');
                        subtextEl.textContent = 'Sem novos tokens há alguns segundos';
                    }
                },
                note(txt) { logEvent('note', '· ' + txt); },
                onCancel(fn) { cancelFn = fn; }
            };
        },

        panel({ title, anchor, ariaLabel, headerExtra, children, footer, onClose }) {
            const panel = document.createElement('div');
            panel.className = 'kpe-panel kpe-scope';
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-modal', 'false');
            panel.setAttribute('aria-label', ariaLabel || title);
            const header = document.createElement('div');
            header.className = 'kpe-panel__header';
            const h4 = document.createElement('h4');
            h4.textContent = title;
            header.appendChild(h4);
            if (headerExtra) { const slot = document.createElement('div'); slot.className = 'kpe-panel__header-extra'; slot.appendChild(headerExtra); header.appendChild(slot); }
            const close = document.createElement('button');
            close.type = 'button'; close.className = 'kpe-panel__close';
            close.appendChild(Atoms.icon('x'));
            close.addEventListener('click', () => closeFn());
            header.appendChild(close);
            const body = document.createElement('div');
            body.className = 'kpe-panel__body';
            if (children) body.appendChild(children);
            const footerEl = document.createElement('div');
            footerEl.className = 'kpe-panel__footer';
            if (footer) footer.forEach(el => footerEl.appendChild(el));
            panel.appendChild(header); panel.appendChild(body); panel.appendChild(footerEl);
            const clip = document.createElement('div');
            clip.className = 'kpe-inline-clip';
            clip.appendChild(panel);
            const slot = document.createElement('div');
            slot.className = 'kpe-inline-slot';
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
            const body = document.createElement('div');
            body.innerHTML = `<div class="kpe-field"><span class="kpe-field-label">Original</span><div class="kpe-field-text">${Utils.escapeHtml(original)}</div></div><div class="kpe-field"><span class="kpe-field-label">Aprimorado</span><div class="kpe-field-text" data-kpe-stream>${Utils.escapeHtml(enhanced)}</div></div>`;
            const cancelBtn = Atoms.button({ icon: 'x', label: 'Cancelar', ariaLabel: 'Cancelar', variant: 'outline', onClick: () => handleCancel() });
            const applyBtn = Atoms.button({ icon: 'check', label: 'Aplicar', ariaLabel: 'Aplicar', variant: 'primary', onClick: () => handleApply() });
            const { panel, close } = Molecules.panel({ title: 'Pré-visualização do prompt', anchor, children: body, footer: [cancelBtn, applyBtn], onClose: () => { try { (trigger || prevActive)?.focus?.(); } catch (_) {} onCancel?.(); } });
            Anim.staggerIn(body, 0.06);
            setTimeout(() => { const stream = panel.querySelector('[data-kpe-stream]'); if (stream) Anim.typewriter(stream, { duration: 0.85 }); }, 180);
            function handleCancel() { close(); }
            function handleApply() { Anim.pulseSuccess(applyBtn); try { onApply?.(); } finally { close(); } }
            return { close: handleCancel, apply: handleApply };
        },

        promptBaseChip(prompt) {
            const root = document.createElement('div');
            root.className = 'kpe-prompt-base';
            const wc = Utils.wordCount(prompt);
            root.innerHTML = `<button type="button" class="kpe-prompt-base__trigger" aria-expanded="false">${Atoms.icon('doc', 'kpe-prompt-base__icon').outerHTML}<span class="kpe-prompt-base__label">Prompt base</span><span class="kpe-prompt-base__meta">${Utils.escapeHtml(Utils.truncate(prompt, 100))}</span><span class="kpe-prompt-base__count">${wc} ${wc === 1 ? 'palavra' : 'palavras'}</span>${Atoms.icon('chevron', 'kpe-prompt-base__chevron').outerHTML}</button><div class="kpe-prompt-base__content"><div><div class="kpe-prompt-base__text">${Utils.escapeHtml(prompt)}</div></div></div>`;
            root.querySelector('.kpe-prompt-base__trigger').addEventListener('click', (e) => { e.preventDefault(); const expanded = root.classList.toggle('is-expanded'); root.querySelector('.kpe-prompt-base__trigger').setAttribute('aria-expanded', String(expanded)); });
            return root;
        },

        contextIndicator() {
            const root = document.createElement('div');
            root.className = 'kpe-agents-indicator';
            function refresh() {
                root.innerHTML = '';
                if (!ProjectContext.hasContent() || !ProjectContext.isEnabled()) { root.style.display = 'none'; return; }
                root.style.display = 'flex';
                const active = ProjectContext.list().filter(f => f.enabled);
                const title = active.length === 1 ? active[0].name : `${active.length} arquivos de contexto`;
                root.innerHTML = `${Atoms.icon('check').outerHTML}<div class="kpe-agents-indicator__body"><span class="kpe-agents-indicator__title">${Utils.escapeHtml(title)}</span><span class="kpe-agents-indicator__meta">${Utils.formatBytes(ProjectContext.getTotalSize())} · injetado em cada chamada</span></div>`;
            }
            refresh();
            return { root, refresh };
        },

        guidedWizard({ questions, prompt, anchor, trigger, onSubmit, onCancel }) {
            const prevActive = document.activeElement;
            const progressInline = document.createElement('div');
            progressInline.className = 'kpe-progress-inline';
            progressInline.innerHTML = `<div class="kpe-progress-track"><div class="kpe-progress-fill"></div></div><span class="kpe-progress-label">0 de ${questions.length}</span>`;
            const progressFill = progressInline.querySelector('.kpe-progress-fill');
            const progressLabel = progressInline.querySelector('.kpe-progress-label');
            const bodyContent = document.createElement('div');
            const errorSlot = document.createElement('div');
            errorSlot.setAttribute('aria-live', 'assertive');
            const contextInd = Molecules.contextIndicator();
            const promptLabel = document.createElement('div');
            promptLabel.className = 'kpe-section-label';
            promptLabel.innerHTML = `${Atoms.icon('doc').outerHTML}<span>Prompt base</span>`;
            const chip = Molecules.promptBaseChip(prompt);
            const questionsLabel = document.createElement('div');
            questionsLabel.className = 'kpe-section-label';
            questionsLabel.innerHTML = `${Atoms.icon('guide').outerHTML}<span>Perguntas de esclarecimento</span>`;
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
                item.className = 'kpe-q-item';
                item.dataset.qid = q.id;
                if (idx === 0) item.classList.add('is-open');
                const header = document.createElement('button');
                header.type = 'button'; header.className = 'kpe-q-header';
                header.setAttribute('aria-expanded', String(idx === 0));
                const num = document.createElement('span');
                num.className = 'kpe-q-num';
                num.innerHTML = `<span>${idx + 1}</span><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>`;
                const main = document.createElement('div');
                main.className = 'kpe-q-header-main';
                const text = document.createElement('div');
                text.className = 'kpe-q-text';
                text.textContent = q.question || `Pergunta ${idx + 1}`;
                main.appendChild(text);
                const hint = document.createElement('span');
                if (q.allowCode) { hint.className = 'kpe-q-hint kpe-q-hint--code'; hint.innerHTML = `${Atoms.icon('codeSpark').outerHTML}<span>Contexto de código útil aqui</span>`; }
                else { hint.className = 'kpe-q-hint'; hint.textContent = q.type === 'multi' ? 'Pode selecionar mais de uma opção' : (q.type === 'choice' ? 'Escolha uma opção' : 'Digite sua resposta'); }
                main.appendChild(hint);
                const summary = document.createElement('span');
                summary.className = 'kpe-q-summary';
                summary.innerHTML = 'Resposta: <span class="kpe-q-summary__value">—</span>';
                const summaryValue = summary.querySelector('.kpe-q-summary__value');
                main.appendChild(summary);
                const chevron = Atoms.icon('chevronD');
                chevron.setAttribute('class', 'kpe-q-chevron');
                header.appendChild(num); header.appendChild(main); header.appendChild(chevron);
                header.addEventListener('click', () => { const isOpen = item.classList.toggle('is-open'); header.setAttribute('aria-expanded', String(isOpen)); });
                const content = document.createElement('div');
                content.className = 'kpe-q-content';
                const contentInnerWrap = document.createElement('div');
                const contentInner = document.createElement('div');
                contentInner.className = 'kpe-q-content-inner';
                const group = document.createElement('div');
                group.className = 'kpe-options-group';
                if (q.type === 'choice' && Array.isArray(q.options)) {
                    group.setAttribute('role', 'radiogroup');
                    q.options.forEach(opt => {
                        const lab = document.createElement('label');
                        lab.className = 'kpe-option';
                        lab.innerHTML = `<span class="kpe-radio"></span><span>${Utils.escapeHtml(opt)}</span>`;
                        lab.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); group.querySelectorAll('.kpe-option').forEach(o => o.classList.remove('is-checked')); lab.classList.add('is-checked'); qs.value = String(opt); qs.freeActive = false; setAnswered(q, qs, String(opt), { collapse: true }); });
                        group.appendChild(lab);
                    });
                    group.appendChild(Object.assign(document.createElement('div'), { className: 'kpe-options-divider', innerHTML: '<span>ou</span>' }));
                    group.appendChild(buildFreeText({ q, qs, kind: 'radio', items, onActivate: () => { qs.freeActive = true; qs.value = ''; group.querySelectorAll('.kpe-option').forEach(o => o.classList.remove('is-checked')); }, onInput: (v) => { qs.freeText = v; if (v) setAnswered(q, qs, v, { collapse: false }); else if (!qs.value) unsetAnswered(q, qs); } }));
                } else if (q.type === 'multi' && Array.isArray(q.options)) {
                    group.setAttribute('role', 'group');
                    q.options.forEach(opt => {
                        const lab = document.createElement('label');
                        lab.className = 'kpe-option';
                        lab.innerHTML = `<span class="kpe-checkbox"></span><span>${Utils.escapeHtml(opt)}</span>`;
                        lab.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); lab.classList.toggle('is-checked'); if (lab.classList.contains('is-checked')) qs.values.add(String(opt)); else qs.values.delete(String(opt)); updateMultiAnswer(q, qs); });
                        group.appendChild(lab);
                    });
                    group.appendChild(Object.assign(document.createElement('div'), { className: 'kpe-options-divider', innerHTML: '<span>e/ou</span>' }));
                    group.appendChild(buildFreeText({ q, qs, kind: 'checkbox', items, onActivate: () => { qs.freeActive = true; }, onInput: (v) => { qs.freeText = v; updateMultiAnswer(q, qs); } }));
                } else {
                    const ta = document.createElement('textarea');
                    ta.className = 'kpe-textarea'; ta.rows = 2;
                    ta.placeholder = q.placeholder || 'Sua resposta…';
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
                progressLabel.textContent = `${done} de ${questions.length}`;
                progressFill.style.width = `${(done / questions.length) * 100}%`;
                submitBtn.disabled = done < questions.length;
            }
            function buildFreeText({ q, qs, kind, items, onActivate, onInput }) {
                const wrap = document.createElement('div');
                wrap.className = 'kpe-free-text';
                wrap.innerHTML = `<label class="kpe-free-text__row"><span class="${kind === 'radio' ? 'kpe-radio' : 'kpe-checkbox'}"></span><span class="kpe-free-text__label">${kind === 'radio' ? 'Nenhuma das opções — escrever resposta' : 'Outros elementos — escrever resposta'}</span></label><div class="kpe-free-text__input-wrap"><div><input type="text" class="kpe-free-text__input" placeholder="${kind === 'radio' ? 'Digite sua resposta…' : 'Ex: paginação, ordenação…'}"></div></div>`;
                const row = wrap.querySelector('.kpe-free-text__row');
                const input = wrap.querySelector('.kpe-free-text__input');
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
            const expandAllBtn = Atoms.buttonNode({ label: 'Expandir tudo', ariaLabel: 'Expandir ou recolher', variant: 'ghost', onClick: (btn) => { allExpanded = !allExpanded; items.forEach(({ item, header }) => { item.classList.toggle('is-open', allExpanded); header.setAttribute('aria-expanded', String(allExpanded)); }); btn.querySelector('.kpe-label').textContent = allExpanded ? 'Recolher tudo' : 'Expandir tudo'; } });
            expandAllBtn.classList.add('kpe-panel__expand');
            const actions = document.createElement('div');
            actions.className = 'kpe-panel__actions';
            const cancelBtn = Atoms.button({ icon: 'x', label: 'Cancelar', ariaLabel: 'Cancelar', variant: 'outline', onClick: () => handleCancel() });
            const submitBtn = Atoms.button({ icon: 'arrow', label: 'Gerar prompt', ariaLabel: 'Gerar', variant: 'primary', onClick: () => handleSubmit() });
            submitBtn.disabled = true;
            actions.appendChild(cancelBtn); actions.appendChild(submitBtn);
            const { panel, close } = Molecules.panel({ title: 'Aprimoramento guiado', anchor, headerExtra: progressInline, children: bodyContent, footer: [expandAllBtn, actions], onClose: () => { try { (trigger || prevActive)?.focus?.(); } catch (_) {} onCancel?.(); } });
            const loading = Molecules.loadingOverlay({});
            panel.appendChild(loading.root);
            const loadingHandler = wireOverlayToEvents(loading);
            let closed = false;
            const animateOut = async (cb) => { if (closed) return; closed = true; await close(true); try { (trigger || prevActive)?.focus?.(); } catch (_) {} cb?.(); };
            const handleCancel = () => { if (closed) return; closed = true; close(); };
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
                    box.className = 'kpe-panel-error';
                    const title = document.createElement('div');
                    title.className = 'kpe-panel-error__title';
                    title.textContent = idx.title;
                    const desc = document.createElement('div');
                    desc.className = 'kpe-panel-error__desc';
                    desc.textContent = idx.description;
                    box.appendChild(title); box.appendChild(desc);
                    const details = document.createElement('details');
                    details.className = 'kpe-panel-error__details';
                    const sum = document.createElement('summary');
                    sum.textContent = 'Ver detalhes técnicos';
                    const pre = document.createElement('pre');
                    pre.textContent = JSON.stringify({ code: idx.code, ...idx.technical }, null, 2);
                    details.appendChild(sum); details.appendChild(pre);
                    box.appendChild(details);
                    errorSlot.appendChild(box);
                    Anim.fadeIn(box, { duration: 0.28 });
                    if (err instanceof NetError && err.retryable) Molecules.toast(`${idx.title}\n${idx.description}`, 'error', { actionLabel: 'Tentar novamente', onAction: () => handleSubmit(), details: idx.technical });
                    else Molecules.toast(`${idx.title}\n${idx.description}`, 'error', { details: idx.technical });
                }
            }
            updateProgress();
            return { close: handleCancel };
        },

        toast(message, type = 'info', { actionLabel, onAction, timeout = 3600, details = null } = {}) {
            const t = document.createElement('div');
            t.className = 'kpe-toast kpe-scope' + (type === 'error' ? ' is-error' : type === 'success' ? ' is-success' : '');
            if (actionLabel && typeof onAction === 'function') t.classList.add('has-action');
            if (details) t.classList.add('has-details');
            t.setAttribute('role', type === 'error' ? 'alert' : 'status');
            t.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
            const row = document.createElement('div');
            row.className = 'kpe-toast__row';
            const msg = document.createElement('span');
            msg.className = 'kpe-toast__msg';
            const lines = String(message).split('\n').filter(Boolean);
            if (lines.length <= 1) msg.textContent = message;
            else {
                msg.classList.add('is-multiline');
                lines.forEach((line, i) => {
                    const s = document.createElement('span');
                    s.className = i === 0 ? 'kpe-toast__line kpe-toast__line--headline' : 'kpe-toast__line kpe-toast__line--detail';
                    s.textContent = line;
                    msg.appendChild(s);
                });
            }
            row.appendChild(msg);
            let finalTimeout = timeout;
            if (lines.length > 1 || details) finalTimeout = Math.max(finalTimeout, 8000);
            if (actionLabel && typeof onAction === 'function') {
                const btn = document.createElement('button');
                btn.type = 'button'; btn.className = 'kpe-toast__action';
                btn.textContent = actionLabel;
                btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); try { onAction(); } finally { Anim.toastOut(t); } });
                row.appendChild(btn);
                finalTimeout = Math.max(finalTimeout, 8000);
            }
            t.appendChild(row);
            if (details) {
                const d = document.createElement('details');
                d.className = 'kpe-toast__details';
                const sum = document.createElement('summary');
                sum.textContent = 'Detalhes técnicos';
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
            wrap.className = 'kpe-float-wrap kpe-scope';
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
