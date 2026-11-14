// ===== src/theme.js =====
// Description: Stores and applies the interface theme preference (auto, light, or dark).
// Interfaces:
//   Provides: Theme
//   Consumes: GM_getValue, GM_setValue
// Interactions:
//   Bootstrap applies the stored theme; settings and menu commands change it;
//   styles.js reads the data-pe-theme attribute.
const Theme = (() => {
    const STORAGE_KEY = 'pe_theme';
    const MODES = Object.freeze(['auto', 'light', 'dark']);
    const ATTR = 'data-pe-theme';

    const normalize = (mode) => (MODES.includes(mode) ? mode : 'auto');

    function detectHostTheme() {
        const root = document.documentElement;
        const body = document.body;

        // 1) Tema do site host (classes e atributos comuns)
        if (root?.classList?.contains('dark') || body?.classList?.contains('dark')) return 'dark';
        if (root?.classList?.contains('light') || body?.classList?.contains('light')) return 'light';
        if (typeof root?.getAttribute === 'function' && root.getAttribute('data-theme') === 'dark') return 'dark';
        if (typeof body?.getAttribute === 'function' && body.getAttribute('data-theme') === 'dark') return 'dark';
        if (typeof root?.getAttribute === 'function' && root.getAttribute('data-theme') === 'light') return 'light';
        if (typeof body?.getAttribute === 'function' && body.getAttribute('data-theme') === 'light') return 'light';
        if (typeof root?.getAttribute === 'function' && root.getAttribute('data-color-scheme') === 'dark') return 'dark';
        if (typeof body?.getAttribute === 'function' && body.getAttribute('data-color-scheme') === 'dark') return 'dark';
        if (typeof root?.getAttribute === 'function' && root.getAttribute('data-color-scheme') === 'light') return 'light';
        if (typeof body?.getAttribute === 'function' && body.getAttribute('data-color-scheme') === 'light') return 'light';

        // 2) color-scheme computado via CSS
        try {
            if (typeof getComputedStyle === 'function') {
                const scheme = getComputedStyle(root).colorScheme;
                if (scheme === 'dark') return 'dark';
                if (scheme === 'light') return 'light';
            }
        } catch (_) {}

        // 3) Tema do sistema (prefers-color-scheme)
        try {
            if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
        } catch (_) {}
        return 'light';
    }

    function observe(callback) {
        const root = document.documentElement;
        const body = document.body;
        if (!root || !body || typeof MutationObserver !== 'function') return () => {};
        const observer = new MutationObserver(() => {
            try { callback(); } catch (_) {}
        });
        observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-scheme', 'style'] });
        observer.observe(body, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-scheme', 'style'] });
        return () => observer.disconnect();
    }

    function get() {
        try {
            return normalize(typeof GM_getValue === 'function' ? GM_getValue(STORAGE_KEY, 'auto') : 'auto');
        } catch (_) {
            return 'auto';
        }
    }

    function apply(mode = get()) {
        const root = document.documentElement;
        if (!root) return;
        const resolvedMode = mode === 'auto' ? detectHostTheme() : mode;
        if (resolvedMode === 'light') root.removeAttribute(ATTR);
        else root.setAttribute(ATTR, resolvedMode);
    }

    function set(mode) {
        const next = normalize(mode);
        try { GM_setValue(STORAGE_KEY, next); } catch (_) {}
        apply(next);
        try { window.dispatchEvent(new CustomEvent('pe:theme-changed', { detail: { mode: next } })); } catch (_) {}
        return next;
    }

    function cycle() {
        return set(MODES[(MODES.indexOf(get()) + 1) % MODES.length]);
    }

    function resolved() {
        const mode = get();
        if (mode !== 'auto') return mode;
        return detectHostTheme();
    }

    return { MODES, get, set, apply, cycle, resolved };
})();

if (typeof window !== 'undefined') { window.Theme = Theme; }
