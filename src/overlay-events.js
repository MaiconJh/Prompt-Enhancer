// ===== src/overlay-events.js =====
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
                        if (evt.meta) overlay.logEvent('dispatch', I18n.t('ov.dispatch', { kb: evt.meta.payloadKB.toFixed(1), n: evt.meta.attempt }));
                    } else {
                        const att = evt.meta ? evt.meta.attempt : 1;
                        overlay.logEvent('redispatch', I18n.t('ov.attempt', { n: att }), 'ok');
                        overlay.setState('connecting');
                    }
                    break;
                case 'phase':
                    switch (evt.phase) {
                        case 'rate_limiting':
                            overlay.setState('waiting');
                            overlay.logEvent('rate_limiting', I18n.t('ov.rateLimiting'));
                            break;
                        case 'preparing':
                            overlay.setState('preparing');
                            overlay.logEvent('preparing', I18n.t('ov.preparing'));
                            break;
                        case 'dispatching':
                            overlay.setState('dispatching');
                            overlay.logEvent('dispatching', I18n.t('ov.dispatching'));
                            break;
                        case 'awaiting_ttfb':
                            overlay.setState('awaiting_ttfb');
                            overlay.logEvent('awaiting_ttfb', I18n.t('ov.awaitingTtfb'));
                            break;
                        case 'awaiting_token':
                            overlay.setState('awaiting_token');
                            overlay.logEvent('awaiting_token', I18n.t('ov.awaitingToken'));
                            break;
                    }
                    break;
                case 'first_byte':
                    overlay.cancelVirtualProgress?.();
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
                    overlay.logEvent('retry_sched', I18n.t('ov.backoff', { s: (evt.delayMs / 1000).toFixed(1) }), 'warn');
                    overlay.setMetric('attempt', `${nextAttempt} / ${total}`, 'warn');
                    overlay.setMetric('retry', I18n.t('lo.retryMetric', { s: (evt.delayMs / 1000).toFixed(1) }), 'warn');
                    overlay.setMetric('status', '—', 'muted');
                    overlay.setMetric('bytes', '0 B');
                    break;
                }
                case 'warning':
                    overlay.warn(evt.code);
                    break;
                case 'fallback':
                    overlay.setState('waiting');
                    overlay.note(I18n.t('ov.fallback'));
                    break;
                case 'error':
                    overlay.logEvent('error', `· ${evt.code}`, 'err');
                    break;
            }
        };
    }

