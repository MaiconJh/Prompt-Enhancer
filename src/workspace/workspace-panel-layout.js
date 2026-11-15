// ===== src/workspace/workspace-panel-layout.js =====
const WorkspacePanelLayout = (() => {
    const MIN_WIDTH = 180;
    const MAX_WIDTH = 420;
    const INITIAL_WIDTH = 240;
    const STEP = 16;

    function create({ root, initialWidth = INITIAL_WIDTH, minWidth = MIN_WIDTH, maxWidth = MAX_WIDTH } = {}) {
        const separator = document.createElement('div');
        separator.className = 'pe-workspace__splitter';
        separator.tabIndex = 0;
        separator.setAttribute('role', 'separator');
        separator.setAttribute('aria-orientation', 'vertical');
        separator.setAttribute('aria-label', I18n.t('ws.layout.resizeExplorer'));
        separator.setAttribute('aria-valuemin', String(minWidth));
        separator.setAttribute('aria-valuemax', String(maxWidth));

        let width = 0;
        let pointerStart = null;
        const clamp = value => Math.max(minWidth, Math.min(maxWidth, value));
        const setWidth = value => {
            width = clamp(Math.round(value));
            root.style.setProperty('--pe-workspace-explorer-width', width + 'px');
            separator.setAttribute('aria-valuenow', String(width));
            return width;
        };

        const onPointerDown = event => {
            if (event.button !== 0) return;
            pointerStart = { x: event.clientX, width };
            separator.classList.add('is-resizing');
            separator.setPointerCapture?.(event.pointerId);
            event.preventDefault();
        };
        const onPointerMove = event => {
            if (!pointerStart) return;
            setWidth(pointerStart.width + event.clientX - pointerStart.x);
        };
        const stopResize = () => {
            pointerStart = null;
            separator.classList.remove('is-resizing');
        };
        const onKeyDown = event => {
            let next = null;
            if (event.key === 'ArrowLeft') next = width - STEP;
            else if (event.key === 'ArrowRight') next = width + STEP;
            else if (event.key === 'Home') next = minWidth;
            else if (event.key === 'End') next = maxWidth;
            if (next === null) return;
            event.preventDefault();
            setWidth(next);
        };

        separator.addEventListener('pointerdown', onPointerDown);
        separator.addEventListener('pointermove', onPointerMove);
        separator.addEventListener('pointerup', stopResize);
        separator.addEventListener('pointercancel', stopResize);
        separator.addEventListener('lostpointercapture', stopResize);
        separator.addEventListener('keydown', onKeyDown);
        setWidth(initialWidth);

        return {
            splitter: separator,
            getWidth: () => width,
            setWidth,
            destroy() {
                separator.removeEventListener('pointerdown', onPointerDown);
                separator.removeEventListener('pointermove', onPointerMove);
                separator.removeEventListener('pointerup', stopResize);
                separator.removeEventListener('pointercancel', stopResize);
                separator.removeEventListener('lostpointercapture', stopResize);
                separator.removeEventListener('keydown', onKeyDown);
                stopResize();
            }
        };
    }

    return { create, limits: Object.freeze({ minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH, initialWidth: INITIAL_WIDTH, step: STEP }) };
})();
