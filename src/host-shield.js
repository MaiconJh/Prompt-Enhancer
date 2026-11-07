// ===== src/host-shield.js =====
    const HostShield = (() => {
        let installed = false;
        const isInsideScope = (t) => t && t.closest && t.closest('.pe-scope');
        const findFocusable = (t) => t && t.closest && t.closest('input, textarea, [contenteditable=""], [contenteditable="true"]');
        function install() {
            if (installed) return;
            installed = true;
            ['pointerdown', 'mousedown', 'click'].forEach((evt) => {
                window.addEventListener(evt, (e) => {
                    if (!isInsideScope(e.target)) return;
                    const focusable = findFocusable(e.target);
                    if (!focusable) return;
                    e.stopPropagation();
                    if (evt !== 'click') focusable.focus({ preventScroll: true });
                }, true);
            });
            window.addEventListener('focusin', (e) => {
                if (!isInsideScope(e.target)) return;
                e.stopPropagation();
            }, true);
        }
        return { install };
    })();

