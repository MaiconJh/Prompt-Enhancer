// ===== src/migration.js =====
    function migrateLegacy() {
        const KEY_MIGRATED = 'kpe_ctx_migrated';
        let migrated = false;
        try { migrated = GM_getValue(KEY_MIGRATED, false); } catch (_) {}
        if (migrated) return;
        let legacyContent = '', legacyName = 'AGENTS.md', legacyEnabled = true;
        try { legacyContent = GM_getValue('kpe_agents_md', ''); } catch (_) {}
        try { legacyName = GM_getValue('kpe_agents_name', 'AGENTS.md') || 'AGENTS.md'; } catch (_) {}
        try { legacyEnabled = GM_getValue('kpe_agents_enabled', true); } catch (_) {}
        if (legacyContent && legacyContent !== '__KPE_EMPTY__') {
            let existing = [];
            try { const raw = GM_getValue('kpe_ctx_files', null); if (raw) existing = typeof raw === 'string' ? JSON.parse(raw) : raw; if (!Array.isArray(existing)) existing = []; } catch (_) { existing = []; }
            const has = existing.some(f => f && f.source === 'legacy');
            if (!has) {
                existing.push({ id: Utils.uid('ctx'), name: legacyName || 'AGENTS.md', path: '', content: String(legacyContent).trim(), size: String(legacyContent).length, enabled: !!legacyEnabled, source: 'legacy' });
                try { GM_setValue('kpe_ctx_files', JSON.stringify(existing)); } catch (_) {}
            }
        }
        ['kpe_agents_md','kpe_agents_name','kpe_agents_size','kpe_agents_enabled'].forEach(k => { try { GM_deleteValue(k); } catch (_) {} });
        try { GM_setValue(KEY_MIGRATED, true); } catch (_) {}
    }

    // ===== Migração kpe_history → kpe_runs =====
    function _convertLegacyEntry(entry) {
        if (!entry || typeof entry !== 'object') return null;
        const at = Number(entry.at) || Date.now();
        const durationMs = Math.max(0, Number(entry.durationMs) || 0);
        const hasError = !!entry.error;
        const runId = Utils.uid('run');
        const callId = Utils.uid('call');
        return {
            id: runId,
            type: 'enhance',
            startedAt: at,
            endedAt: at + durationMs,
            durationMs,
            input: truncRunText(String(entry.input || '')),
            output: hasError ? null : truncRunText(String(entry.output || '')),
            status: hasError ? 'error' : 'success',
            outcome: hasError ? 'error' : 'applied',
            error: entry.error ? { code: entry.error.code || '', message: String(entry.error.message || ''), meta: entry.error.meta || null } : null,
            params: entry.payload?.params || {},
            contextInfo: { activeCount: 0, totalBytes: 0, enabled: false },
            calls: [{
                id: callId,
                kind: 'main',
                attempt: 1,
                retryOf: null,
                startedAt: at,
                endedAt: at + durationMs,
                durationMs,
                payload: entry.payload ? {
                    system: truncCallText(String(entry.payload.system || '')),
                    messages: Array.isArray(entry.payload.messages) ? entry.payload.messages.map(m => ({ role: m?.role, content: truncCallText(String(m?.content || '')) })) : [],
                    params: entry.payload.params || {},
                    meta: entry.payload.meta || {}
                } : null,
                output: truncCallText(String(entry.output || '')),
                error: entry.error ? { code: entry.error.code || '', message: String(entry.error.message || ''), meta: entry.error.meta || null } : null,
                streamUsed: false,
                fallbackUsed: false
            }],
            meta: { retries: 0, streamUsed: false, fallbackUsed: false, legacy: true }
        };
    }

    function migrateHistoryRuns() {
        const KEY_FLAG = 'kpe_runs_migrated';
        const OLD_KEY = 'kpe_history';
        const NEW_KEY = 'kpe_runs';
        let alreadyMigrated = false;
        try { alreadyMigrated = GM_getValue(KEY_FLAG, false); } catch (_) {}
        if (alreadyMigrated) return;
        let runsExists = false;
        try {
            const raw = GM_getValue(NEW_KEY, null);
            if (raw !== null && raw !== undefined) runsExists = true;
        } catch (_) {}
        if (runsExists) { try { GM_setValue(KEY_FLAG, true); } catch (_) {} return; }
        try {
            let oldHistory = [];
            try {
                const raw = GM_getValue(OLD_KEY, '[]');
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                oldHistory = Array.isArray(parsed) ? parsed : [];
            } catch (_) { oldHistory = []; }
            const convertedRuns = [];
            for (const entry of oldHistory) {
                try {
                    const run = _convertLegacyEntry(entry);
                    if (run) convertedRuns.push(run);
                } catch (_) {}
            }
            try { GM_setValue(NEW_KEY, JSON.stringify(convertedRuns.slice(0, CONFIG.HISTORY_MAX))); } catch (_) {}
            try { GM_deleteValue(OLD_KEY); } catch (_) {}
            try { GM_setValue(KEY_FLAG, true); } catch (_) {}
        } catch (e) {
            try { GM_deleteValue(OLD_KEY); } catch (_) {}
            try {
                const existing = GM_getValue(NEW_KEY, null);
                if (!existing) GM_setValue(NEW_KEY, '[]');
            } catch (_) {}
            try { GM_setValue(KEY_FLAG, true); } catch (_) {}
        }
    }

