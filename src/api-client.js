// ===== src/api-client.js =====
    // ===== HTTP client with history capture per-call + extended system composition =====
    const ApiClient = {
        _post(systemPrompt, userContent, options = {}) {
            const runId = options.runId || null;
            const baseCallKind = options.callKind || 'main';
            const baseAttempt = options.attempt || 1;
            let lastCallId = null;

            const captureOnEvent = (evt) => {
                if (evt && evt.type === '__history') {
                    if (runId && evt.entry) {
                        try {
                            const entry = {
                                ...evt.entry,
                                kind: evt.callKind || baseCallKind,
                                attempt: typeof evt.attempt === 'number' ? evt.attempt : baseAttempt,
                                retryOf: evt.retryOf || lastCallId || null
                            };
                            const callId = EnhancementHistory.recordCall(runId, entry);
                            if (callId) lastCallId = callId;
                        } catch (_) {}
                    }
                    return;
                }
                try { options.onEvent?.(evt); } catch (_) {}
            };

            const run = async () => {
                let attempt = 0, lastErr;
                while (attempt <= CONFIG.RETRY_MAX) {
                    try {
                        return await ApiClient._postOnce(systemPrompt, userContent, {
                            ...options,
                            onEvent: captureOnEvent,
                            runId,
                            callKind: baseCallKind,
                            attempt: baseAttempt + attempt,
                            retryOf: lastCallId
                        });
                    } catch (err) {
                        lastErr = err;
                        if (!(err instanceof NetError)) throw err;
                        if (!NetError.AUTO_RETRY.has(err.code)) throw err;
                        if (attempt >= CONFIG.RETRY_MAX) throw err;
                        attempt++;
                        try { options.onEvent?.({ type: 'retry', attempt, code: err.code, delayMs: CONFIG.RETRY_BACKOFF_MS, lastError: err }); } catch (_) {}
                        await new Promise(r => setTimeout(r, CONFIG.RETRY_BACKOFF_MS));
                    }
                }
                throw lastErr;
            };
            return run();
        },

        _postOnce(systemPrompt, userContent, { params = {}, skipContext = false, timeoutOverride = null, onEvent = null, forceNonStream = false, mainCall = false, runId = null, callKind = 'main', attempt = 1, retryOf = null } = {}) {
            return new Promise((resolve, reject) => {
                const startedAt = Date.now();
                const emitHistoryEarly = (partial) => {
                    try {
                        onEvent?.({ type: '__history', runId, callKind, attempt, retryOf, entry: { input: userContent, durationMs: Date.now() - startedAt, ...partial } });
                    } catch (_) {}
                };
                if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                    const err = ErrorIndexer.build({ code: 'OFFLINE', message: 'Você está offline.' });
                    emitHistoryEarly({ payload: null, output: '', error: { code: 'OFFLINE', message: err.message }, meta: {} });
                    reject(err);
                    return;
                }
                const finalParams = ParamSchema.clean(params);
                const useStream = CONFIG.STREAM && !forceNonStream;
                const baseSystem = systemPrompt;
                let fullSystem = baseSystem;
                if (finalParams.response_language && finalParams.response_language !== 'auto') fullSystem += `\n\nIdioma da resposta: ${finalParams.response_language}.`;
                if (finalParams.response_persona && finalParams.response_persona !== 'auto') { const hint = CONFIG.PERSONA_HINTS[finalParams.response_persona] || finalParams.response_persona; fullSystem += `\nTom da resposta: ${hint}.`; }
                fullSystem += ProjectContext.buildSystemSuffix({ skip: skipContext });
                const API_KEYS = new Set(['temperature', 'max_tokens', 'top_p', 'frequency_penalty', 'presence_penalty', 'seed']);
                const apiParams = {};
                for (const k of Object.keys(finalParams)) { if (API_KEYS.has(k)) apiParams[k] = finalParams[k]; }
                const payload = { model: CONFIG.MODEL, messages: [{ role: 'system', content: fullSystem }, { role: 'user', content: userContent }], stream: useStream, ...apiParams };
                if (payload.temperature === undefined) payload.temperature = 0.7;
                if (payload.max_tokens === undefined) payload.max_tokens = 2048;
                const payloadForSize = JSON.stringify(payload);
                const payloadKB = Utils.byteSize(payloadForSize) / 1024;
                const adaptiveTimeout = Math.min(CONFIG.TIMEOUT_MAX_MS, Math.max(CONFIG.TIMEOUT_BASE_MS, CONFIG.TIMEOUT_BASE_MS + payloadKB * CONFIG.TIMEOUT_PER_KB_MS));
                const baseTimeout = forceNonStream ? adaptiveTimeout * CONFIG.FALLBACK_TIMEOUT_MULTIPLIER : adaptiveTimeout;
                const timeoutMs = timeoutOverride != null ? timeoutOverride : baseTimeout;
                const check = RateLimiter.check();
                if (!check.allowed) {
                    const err = ErrorIndexer.build({ code: 'LOCAL_RATE_LIMIT', meta: { retryAfterMs: check.retryAfterMs } });
                    emitHistoryEarly({ payload: { system: fullSystem, messages: payload.messages, params: apiParams, meta: { model: CONFIG.MODEL, endpoint: CONFIG.API_URL, stream: useStream, timeoutMs, payloadKB } }, output: '', error: { code: 'LOCAL_RATE_LIMIT', message: err.message, meta: err.meta }, meta: {}, streamUsed: false, fallbackUsed: false });
                    reject(err);
                    return;
                }
                RateLimiter.consume();
                let settled = false, aborted = false, receivedFirstToken = false, receivedAnyByte = false;
                let firstTokenAt = 0, lastTokenAt = Date.now(), tokenCount = 0;
                let responseAccum = '', lastProcessedIdx = 0, lastFinishReason = '';
                let parser = useStream ? StreamParser.create() : null;
                let streamWarned = { noFirstByte: false, stall: false };
                let reqRef = null, watchdogTimer = null;
                State.stream = { active: useStream, startedAt, firstTokenAt: 0, tokenCount: 0, lastTokenAt, observedTokS: 0, fullText: '' };
                const emit = (evt) => { try { onEvent?.(evt); } catch (e) { console.warn('[KPE] onEvent error', e); } };
                try { emit({ type: '__meta', meta: { model: CONFIG.MODEL, endpoint: CONFIG.API_URL, stream: useStream, timeoutMs, payloadKB, attempt } }); } catch (_) {}
                function clearWatchdogs() { if (watchdogTimer) { clearInterval(watchdogTimer); watchdogTimer = null; } }
                function startWatchdogs() {
                    if (!useStream) return;
                    watchdogTimer = setInterval(() => {
                        if (settled || aborted) return;
                        const now = Date.now();
                        if (!receivedFirstToken) {
                            if (now - startedAt >= CONFIG.WATCHDOG_NO_FIRST_TOKEN_MS && !streamWarned.noFirstByte) { streamWarned.noFirstByte = true; emit({ type: 'warning', code: 'NO_FIRST_BYTE' }); }
                        } else if (now - lastTokenAt >= CONFIG.WATCHDOG_STALL_MS && !streamWarned.stall) { streamWarned.stall = true; emit({ type: 'warning', code: 'STALL' }); }
                    }, 1000);
                }
                const finalize = (err, value) => {
                    if (settled) return;
                    settled = true;
                    clearWatchdogs();
                    State.stream.active = false;
                    if (State._currentRequest === reqObj) State._currentRequest = null;
                    if (err) {
                        try { emit({ type: 'error', code: err.code, message: err.message, meta: err.meta }); } catch (_) {}
                    }
                    try {
                        emit({ type: '__history', runId, callKind, attempt, retryOf, entry: {
                            input: userContent,
                            payload: { system: fullSystem, messages: payload.messages, params: apiParams, meta: { model: CONFIG.MODEL, endpoint: CONFIG.API_URL, stream: useStream, timeoutMs, payloadKB } },
                            output: value || responseAccum || '',
                            durationMs: Date.now() - startedAt,
                            error: err ? { code: err.code, message: err.message, meta: err.meta } : null,
                            meta: { finishReason: lastFinishReason, tokenCount, aborted },
                            streamUsed: useStream && receivedFirstToken,
                            fallbackUsed: useStream && !receivedFirstToken && !!(value || responseAccum)
                        } });
                    } catch (_) {}
                    if (err) {
                        if (!receivedAnyByte && NetError.RETRYABLE.has(err.code)) { try { RateLimiter.refund(); } catch (_) {} }
                        State.lastError = err;
                        reject(err);
                    } else resolve(value);
                };
                function handleStreamEvents(events) {
                    for (const evt of events) {
                        if (evt.type === 'token') {
                            if (!receivedFirstToken) { receivedFirstToken = true; firstTokenAt = Date.now(); State.stream.firstTokenAt = firstTokenAt; emit({ type: 'first_token' }); }
                            receivedAnyByte = true;
                            tokenCount++;
                            State.stream.tokenCount = tokenCount;
                            lastTokenAt = Date.now();
                            State.stream.lastTokenAt = lastTokenAt;
                            streamWarned.stall = false;
                            responseAccum += evt.text;
                            State.stream.fullText = responseAccum;
                            emit({ type: 'token', text: evt.text, count: tokenCount });
                        } else if (evt.type === 'usage') { emit({ type: 'usage', usage: evt.usage }); }
                        else if (evt.type === 'finish') { lastFinishReason = evt.reason || ''; }
                        else if (evt.type === 'done') {
                            try { emit({ type: 'stream_done', tokens: tokenCount }); } catch (_) {}
                            if (responseAccum.trim()) finalize(null, responseAccum.trim());
                            else finalize(ErrorIndexer.build({ code: 'EMPTY_RESPONSE', message: lastFinishReason === 'content_filter' ? 'Conteúdo bloqueado pelo filtro de segurança do provedor.' : 'A API não retornou conteúdo.', meta: { finishReason: lastFinishReason } }));
                        }
                    }
                }
                const reqObj = { abort: () => { if (aborted || settled) return; aborted = true; clearWatchdogs(); try { reqRef?.abort?.(); } catch (_) {} finalize(ErrorIndexer.build({ code: 'ABORTED', message: 'Requisição cancelada.' })); } };
                State._currentRequest = reqObj;
                State.pendingAbort = reqObj.abort;
                reqRef = GM_xmlhttpRequest({
                    method: 'POST',
                    url: CONFIG.API_URL,
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer anonymous', [CONFIG.PROVIDER_HEADER_NAME]: CONFIG.EDITOR_NAME },
                    data: JSON.stringify(payload),
                    timeout: timeoutMs,
                    onprogress: useStream ? (res) => {
                        if (aborted || settled) return;
                        try {
                            const full = res.responseText || '';
                            if (full.length <= lastProcessedIdx) return;
                            const delta = full.slice(lastProcessedIdx);
                            lastProcessedIdx = full.length;
                            if (!receivedAnyByte) {
                                receivedAnyByte = true;
                                try { emit({ type: 'first_byte', status: res.status || 0, bytes: full.length }); } catch (_) {}
                            }
                            const events = parser.feed(delta);
                            handleStreamEvents(events);
                        } catch (e) { emit({ type: 'warning', code: 'STREAM_PARSE_ERROR', error: e }); }
                    } : undefined,
                    onload: (res) => {
                        if (aborted) return;
                        clearWatchdogs();
                        if (useStream && parser) {
                            try {
                                const full = res.responseText || '';
                                if (full.length > lastProcessedIdx) {
                                    const delta = full.slice(lastProcessedIdx);
                                    lastProcessedIdx = full.length;
                                    if (!receivedAnyByte) {
                                        receivedAnyByte = true;
                                        try { emit({ type: 'first_byte', status: res.status, bytes: full.length }); } catch (_) {}
                                    }
                                    const events = parser.feed(delta);
                                    handleStreamEvents(events);
                                    if (settled) return;
                                }
                            } catch (_) {}
                        }
                        if (!receivedAnyByte) {
                            receivedAnyByte = true;
                            try { emit({ type: 'first_byte', status: res.status, bytes: (res.responseText || '').length }); } catch (_) {}
                        }
                        if (res.status < 200 || res.status >= 300) {
                            const data = ErrorIndexer.safeJsonParse(res.responseText);
                            finalize(ErrorIndexer.fromHttpResponse(res.status, data, res.responseHeaders, res.responseText));
                            return;
                        }
                        if (responseAccum.trim()) { finalize(null, responseAccum.trim()); return; }
                        let data;
                        try { data = JSON.parse(res.responseText); }
                        catch {
                            const headers = ErrorIndexer.parseHeaders(res.responseHeaders);
                            finalize(ErrorIndexer.build({ code: 'BAD_JSON', message: 'Resposta inválida da API.', meta: { status: res.status, contentType: headers['content-type'] || '', snippet: ErrorIndexer.truncate(res.responseText) } }));
                            return;
                        }
                        if (useStream && !receivedFirstToken) emit({ type: 'fallback' });
                        const choice = data?.choices?.[0];
                        const finishReason = choice?.finish_reason || '';
                        const refusal = choice?.message?.refusal;
                        const content = choice?.message?.content;
                        if (typeof content !== 'string' || !content.trim()) {
                            finalize(ErrorIndexer.build({ code: 'EMPTY_RESPONSE', message: finishReason === 'content_filter' ? 'Conteúdo bloqueado por filtro de segurança.' : (refusal ? `Provedor recusou: ${refusal}` : 'A API não retornou conteúdo.'), meta: { status: res.status, finishReason, refusal, provider: ErrorIndexer.extractProviderError(data) } }));
                            return;
                        }
                        finalize(null, content.trim());
                    },
                    onerror: () => { if (aborted) return; finalize(ErrorIndexer.build({ code: 'NETWORK', message: 'Falha de rede ao contatar a API.' })); },
                    ontimeout: () => { if (aborted) return; finalize(ErrorIndexer.build({ code: 'TIMEOUT', message: 'Tempo limite excedido.', meta: { timeoutMs, payloadKB, payloadSize: Utils.byteSize(payloadForSize) } })); },
                    onabort: () => { if (aborted) return; aborted = true; finalize(ErrorIndexer.build({ code: 'ABORTED', message: 'Requisição cancelada.' })); }
                });
                if (useStream) startWatchdogs();
            });
        },

        abort() { const req = State._currentRequest; if (req) { try { req.abort(); } catch (_) {} } },
        call(prompt, options = {}) { return ApiClient._post(SystemPromptManager.currentPrompt(), prompt, { ...options, mainCall: true }); },

        async generateQuestions(prompt, options = {}) {
            const raw = await ApiClient._post(SystemPromptManager.withUserInstructions(CONFIG.QUESTIONS_SYSTEM_PROMPT), prompt, options);
            const parsed = Utils.parseJSON(raw);
            if (!parsed || !Array.isArray(parsed.questions) || !parsed.questions.length) throw ErrorIndexer.build({ code: 'BAD_JSON', message: 'Não foi possível gerar perguntas.', meta: { snippet: ErrorIndexer.truncate(raw) } });
            let allowCodeCount = 0;
            const cleaned = parsed.questions
                .filter(q => q && typeof q.question === 'string' && q.question.trim())
                .map((q, i) => {
                    let type = String(q.type || 'text').toLowerCase();
                    if (!['text', 'choice', 'multi'].includes(type)) type = 'text';
                    const item = { id: String(q.id || `q${i + 1}`), type, question: String(q.question).trim(), placeholder: typeof q.placeholder === 'string' ? q.placeholder : '', options: Array.isArray(q.options) ? q.options.map(o => String(o)).filter(Boolean).slice(0, 6) : [] };
                    if ((type === 'choice' || type === 'multi') && item.options.length < 2) { item.type = 'text'; type = 'text'; }
                    if (q.allowCode === true && allowCodeCount < 2) { item.allowCode = true; allowCodeCount++; }
                    return item;
                }).slice(0, 5);
            if (!cleaned.length) throw ErrorIndexer.build({ code: 'EMPTY_RESPONSE', message: 'Nenhuma pergunta válida.', meta: { snippet: ErrorIndexer.truncate(raw) } });
            return cleaned;
        },

        enhanceWithAnswers(prompt, answers, options = {}) {
            const qa = answers.map((a, i) => {
                const val = Array.isArray(a.value) ? a.value.join(', ') : String(a.value ?? '');
                let entry = `P${i + 1}: ${a.question}\nR${i + 1}: ${val}`;
                if (a.codeContext) {
                    const lang = a.codeLanguage || '';
                    const filesInfo = Array.isArray(a.files) && a.files.length ? `\n(arquivos anexados: ${a.files.map(f => f.name).join(', ')})` : '';
                    entry += `\n\nTrecho de código fornecido pelo usuário${lang ? ` (${lang})` : ''}:${filesInfo}\n\`\`\`\n${a.codeContext}\n\`\`\``;
                }
                return entry;
            }).join('\n\n');
            const userContent = `Prompt inicial:\n"""\n${prompt}\n"""\n\nPerguntas e respostas do usuário:\n${qa}`;
            return ApiClient._post(SystemPromptManager.withUserInstructions(CONFIG.ENHANCE_WITH_ANSWERS_SYSTEM_PROMPT), userContent, options);
        }
    };
