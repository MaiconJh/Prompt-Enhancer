// ===== src/utils.js =====
    const Utils = {
        debounce(fn, wait) { let t; return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); }; },
        escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); },
        isEditable(el) { if (!el || !el.tagName) return false; if (el.tagName === 'TEXTAREA') return true; if (el.tagName === 'INPUT' && ['text','search'].includes(el.type)) return true; if (el.isContentEditable) return true; return false; },
        getText(el) { if (!el) return ''; if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value || ''; if (el.isContentEditable) return el.innerText || el.textContent || ''; return ''; },
        applyText(el, text) {
            if (!el) return;
            el.focus();
            if (el.isContentEditable) {
                const range = document.createRange();
                range.selectNodeContents(el);
                const sel = window.getSelection();
                sel.removeAllRanges(); sel.addRange(range);
                const ok = document.execCommand('insertText', false, text);
                if (!ok) el.textContent = text;
                return;
            }
            el.select();
            const ok = document.execCommand('insertText', false, text);
            if (!ok || el.value !== text) {
                const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
                const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
                if (setter) setter.call(el, text); else el.value = text;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        },
        uid(prefix = 'kpe') { return `${prefix}-${Math.random().toString(36).slice(2, 9)}`; },
        parseJSON(raw) {
            if (typeof raw !== 'string') return null;
            let txt = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
            const s = txt.indexOf('{'), e = txt.lastIndexOf('}');
            if (s === -1 || e === -1 || e <= s) return null;
            try { return JSON.parse(txt.slice(s, e + 1)); } catch { return null; }
        },
        truncate(str, max = 80) { const s = String(str).replace(/\s+/g, ' ').trim(); return s.length > max ? s.slice(0, max).trimEnd() + '…' : s; },
        truncatePreserve(str, max) { if (typeof str !== 'string') return ''; return str.length > max ? str.slice(0, max).trimEnd() + '…' : str; },
        wordCount(str) { const s = String(str).trim(); if (!s) return 0; return s.split(/\s+/).length; },
        formatBytes(bytes) { if (bytes < 1024) return bytes + ' B'; if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'; return (bytes / (1024 * 1024)).toFixed(2) + ' MB'; },
        byteSize(str) { try { return new Blob([String(str)]).size; } catch (_) { try { return new TextEncoder().encode(String(str)).length; } catch (__) { return String(str).length; } } },
        shieldFromHost(el) {
            ['pointerdown','mousedown','pointerup','mouseup','click','dblclick','contextmenu','input','beforeinput','keydown','keyup','keypress'].forEach(evt => {
                el.addEventListener(evt, (e) => e.stopPropagation(), false);
            });
            return el;
        }
    };

    function truncRunText(str, max) {
        if (typeof str !== 'string') return '';
        const lim = max || CONFIG.HISTORY_RUN_MAX_CHARS || 8000;
        return str.length > lim ? str.slice(0, lim).trimEnd() + '…' : str;
    }
    function truncCallText(str, max) {
        if (typeof str !== 'string') return '';
        const lim = max || CONFIG.HISTORY_CALL_MAX_CHARS || 3000;
        return str.length > lim ? str.slice(0, lim).trimEnd() + '…' : str;
    }

