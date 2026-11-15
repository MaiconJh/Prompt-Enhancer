// ===== src/enhancement-history.js =====
    // ===== EnhancementHistory (runs) =====
    const EnhancementHistory = (() => {
        const KEY = 'pe_runs';
        const runs = new Map();
        function _loadPersisted() {
            try {
                const raw = GM_getValue(KEY, '[]');
                const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return Array.isArray(arr) ? arr : [];
            } catch (_) { return []; }
        }

        function _persist(list) {
            try {
                const now = Date.now();
                let trimmed = list.filter(run => {
                    if (!run || !run.startedAt) return false;
                    return (now - run.startedAt) < CONFIG.HISTORY_MAX_AGE_MS;
                });
                trimmed = trimmed.slice(0, CONFIG.HISTORY_MAX_RUNS);
                let serialized = JSON.stringify(trimmed);
                while (serialized.length > CONFIG.HISTORY_MAX_CHARS && trimmed.length > 1) {
                    trimmed.pop();
                    serialized = JSON.stringify(trimmed);
                }

                // 2. Se UM ÚNICO registro ainda ultrapassar o limite total, trunca os campos pesados
                if (serialized.length > CONFIG.HISTORY_MAX_CHARS && trimmed.length === 1) {
                    const singleRun = trimmed[0];

                    // Remove payloads (system prompts/mensagens) das chamadas, pois são os maiores ofensores
                    if (Array.isArray(singleRun.calls)) {
                        singleRun.calls.forEach(call => {
                            if (call.payload) delete call.payload;
                            if (call.output && call.output.length > 2000) {
                                call.output = call.output.slice(0, 2000) + '… [truncado]';
                            }
                        });
                    }

                    // Trunca o input e output gerais da execução
                    if (singleRun.input && singleRun.input.length > 1000) {
                        singleRun.input = singleRun.input.slice(0, 1000) + '… [truncado]';
                    }
                    if (singleRun.output && singleRun.output.length > 2000) {
                        singleRun.output = singleRun.output.slice(0, 2000) + '… [truncado]';
                    }

                    serialized = JSON.stringify(trimmed);

                    // Fallback extremo (segurança): se ainda for maior, descarta o registro para não estourar a cota
                    if (serialized.length > CONFIG.HISTORY_MAX_CHARS) {
                        trimmed = [];
                        serialized = '[]';
                    }
                }
                GM_setValue(KEY, serialized);
            } catch (_) {}
        }

        function _getRun(runId) {
            if (!runId) return null;
            const now = Date.now();
            if (runs.has(runId)) {
                const cached = runs.get(runId);
                if (cached && (now - Number(cached.startedAt)) > CONFIG.HISTORY_MAX_AGE_MS) { runs.delete(runId); return null; }
                return cached;
            }
            const list = _loadPersisted();
            const run = list.find(r => r && r.id === runId);
            if (!run || (now - Number(run.startedAt)) > CONFIG.HISTORY_MAX_AGE_MS) return null;
            runs.set(runId, run);
            return run || null;
        }

        function _saveRun(run) {
            if (!run || !run.id) return;
            const list = _loadPersisted().filter(r => r && r.id !== run.id);
            list.unshift(run);
            _persist(list);
        }

        function startRun({ type, input, params, contextInfo, meta } = {}) {
            const id = Utils.uid('run');
            const run = {
                id,
                type: type || 'enhance',
                startedAt: Date.now(),
                endedAt: 0,
                durationMs: 0,
                input: truncRunText(String(input || '')),
                output: null,
                status: 'aborted',
                outcome: 'pending',
                error: null,
                params: params || {},
                contextInfo: contextInfo || { activeCount: 0, totalBytes: 0, enabled: false },
                calls: [],
                meta: { retries: 0, streamUsed: false, fallbackUsed: false, ...(meta || {}) }
            };
            runs.set(id, run);
            return id;
        }

        function recordCall(runId, callData) {
            if (!runId || !callData) return null;
            let run = _getRun(runId);
            if (!run) return null;
            try {
                const callId = Utils.uid('call');
                const call = {
                    id: callId,
                    kind: callData.kind || 'main',
                    attempt: Number(callData.attempt) || 1,
                    retryOf: callData.retryOf || null,
                    startedAt: Number(callData.startedAt) || Date.now(),
                    endedAt: Number(callData.endedAt) || Date.now(),
                    durationMs: Math.max(0, Number(callData.durationMs) || 0),
                    payload: callData.payload ? {
                        system: truncCallText(String(callData.payload.system || '')),
                        messages: Array.isArray(callData.payload.messages) ? callData.payload.messages.map(m => ({ role: m?.role, content: truncCallText(String(m?.content || '')) })) : [],
                        params: callData.payload.params || {},
                        meta: callData.payload.meta || {}
                    } : null,
                    output: truncCallText(String(callData.output || '')),
                    error: callData.error ? { code: callData.error.code || '', message: String(callData.error.message || ''), meta: callData.error.meta || null } : null,
                    streamUsed: !!callData.streamUsed,
                    fallbackUsed: !!callData.fallbackUsed
                };
                run.calls = run.calls || [];
                run.calls.push(call);
                if (call.streamUsed) run.meta.streamUsed = true;
                if (call.fallbackUsed) run.meta.fallbackUsed = true;
                if (call.attempt > 1) run.meta.retries = Math.max(run.meta.retries || 0, call.attempt - 1);
                runs.set(runId, run);
                return callId;
            } catch (_) { return null; }
        }

        function endRun(runId, { status, output, error, validation } = {}) {
            const run = _getRun(runId);
            if (!run) return;
            run.endedAt = Date.now();
            run.durationMs = Math.max(0, run.endedAt - run.startedAt);
            if (status) {
                run.status = status;
                if (status === 'error') run.outcome = 'error';
            }
            if (output !== undefined) run.output = output === null ? null : truncRunText(String(output || ''));
            if (error !== undefined) run.error = error ? { code: error.code || '', message: String(error.message || ''), meta: error.meta || null } : null;
            if (validation !== undefined) run.validation = validation;
            runs.set(runId, run);
            _saveRun(run);
        }

        function setOutcome(runId, outcome) {
            const run = _getRun(runId);
            if (!run) return;
            run.outcome = outcome;
            runs.set(runId, run);
            _saveRun(run);
        }

        function cancelRun(runId, { reason } = {}) {
            const run = _getRun(runId);
            if (!run) return;
            run.status = 'aborted';
            run.outcome = 'aborted';
            run.endedAt = run.endedAt || Date.now();
            run.durationMs = Math.max(0, (run.endedAt || Date.now()) - run.startedAt);
            if (reason) run.meta.cancelReason = reason;
            runs.set(runId, run);
            _saveRun(run);
        }

        function listRuns() {
            const now = Date.now();
            const trimmed = _loadPersisted().filter(run => {
                if (!run || !run.startedAt) return false;
                return (now - run.startedAt) < CONFIG.HISTORY_MAX_AGE_MS;
            });
            return trimmed.slice(0, CONFIG.HISTORY_MAX_RUNS);
        }

        function clear() {
            runs.clear();
            _persist([]);
        }

        function reconcilePending() {
            const list = _loadPersisted();
            const now = Date.now();
            let changed = false;
            const beforeLength = list.length;
            const expired = list.filter(r => r && (now - Number(r.startedAt)) > CONFIG.HISTORY_MAX_AGE_MS);
            if (expired.length) changed = true;
            for (const run of list) {
                if (!run) continue;
                if (run.meta && run.meta.legacy) continue;
                if (run.outcome === 'pending') {
                    run.outcome = 'aborted';
                    changed = true;
                }
            }
            const afterLength = list.filter(r => r && (now - Number(r.startedAt)) < CONFIG.HISTORY_MAX_AGE_MS).length;
            if (beforeLength !== afterLength) changed = true;
            if (changed) _persist(list);
        }

        return { startRun, recordCall, endRun, setOutcome, cancelRun, listRuns, clear, reconcilePending };
    })();

