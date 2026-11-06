// ===== src/04-providers-project-context.js =====
    const Providers = (() => {
        function detect() {
            const host = (location.hostname || '').toLowerCase();
            if (host.includes('claude.ai')) return 'claude';
            if (host.includes('chatgpt.com') || host.includes('chat.openai.com')) return 'openai';
            if (host.includes('gemini.google.com')) return 'gemini';
            return 'generic';
        }
        function wrap(body, provider) {
            if (!body) return '';
            switch (provider) {
                case 'claude': return `<project_context>\n${body}\n</project_context>`;
                case 'openai':
                case 'gemini': return `### CONTEXTO DO PROJETO ###\n${body}\n### FIM DO CONTEXTO DO PROJETO ###`;
                default: return `--- Instruções do projeto ---\n${body}\n--- Fim das instruções do projeto ---`;
            }
        }
        return { detect, wrap };
    })();

    const ProjectContext = (() => {
        const KEY_FILES = 'kpe_ctx_files';
        const KEY_GLOBAL_ENABLED = 'kpe_ctx_global_enabled';
        const safeGet = (k, d) => { try { return GM_getValue(k, d); } catch (_) { return d; } };
        const safeSet = (k, v) => { try { GM_setValue(k, v); return true; } catch (e) { console.error('[KPE] GM_setValue falhou:', k, e); return false; } };
        function _read() {
            const raw = safeGet(KEY_FILES, null);
            if (!raw) return [];
            try {
                const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (!Array.isArray(arr)) return [];
                return arr.filter(f => f && typeof f.content === 'string').map(f => ({
                    id: String(f.id || Utils.uid('ctx')),
                    name: String(f.name || 'AGENTS.md'),
                    path: f.path ? String(f.path) : '',
                    content: String(f.content),
                    size: Number(f.size) || String(f.content).length,
                    enabled: f.enabled !== false,
                    source: String(f.source || 'manual')
                }));
            } catch (_) { return []; }
        }
        function _write(list) { return safeSet(KEY_FILES, JSON.stringify(list)); }
        function list() { return _read(); }
        function isEnabled() { return safeGet(KEY_GLOBAL_ENABLED, true); }
        function setEnabled(v) { safeSet(KEY_GLOBAL_ENABLED, !!v); }
        function getTotalSize() { return _read().filter(f => f.enabled).reduce((s, f) => s + (f.size || f.content.length), 0); }
        function getAggregateName() { const active = _read().filter(f => f.enabled); if (!active.length) return ''; if (active.length === 1) return active[0].name; return `${active.length} arquivos`; }
        function hasContent() { return _read().some(f => f.enabled && f.content.trim()); }
        function add({ name, content, path, source }) {
            const trimmed = String(content || '').trim();
            if (!trimmed) return { ok: false, reason: 'empty' };
            if (trimmed.length > CONFIG.MAX_CONTEXT_FILE_SIZE) return { ok: false, reason: 'too-large' };
            const cur = _read();
            const total = cur.filter(f => f.enabled).reduce((s, f) => s + (f.size || 0), 0) + trimmed.length;
            if (total > CONFIG.MAX_CONTEXT_TOTAL_SIZE) return { ok: false, reason: 'total-too-large' };
            const entry = { id: Utils.uid('ctx'), name: String(name || 'AGENTS.md').slice(0, 120), path: path ? String(path) : '', content: trimmed, size: trimmed.length, enabled: true, source: source || 'manual' };
            cur.push(entry); _write(cur);
            return { ok: true, entry };
        }
        function remove(id) { _write(_read().filter(f => f.id !== id)); }
        function toggle(id, enabled) { const cur = _read(); const f = cur.find(x => x.id === id); if (f) { f.enabled = !!enabled; _write(cur); } }
        function clearAll() { _write([]); }
        function buildSystemSuffix({ skip = false } = {}) {
            if (skip) return '';
            if (!isEnabled()) return '';
            const active = _read().filter(f => f.enabled && f.content.trim());
            if (!active.length) return '';
            const parts = active.map(f => `--- ${f.name} ---\n${f.content}`);
            let body = parts.join('\n\n');
            if (body.length > CONFIG.MAX_CONTEXT_TOTAL_SIZE) body = body.slice(0, CONFIG.MAX_CONTEXT_TOTAL_SIZE) + '\n[...contexto truncado]';
            return '\n\n' + Providers.wrap(body, Providers.detect());
        }
        return { list, isEnabled, setEnabled, add, remove, toggle, clearAll, getTotalSize, getAggregateName, hasContent, buildSystemSuffix };
    })();

