// ===== src/19-overlay-events.js =====
    // ===== wireOverlayToEvents (shared) =====
    function wireOverlayToEvents(overlay) {
        let isFirstMeta = true;
        return (evt) => {
            if (!evt || !evt.type) return;
            switch (evt.type) {
                case '__meta':
                    if (evt.meta) overlay.setMeta(evt.meta);
                    if (isFirstMeta) {
                        isFirstMeta = false;
                        if (evt.meta) overlay.logEvent('dispatch', `· ${evt.meta.payloadKB.toFixed(1)} KB · tentativa ${evt.meta.attempt}`);
                    } else {
                        const att = evt.meta ? evt.meta.attempt : 1;
                        overlay.logEvent('redispatch', `· tentativa ${att}`, 'ok');
                        overlay.setState('connecting');
                    }
                    break;
                case 'first_byte':
                    overlay.setState('waiting');
                    overlay.logEvent('first_byte', `· HTTP ${evt.status || 200}`, 'ok');
                    overlay.setMetric('status', String(evt.status || 200), 'ok');
                    if (evt.bytes != null) overlay.setMetric('bytes', evt.bytes + ' B');
                    break;
                case 'first_token':
                    overlay.setState('streaming');
                    overlay.logEvent('first_token', '', 'ok');
                    break;
                case 'token':
                    overlay.attachStream({ tokens: evt.count });
                    break;
                case 'stream_done':
                    overlay.setState('finalizing');
                    overlay.logEvent('stream_done', evt.tokens != null ? `· ${evt.tokens} tok` : '', 'ok');
                    break;
                case 'retry': {
                    const nextAttempt = (evt.attempt || 0) + 1;
                    const total = CONFIG.RETRY_MAX + 1;
                    overlay.setState('retrying', { attempt: nextAttempt, total, backoffMs: evt.delayMs });
                    overlay.logEvent('retry_sched', `· backoff ${(evt.delayMs / 1000).toFixed(1)}s`, 'warn');
                    overlay.setMetric('attempt', `${nextAttempt} / ${total}`, 'warn');
                    overlay.setMetric('retry', `backoff ${(evt.delayMs / 1000).toFixed(1)}s`, 'warn');
                    overlay.setMetric('status', '—', 'muted');
                    overlay.setMetric('bytes', '0 B');
                    break;
                }
                case 'warning':
                    overlay.warn(evt.code);
                    break;
                case 'fallback':
                    overlay.setState('waiting');
                    overlay.note('Fallback para resposta completa');
                    break;
                case 'error':
                    overlay.logEvent('error', `· ${evt.code}`, 'err');
                    break;
            }
        };
    }

