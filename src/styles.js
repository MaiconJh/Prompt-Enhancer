// ===== src/styles.js =====
let peStylesInjected = false;

function injectStyles() {
    if (peStylesInjected || document.getElementById('pe-core-styles')) return;

    const PE_SCOPES = '.pe-scope, .pe-modal-backdrop, .pe-agents-popover, .pe-float-wrap, .pe-toast';
    const PE_LIGHT_TOKENS = `
            /* Superfícies Sólidas */
            --pe-surface: #ffffff;
            --pe-surface-2: #f7f8fa;
            --pe-surface-3: #eef0f3;
            --pe-surface-code: #f9fafb;
            --pe-overlay: rgba(15, 18, 25, .42);

            /* Superfícies Translúcidas (Glassmorphism Tokenizado) */
            --pe-glass-backdrop: rgba(15, 18, 25, .28);
            --pe-glass-modal-bg: linear-gradient(180deg, rgba(255, 255, 255, .18) 0%, rgba(255, 255, 255, 0) 42%), rgba(255, 255, 255, .64);
            --pe-glass-modal-border: rgba(255, 255, 255, .72);
            --pe-glass-modal-shadow: 0 28px 90px -24px rgba(20, 24, 36, .26), 0 4px 16px rgba(20, 24, 36, .06), inset 0 1px 0 rgba(255, 255, 255, .95), inset 0 0 0 1px rgba(255, 255, 255, .40);
            --pe-glass-specular: linear-gradient(90deg, transparent, rgba(255, 255, 255, .78), transparent);
            --pe-glass-bar-bg: rgba(255, 255, 255, .28);
            --pe-glass-bar-border: rgba(255, 255, 255, .35);
            --pe-glass-sidebar-bg: linear-gradient(180deg, rgba(255, 255, 255, .26), rgba(255, 255, 255, .06));
            --pe-glass-sidebar-border: rgba(255, 255, 255, .30);
            --pe-glass-card-bg: rgba(255, 255, 255, .44);
            --pe-glass-card-border: rgba(255, 255, 255, .55);
            --pe-glass-card-shadow: inset 0 1px 0 rgba(255, 255, 255, .60), 0 2px 10px rgba(20, 24, 36, .03);
            --pe-glass-context-bg: linear-gradient(180deg, rgba(238, 241, 255, .55), rgba(255, 255, 255, .42));
            --pe-glass-context-border: rgba(214, 221, 255, .70);
            --pe-loading-card-bg: linear-gradient(180deg, rgba(255, 255, 255, .86), var(--pe-surface));
            --pe-loading-card-shadow: 0 24px 56px -12px rgba(16, 18, 24, .18), 0 8px 18px rgba(16, 18, 24, .08), inset 0 1px 0 rgba(255, 255, 255, .9);

            /* Tipografia & Cores de Texto */
            --pe-text: #0f1115;
            --pe-text-muted: #4b5563;
            --pe-text-faint: #575e6d;

            /* Bordas & Controles */
            --pe-border: #e6e8ec;
            --pe-border-strong: #c9cdd4;
            --pe-border-soft: #eef0f3;
            --pe-control-border: #8c93a0;
            --pe-switch-track: #9ca3af;
            --pe-switch-knob: #fff;

            /* Cores Semânticas & Feedback */
            --pe-success: #0b755b;
            --pe-success-soft: #e7f6f1;
            --pe-error: #cf2e2e;
            --pe-error-soft: #fdecec;
            --pe-warning: #b45309;
            --pe-warning-soft: #fef3c7;

            /* Cor de Destaque (Brand / Accent) */
            --pe-accent: #4d6bfe;
            --pe-accent-hover: #3d5ce6;
            --pe-accent-soft: #eef1ff;
            --pe-accent-border: #d6ddff;
            --pe-accent-text: #3d4dc4;

            /* Geometria & Espaçamento */
            --pe-radius-sm: 6px;
            --pe-radius: 10px;
            --pe-radius-lg: 14px;
            --pe-radius-pill: 999px;
            --pe-space-1: 4px;
            --pe-space-2: 8px;
            --pe-space-3: 12px;
            --pe-space-4: 16px;
            --pe-space-5: 20px;
            --pe-space-6: 24px;
            --pe-space-7: 32px;
            --pe-space-8: 40px;
            --pe-gap-3: var(--pe-space-3);

            /* Elevação & Focus Rings */
            --pe-shadow-1: 0 1px 2px rgba(16, 18, 24, .06), 0 0 0 1px rgba(16, 18, 24, .02);
            --pe-shadow-2: 0 4px 12px rgba(16, 18, 24, .08), 0 1px 3px rgba(16, 18, 24, .04);
            --pe-shadow-3: 0 24px 48px -12px rgba(16, 18, 24, .24), 0 4px 12px rgba(16, 18, 24, .08);
            --pe-shadow-panel: 0 18px 40px rgba(16, 18, 24, .12), 0 6px 18px rgba(16, 18, 24, .08);
            --pe-focus-ring: 0 0 0 3px rgba(77, 107, 254, .18);
            --pe-accent-ring: 0 0 0 3px rgba(77, 107, 254, .18);
            --pe-disabled-opacity: 0.48;

            /* Camadas de Empilhamento (Z-Index Hierárquico) */
            --pe-z-modal: 2147483644;
            --pe-z-float: 2147483645;
            --pe-z-popover: 2147483646;
            --pe-z-toast: 2147483647;

            /* Famílias e Escala Tipográfica */
            --pe-font: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif;
            --pe-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            --pe-fs-3xs: 10px;
            --pe-fs-2xs: 11px;
            --pe-fs-xs: 11.5px;
            --pe-fs-sub: 12px;
            --pe-fs-sm: 12.5px;
            --pe-fs-base: 13px;
            --pe-fs-md: 13.5px;
            --pe-fs-lead: 14px;
            --pe-fs-lg: 14.5px;
            --pe-fs-title: 15px;
            --pe-fs-xl: 16px;
            --pe-fs-h5: 17px;
            --pe-fs-2xl: 20px;
            --pe-lh-tight: 1.25;
            --pe-lh-base: 1.5;
            --pe-lh-loose: 1.6;
            --pe-fw-regular: 400;
            --pe-fw-medium: 500;
            --pe-fw-semi: 600;
            --pe-fw-bold: 650;

            /* Motion & Curvas de Animação */
            --pe-dur-instant: 100ms;
            --pe-dur-fast: 160ms;
            --pe-dur-base: 240ms;
            --pe-dur-slow: 360ms;
            --pe-ease-standard: cubic-bezier(.2, 0, 0, 1);
            --pe-ease-enter: cubic-bezier(.05, .7, .1, 1);
            --pe-ease-exit: cubic-bezier(.3, 0, .8, .15);
            --pe-ease-spring: cubic-bezier(.34, 1.56, .64, 1);
            --pe-ease-emph: cubic-bezier(.2, 0, 0, 1);
            --pe-ease-out: cubic-bezier(0, 0, .2, 1);
    `;
    const PE_DARK_TOKENS = `
            /* Superfícies Sólidas */
            --pe-surface: #17181c;
            --pe-surface-2: #1f2127;
            --pe-surface-3: #2a2d34;
            --pe-surface-code: #1b1d22;
            --pe-overlay: rgba(0, 0, 0, .55);

            /* Superfícies Translúcidas (Glassmorphism Tokenizado) */
            --pe-glass-backdrop: rgba(2, 6, 23, .48);
            --pe-glass-modal-bg: rgba(15, 17, 22, .62);
            --pe-glass-modal-border: rgba(255, 255, 255, .14);
            --pe-glass-modal-shadow: 0 18px 44px rgba(0, 0, 0, .45), inset 0 1px 0 rgba(255, 255, 255, .1);
            --pe-glass-specular: linear-gradient(90deg, transparent, rgba(255, 255, 255, .15), transparent);
            --pe-glass-bar-bg: rgba(255, 255, 255, .02);
            --pe-glass-bar-border: rgba(255, 255, 255, .06);
            --pe-glass-sidebar-bg: rgba(255, 255, 255, .01);
            --pe-glass-sidebar-border: rgba(255, 255, 255, .06);
            --pe-glass-card-bg: rgba(255, 255, 255, .04);
            --pe-glass-card-border: rgba(255, 255, 255, .08);
            --pe-glass-card-shadow: inset 0 1px 0 rgba(255, 255, 255, .04), 0 4px 12px rgba(0, 0, 0, .15);
            --pe-glass-context-bg: rgba(255, 255, 255, .04);
            --pe-glass-context-border: rgba(255, 255, 255, .08);
            --pe-loading-card-bg: linear-gradient(180deg, rgba(255, 255, 255, .03), transparent 35%), var(--pe-surface);
            --pe-loading-card-shadow: 0 24px 56px -12px rgba(15, 18, 25, .45), 0 8px 18px rgba(15, 18, 25, .18), inset 0 1px 0 rgba(255, 255, 255, .06);

            /* Tipografia & Cores de Texto */
            --pe-text: #f2f3f5;
            --pe-text-muted: #a3a8b3;
            --pe-text-faint: #8d94a2;

            /* Bordas & Controles */
            --pe-border: #2a2d34;
            --pe-border-strong: #3d414a;
            --pe-border-soft: #22252b;
            --pe-control-border: #525866;
            --pe-switch-track: #474d5b;
            --pe-switch-knob: var(--pe-surface);

            /* Cores Semânticas & Feedback */
            --pe-success: #2ecc9b;
            --pe-success-soft: #16332b;
            --pe-error: #ff6b6b;
            --pe-error-soft: #3a1a1a;
            --pe-warning: #f5b94c;
            --pe-warning-soft: #3a2b0f;

            /* Cor de Destaque (Brand / Accent) */
            --pe-accent: #8fa3ff;
            --pe-accent-hover: #a3b3ff;
            --pe-accent-soft: #232945;
            --pe-accent-border: #38427a;
            --pe-accent-text: #b8c5ff;

            /* Elevação & Focus Rings */
            --pe-focus-ring: 0 0 0 3px rgba(143, 163, 255, .22);
            --pe-accent-ring: 0 0 0 3px rgba(143, 163, 255, .22);
            --pe-shadow-1: 0 1px 2px rgba(0, 0, 0, .22), 0 0 0 1px rgba(255, 255, 255, .02);
            --pe-shadow-2: 0 4px 12px rgba(0, 0, 0, .25), 0 1px 3px rgba(0, 0, 0, .18);
            --pe-shadow-3: 0 24px 48px -12px rgba(0, 0, 0, .42), 0 4px 12px rgba(0, 0, 0, .2);
    `;

    const css = `
        /* ════════════════════════════════════════════════════════════════════
           1. DESIGN TOKENS & ESCOPO BASE (Light & Dark Mode)
           ════════════════════════════════════════════════════════════════════ */
        :where(${PE_SCOPES}) {
            ${PE_LIGHT_TOKENS}
        }

        /* escuro forçado ou tema do site/sistema resolvido pelo JS */
        :root[data-pe-theme="dark"] :where(${PE_SCOPES}) {
            ${PE_DARK_TOKENS}
        }

        /* luz forçada */
        :root[data-pe-theme="light"] :where(${PE_SCOPES}) {
            ${PE_LIGHT_TOKENS}
        }

        /* Reset de Escopo & Focus Global */
        :where(.pe-scope, .pe-mount, .pe-modal-backdrop, .pe-agents-popover, .pe-float-wrap, .pe-toast),
        :where(.pe-scope, .pe-mount, .pe-modal-backdrop, .pe-agents-popover, .pe-float-wrap, .pe-toast) *,
        :where(.pe-scope, .pe-mount, .pe-modal-backdrop, .pe-agents-popover, .pe-float-wrap, .pe-toast) *::before,
        :where(.pe-scope, .pe-mount, .pe-modal-backdrop, .pe-agents-popover, .pe-float-wrap, .pe-toast) *::after {
            box-sizing: border-box;
        }

        .pe-scope :focus-visible {
            outline: 2px solid var(--pe-accent);
            outline-offset: 2px;
            border-radius: inherit;
            box-shadow: none;
        }

        /* ════════════════════════════════════════════════════════════════════
           2. UTILITÁRIOS, ÍCONES, BOTÕES & ACTIONBAR
           ════════════════════════════════════════════════════════════════════ */
        .pe-scope .pe-ico,
        .pe-ico {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
            display: inline-block;
            vertical-align: middle;
        }

        .pe-mount {
            display: block;
            width: 100%;
            position: relative;
            font-family: var(--pe-font);
            margin-bottom: var(--pe-space-2);
        }

        .pe-actionbar {
            display: flex;
            align-items: center;
            gap: var(--pe-space-1);
            padding: var(--pe-space-1) var(--pe-space-2);
            background: transparent;
            border-bottom: 1px solid var(--pe-border-soft);
            font-family: var(--pe-font);
            font-size: var(--pe-fs-sm);
            line-height: 1;
            min-height: 40px;
            flex-wrap: wrap;
        }

        .pe-btn {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: var(--pe-space-2);
            height: 32px;
            padding: 0 var(--pe-space-3);
            font: var(--pe-fw-medium) var(--pe-fs-sm)/1 var(--pe-font);
            color: var(--pe-text-muted);
            background: transparent;
            border: 1px solid transparent;
            border-radius: var(--pe-radius-sm);
            cursor: pointer;
            user-select: none;
            white-space: nowrap;
            overflow: hidden;
            isolation: isolate;
            transition: background var(--pe-dur-fast), color var(--pe-dur-fast), border-color var(--pe-dur-fast), opacity var(--pe-dur-fast), transform var(--pe-dur-instant);
        }
        .pe-btn:hover:not([disabled]) {
            background: var(--pe-surface-2);
            color: var(--pe-text);
        }
        .pe-btn:active:not([disabled]) {
            transform: translateY(1px);
        }
        .pe-btn[disabled] {
            opacity: var(--pe-disabled-opacity);
            cursor: not-allowed;
        }
        .pe-btn .pe-label {
            display: inline-block;
        }

        .pe-btn--primary {
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
            border-color: var(--pe-accent-border);
            font-weight: var(--pe-fw-semi);
        }
        .pe-btn--primary:hover:not([disabled]) {
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
            border-color: var(--pe-accent);
        }
        .pe-btn--primary .pe-ico {
            color: var(--pe-accent-text);
        }
        .pe-btn--primary[disabled] {
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
            border-color: var(--pe-accent-border);
        }

        .pe-btn--outline,
        .pe-btn--ghost {
            color: var(--pe-text-muted);
            background: transparent;
            border-color: transparent;
        }
        .pe-btn--outline:hover:not([disabled]),
        .pe-btn--ghost:hover:not([disabled]) {
            background: var(--pe-surface-2);
            color: var(--pe-text);
            border-color: transparent;
        }

        .pe-btn--subtle {
            height: 28px;
            padding: 0 var(--pe-space-2);
        }
        .pe-btn--icon {
            width: 32px;
            padding: 0;
        }
        .pe-btn--icon .pe-ico {
            width: 16px;
            height: 16px;
        }
        .pe-btn--danger {
            color: var(--pe-error);
        }
        .pe-btn--danger:hover:not([disabled]) {
            background: var(--pe-error-soft);
            color: var(--pe-error);
        }

        .pe-btn--agents .pe-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--pe-text-faint);
            flex-shrink: 0;
            margin-left: 2px;
            transition: background var(--pe-dur-base) ease, box-shadow var(--pe-dur-base) ease;
        }
        .pe-btn--agents.is-loaded,
        .pe-btn--agents.is-loaded:hover {
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
            border-color: var(--pe-accent-border);
        }
        .pe-btn--agents.is-loaded .pe-ico {
            color: var(--pe-accent-text);
        }
        .pe-btn--agents.is-loaded .pe-status-dot {
            background: var(--pe-accent);
            box-shadow: 0 0 0 2px var(--pe-accent-border);
        }

        .pe-btn.is-loading {
            pointer-events: none;
        }
        .pe-btn.is-loading .pe-ico,
        .pe-btn.is-loading .pe-label {
            opacity: .55;
        }
        .pe-btn.is-loading::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(100deg, transparent 20%, rgba(127, 127, 127, .10) 45%, rgba(127, 127, 127, .18) 50%, rgba(127, 127, 127, .10) 55%, transparent 80%);
            background-size: 220% 100%;
            animation: pe-shimmer 1.3s linear infinite;
            pointer-events: none;
            border-radius: inherit;
        }
        @keyframes pe-shimmer {
            from { background-position: 140% 0; }
            to { background-position: -40% 0; }
        }
        .pe-spin,
        .pe-scope .pe-modal .pe-panel__footer .pe-btn.is-loading .pe-ico {
            animation: pe-rotate 0.9s linear infinite;
        }
        @keyframes pe-rotate {
            to { transform: rotate(360deg); }
        }

        /* ════════════════════════════════════════════════════════════════════
           3. POPOVER DE AGENTES (.pe-agents-popover)
           ════════════════════════════════════════════════════════════════════ */
        .pe-agents-popover {
            position: fixed;
            top: 0;
            left: 0;
            width: 340px;
            background: var(--pe-surface);
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius);
            box-shadow: var(--pe-shadow-2);
            opacity: 0;
            transform: translateY(4px) scale(.985);
            transform-origin: bottom left;
            pointer-events: none;
            transition: opacity var(--pe-dur-fast), transform var(--pe-dur-fast) var(--pe-ease-spring);
            z-index: var(--pe-z-popover);
            overflow: hidden;
            font-family: var(--pe-font);
            font-size: var(--pe-fs-sm);
            color: var(--pe-text);
        }
        .pe-agents-popover.is-open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }
        .pe-pop-head {
            display: flex;
            align-items: center;
            gap: var(--pe-space-2);
            padding: var(--pe-space-3);
            border-bottom: 1px solid var(--pe-border-soft);
        }
        .pe-pop-head-title {
            flex: 1 1 auto;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: var(--pe-fs-sm);
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text);
            min-width: 0;
        }
        .pe-pop-head-title .pe-ico {
            color: var(--pe-accent);
        }
        .pe-pop-close {
            width: 24px;
            height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            border-radius: var(--pe-radius-sm);
            color: var(--pe-text-faint);
            cursor: pointer;
            padding: 0;
            flex-shrink: 0;
        }
        .pe-pop-close:hover {
            background: var(--pe-surface-2);
            color: var(--pe-text);
        }
        .pe-pop-close svg {
            width: 12px;
            height: 12px;
        }
        .pe-pop-body {
            padding: var(--pe-space-3);
        }
        .pe-pop-empty {
            display: flex;
            flex-direction: column;
            gap: var(--pe-space-2);
        }
        .pe-pop-empty-title {
            font-size: var(--pe-fs-sm);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text-muted);
            text-align: center;
            line-height: 1.5;
        }
        .pe-pop-empty-hint {
            font-size: var(--pe-fs-2xs);
            color: var(--pe-text-faint);
            text-align: center;
            line-height: 1.5;
        }
        .pe-pop-empty-hint code {
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-3xs);
            background: var(--pe-surface-2);
            padding: 1px 4px;
            border-radius: 3px;
        }
        .pe-pop-divider {
            height: 1px;
            background: var(--pe-border-soft);
            margin: var(--pe-space-1) 0;
        }
        .pe-pop-action {
            display: flex;
            align-items: center;
            gap: 9px;
            width: 100%;
            padding: 9px 10px;
            font-family: inherit;
            font-size: var(--pe-fs-sm);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text);
            background: transparent;
            border: none;
            border-radius: var(--pe-radius-sm);
            cursor: pointer;
            text-align: left;
        }
        .pe-pop-action:hover {
            background: var(--pe-surface-2);
        }
        .pe-pop-action .pe-ico {
            color: var(--pe-accent);
        }
        .pe-pop-action-body {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            gap: 1px;
            min-width: 0;
        }
        .pe-pop-action-title {
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text);
            line-height: 1.3;
        }
        .pe-pop-action-hint {
            font-size: var(--pe-fs-2xs);
            color: var(--pe-text-faint);
            font-weight: var(--pe-fw-regular);
            line-height: 1.3;
        }
        .pe-pop-paste {
            display: flex;
            flex-direction: column;
            gap: var(--pe-space-2);
        }
        .pe-pop-paste-name {
            width: 100%;
            padding: 8px 10px;
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-sub);
            color: var(--pe-text);
            background: var(--pe-surface);
            border: 1px solid var(--pe-control-border);
            border-radius: 7px;
            outline: none;
            min-width: 0;
            max-width: 100%;
        }
        .pe-pop-paste-textarea {
            width: 100%;
            padding: 9px 11px;
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-xs);
            line-height: 1.55;
            color: var(--pe-text);
            background: var(--pe-surface-2);
            border: 1px solid var(--pe-control-border);
            border-radius: var(--pe-radius-sm);
            outline: none;
            resize: vertical;
            min-height: 100px;
            min-width: 0;
            max-width: 100%;
        }
        .pe-pop-paste-actions {
            display: flex;
            gap: var(--pe-space-2);
        }
        .pe-pop-paste-actions button {
            flex: 1;
            padding: 6px 10px;
            font-family: inherit;
            font-size: var(--pe-fs-sub);
            font-weight: var(--pe-fw-medium);
            border-radius: var(--pe-radius-sm);
            cursor: pointer;
            border: 1px solid var(--pe-border);
            background: var(--pe-surface);
            color: var(--pe-text-muted);
        }
        .pe-pop-paste-actions button:hover {
            background: var(--pe-surface-2);
            color: var(--pe-text);
        }
        .pe-pop-paste-actions button.primary {
            background: var(--pe-accent);
            border-color: var(--pe-accent);
            color: #fff;
        }
        .pe-pop-paste-actions button[disabled] {
            opacity: var(--pe-disabled-opacity);
            cursor: not-allowed;
        }

        .pe-pop-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 2px;
            cursor: pointer;
            user-select: none;
            position: relative;
        }
        .pe-pop-toggle input {
            position: absolute;
            width: 1px;
            height: 1px;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            clip-path: inset(50%);
        }
        .pe-pop-toggle-switch {
            width: 28px;
            height: 16px;
            flex-shrink: 0;
            background: var(--pe-switch-track);
            border-radius: var(--pe-radius-pill);
            position: relative;
            transition: background var(--pe-dur-base) ease;
        }
        .pe-pop-toggle-switch::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--pe-switch-knob);
            transition: transform var(--pe-dur-base) var(--pe-ease-spring), background-color var(--pe-dur-fast) ease;
        }
        .pe-pop-toggle input:checked + .pe-pop-toggle-switch {
            background: var(--pe-accent);
        }
        .pe-pop-toggle input:checked + .pe-pop-toggle-switch::after {
            transform: translateX(12px);
        }
        .pe-pop-toggle input:focus-visible + .pe-pop-toggle-switch {
            outline: 2px solid var(--pe-accent);
            outline-offset: 2px;
        }
        .pe-pop-toggle-label {
            flex: 1 1 auto;
            font-size: var(--pe-fs-sub);
            color: var(--pe-text-muted);
            line-height: 1.3;
        }
        .pe-pop-toggle-label strong {
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text);
        }

        .pe-pop-list {
            max-height: 320px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-top: 8px;
        }
        .pe-pop-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            background: var(--pe-surface-code);
            border: 1px solid var(--pe-border);
            border-radius: 7px;
            font-size: var(--pe-fs-sub);
            min-width: 0;
        }
        .pe-pop-item__checkbox {
            display: inline-flex;
            align-items: center;
            cursor: pointer;
            flex-shrink: 0;
            position: relative;
        }
        .pe-pop-item__checkbox input {
            position: absolute;
            width: 1px;
            height: 1px;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            clip-path: inset(50%);
        }
        .pe-pop-item__checkbox input:not(:checked) + .pe-checkbox {
            background: transparent;
            border-color: var(--pe-control-border);
        }
        .pe-pop-item__checkbox input:not(:checked) + .pe-checkbox::after {
            display: none;
        }
        .pe-pop-item__checkbox input:checked + .pe-checkbox {
            border-color: var(--pe-accent);
            background: var(--pe-accent);
        }
        .pe-pop-item__checkbox input:checked + .pe-checkbox::after {
            content: '';
            position: absolute;
            left: 3.5px;
            top: 1px;
            width: 5px;
            height: 8px;
            border: solid var(--pe-surface);
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }
        .pe-pop-item__checkbox input:focus-visible + .pe-checkbox {
            outline: 2px solid var(--pe-accent);
            outline-offset: 2px;
        }
        .pe-pop-item__meta {
            flex: 1 1 auto;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 1px;
        }
        .pe-pop-item__name {
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .pe-pop-item__size {
            font-size: var(--pe-fs-2xs);
            color: var(--pe-text-faint);
            font-variant-numeric: tabular-nums;
        }
        .pe-pop-item__remove {
            width: 20px;
            height: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            border-radius: 5px;
            color: var(--pe-text-faint);
            cursor: pointer;
            padding: 0;
            flex-shrink: 0;
        }
        .pe-pop-item__remove:hover {
            background: var(--pe-surface-2);
            color: var(--pe-error);
        }
        .pe-pop-item__remove svg {
            width: 12px;
            height: 12px;
        }
        .pe-pop-total {
            margin-top: 10px;
            padding: 8px 10px;
            background: var(--pe-surface-2);
            border-radius: 7px;
            font-size: var(--pe-fs-xs);
            color: var(--pe-text-muted);
            font-variant-numeric: tabular-nums;
            text-align: center;
        }
        .pe-pop-total.is-over {
            color: var(--pe-error);
            border: 1px solid var(--pe-error);
        }
        .pe-pop-foot {
            display: flex;
            gap: var(--pe-space-2);
            padding: var(--pe-space-2) var(--pe-space-3);
            background: var(--pe-surface-code);
            border-top: 1px solid var(--pe-border-soft);
        }
        .pe-pop-foot-btn {
            flex: 1;
            min-width: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 6px 8px;
            font-family: inherit;
            font-size: var(--pe-fs-xs);
            font-weight: var(--pe-fw-medium);
            border-radius: var(--pe-radius-sm);
            cursor: pointer;
            border: 1px solid var(--pe-border);
            background: var(--pe-surface);
            color: var(--pe-text-muted);
            white-space: nowrap;
        }
        .pe-pop-foot-btn .pe-ico {
            width: 12px;
            height: 12px;
        }
        .pe-pop-foot-btn:hover {
            background: var(--pe-surface-2);
            color: var(--pe-text);
        }
        .pe-pop-foot-btn.danger {
            color: var(--pe-error);
            border-color: var(--pe-error-soft);
        }
        .pe-pop-foot-btn.danger:hover {
            background: var(--pe-error-soft);
            border-color: var(--pe-error);
            color: var(--pe-error);
        }

        /* ════════════════════════════════════════════════════════════════════
           4. PAINEL INLINE, ACORDEÕES ACESSÍVEIS & FORMULÁRIOS DE PERGUNTAS
           ════════════════════════════════════════════════════════════════════ */
        /* Sistema Unificado de Collapse Acessível (0fr -> 1fr + visibility) */
        .pe-inline-slot,
        .pe-prompt-base__content,
        .pe-q-content,
        .pe-code-wrap,
        .pe-debug,
        .pe-model-expand {
            display: grid;
            grid-template-rows: 0fr;
            visibility: hidden;
            transition: grid-template-rows var(--pe-dur-base) var(--pe-ease-emph),
                        visibility 0s linear var(--pe-dur-base);
        }
        .pe-inline-slot {
            transition-duration: var(--pe-dur-slow);
        }
        .pe-inline-slot.is-open,
        .pe-prompt-base.is-expanded .pe-prompt-base__content,
        .pe-q-item.is-open .pe-q-content,
        .pe-code-wrap.is-visible,
        .pe-debug.is-open,
        .pe-model-card.is-active .pe-model-expand {
            grid-template-rows: 1fr;
            visibility: visible;
            transition: grid-template-rows var(--pe-dur-base) var(--pe-ease-emph),
                        visibility 0s linear 0s;
        }
        .pe-inline-clip,
        .pe-prompt-base__content > div,
        .pe-q-content > div,
        .pe-code-clip,
        .pe-debug__clip,
        .pe-model-expand__clip {
            overflow: hidden;
            min-height: 0;
        }

        .pe-panel {
            position: relative;
            margin: 6px 6px 8px;
            max-height: min(58vh, 520px);
            display: flex;
            flex-direction: column;
            background: var(--pe-surface);
            color: var(--pe-text);
            border: 1px solid var(--pe-border-strong);
            border-radius: var(--pe-radius-lg);
            box-shadow: var(--pe-shadow-1);
            font-family: var(--pe-font);
            font-size: var(--pe-fs-lead);
            overflow: hidden;
            opacity: 0;
            min-width: 0;
            transition: opacity var(--pe-dur-fast) ease;
        }
        .pe-inline-slot.is-open .pe-panel,
        .pe-panel.is-open {
            opacity: 1;
        }
        .pe-panel__header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-bottom: 1px solid var(--pe-border);
            flex-shrink: 0;
            min-width: 0;
        }
        .pe-panel__header h4 {
            margin: 0;
            font-size: var(--pe-fs-lg);
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text);
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 0 1 auto;
        }
        .pe-panel__header-extra {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1 1 auto;
            min-width: 0;
        }
        .pe-panel__close {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            padding: 0;
            color: var(--pe-text-muted);
            background: transparent;
            border: 1px solid transparent;
            border-radius: var(--pe-radius-sm);
            cursor: pointer;
            flex-shrink: 0;
            margin-left: auto;
        }
        .pe-panel__close:hover {
            color: var(--pe-text);
            background: var(--pe-surface-2);
        }
        .pe-panel__body {
            position: relative;
            padding: 14px 16px;
            overflow: hidden auto;
            flex: 1 1 auto;
            overscroll-behavior: contain;
            min-height: 60px;
            min-width: 0;
        }
        .pe-panel__footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: var(--pe-gap-3);
            padding: 10px 16px;
            border-top: 1px solid var(--pe-border);
            flex-shrink: 0;
        }
        .pe-panel__expand {
            font-size: var(--pe-fs-sub);
            color: var(--pe-text-muted);
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: var(--pe-radius-sm);
            font-weight: var(--pe-fw-medium);
            font-family: inherit;
        }
        .pe-panel__expand:hover {
            background: var(--pe-surface-2);
            color: var(--pe-text);
        }
        .pe-panel__actions {
            display: flex;
            gap: var(--pe-gap-3);
        }

        .pe-progress-inline {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1 1 auto;
            min-width: 0;
        }
        .pe-progress-inline .pe-progress-track {
            flex: 1 1 auto;
            height: 4px;
            background: var(--pe-surface-2);
            border-radius: var(--pe-radius-pill);
            overflow: hidden;
            min-width: 40px;
        }
        .pe-progress-inline .pe-progress-fill {
            height: 100%;
            width: 0;
            background: var(--pe-accent);
            border-radius: var(--pe-radius-pill);
            transition: width var(--pe-dur-slow) var(--pe-ease-emph);
        }
        .pe-progress-inline .pe-progress-label {
            font-size: var(--pe-fs-sub);
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text-muted);
            white-space: nowrap;
            flex-shrink: 0;
            font-variant-numeric: tabular-nums;
        }

        .pe-section-label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: var(--pe-fs-2xs);
            font-weight: var(--pe-fw-semi);
            text-transform: uppercase;
            letter-spacing: .08em;
            color: var(--pe-text-faint);
            margin: 14px 0 6px;
        }
        .pe-section-label:first-child {
            margin-top: 0;
        }
        .pe-section-label svg {
            width: 12px;
            height: 12px;
            flex-shrink: 0;
        }

        .pe-agents-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            background: var(--pe-accent-soft);
            border: 1px solid var(--pe-accent-border);
            border-radius: var(--pe-radius);
            font-size: var(--pe-fs-sub);
            color: var(--pe-accent-text);
        }
        .pe-agents-indicator__body {
            flex: 1 1 auto;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 1px;
        }
        .pe-agents-indicator__title {
            font-weight: var(--pe-fw-semi);
            color: var(--pe-accent-text);
        }
        .pe-agents-indicator__meta {
            font-size: var(--pe-fs-2xs);
            opacity: .85;
            font-variant-numeric: tabular-nums;
        }

        .pe-field {
            margin-bottom: 14px;
        }
        .pe-field:last-child {
            margin-bottom: 0;
        }
        .pe-field-label {
            display: block;
            font-size: var(--pe-fs-2xs);
            font-weight: var(--pe-fw-semi);
            text-transform: uppercase;
            letter-spacing: .08em;
            color: var(--pe-text-faint);
            margin-bottom: 6px;
        }
        .pe-field-text {
            max-height: 240px;
            overflow: auto;
            padding: 12px 14px;
            background: var(--pe-surface-2);
            border: 1px solid var(--pe-control-border);
            border-radius: var(--pe-radius);
            white-space: pre-wrap;
            word-break: break-word;
            overflow-wrap: anywhere;
            line-height: 1.55;
            font-size: var(--pe-fs-md);
            color: var(--pe-text);
            min-width: 0;
            max-width: 100%;
        }
        .pe-list {
            margin: 8px 0 0 0;
            padding-left: 20px;
        }
        .pe-list li {
            margin: 4px 0;
            font-size: var(--pe-fs-md);
            color: var(--pe-text);
            line-height: 1.5;
        }
        .pe-field-warning {
            background: var(--pe-surface-warn, #fffbeb);
            border: 1px solid var(--pe-warn-border, #fcd34d);
            border-radius: var(--pe-radius);
        }

        .pe-prompt-base {
            margin-bottom: 12px;
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius);
            background: var(--pe-surface-2);
            overflow: hidden;
        }
        .pe-prompt-base__trigger {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 8px 10px;
            font-family: inherit;
            font-size: var(--pe-fs-sm);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text-muted);
            background: transparent;
            border: none;
            cursor: pointer;
            text-align: left;
        }
        .pe-prompt-base__trigger:hover {
            background: var(--pe-surface-3);
            color: var(--pe-text);
        }
        .pe-prompt-base__icon {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
            color: var(--pe-text-faint);
        }
        .pe-prompt-base__label {
            flex-shrink: 0;
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text);
        }
        .pe-prompt-base__meta {
            flex: 1 1 auto;
            font-size: var(--pe-fs-sub);
            font-weight: var(--pe-fw-regular);
            color: var(--pe-text-faint);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            min-width: 0;
        }
        .pe-prompt-base__count {
            flex-shrink: 0;
            padding: 2px 6px;
            font-size: var(--pe-fs-2xs);
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text-muted);
            background: var(--pe-surface-3);
            border-radius: 4px;
            font-variant-numeric: tabular-nums;
        }
        .pe-prompt-base__chevron {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
            color: var(--pe-text-faint);
            transition: transform var(--pe-dur-base) var(--pe-ease-emph);
        }
        .pe-prompt-base.is-expanded .pe-prompt-base__chevron {
            transform: rotate(90deg);
        }
        .pe-prompt-base__text {
            padding: 10px 12px 12px;
            font-size: var(--pe-fs-base);
            line-height: 1.55;
            color: var(--pe-text);
            white-space: pre-wrap;
            word-break: break-word;
            overflow-wrap: anywhere;
            border-top: 1px solid var(--pe-border);
            max-height: 200px;
            overflow-y: auto;
            min-width: 0;
            max-width: 100%;
        }

        /* Perguntas & Respostas Interativas (.pe-q-*) */
        .pe-q-item {
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius);
            margin-bottom: 8px;
            background: var(--pe-surface);
            overflow: hidden;
            transition: border-color var(--pe-dur-fast) ease;
        }
        .pe-q-item.is-open {
            border-color: var(--pe-border-strong);
        }
        .pe-q-header {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 14px;
            cursor: pointer;
            user-select: none;
            background: transparent;
            width: 100%;
            text-align: left;
            border: none;
            font-family: inherit;
            position: relative;
            overflow: hidden;
        }
        .pe-q-header:hover {
            background: var(--pe-surface-2);
        }
        .pe-ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(107, 114, 128, .18);
            transform: scale(0);
            opacity: 1;
            animation: pe-ripple var(--pe-dur-slow) var(--pe-ease-out) forwards;
            pointer-events: none;
        }
        @keyframes pe-ripple {
            to { transform: scale(2.6); opacity: 0; }
        }
        .pe-q-num {
            flex-shrink: 0;
            width: 22px;
            height: 22px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: var(--pe-fs-xs);
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text-muted);
            background: var(--pe-surface);
            border: 1px solid var(--pe-control-border);
            border-radius: 50%;
            margin-top: 1px;
            position: relative;
            transition: background-color var(--pe-dur-fast), border-color var(--pe-dur-fast), color var(--pe-dur-fast);
        }
        .pe-q-num svg {
            width: 12px;
            height: 12px;
            stroke: currentColor;
            stroke-width: 3;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 20;
            stroke-dashoffset: 20;
            display: none;
        }
        .pe-q-item.is-answered .pe-q-num {
            background: var(--pe-accent-soft);
            color: var(--pe-accent-text);
            border-color: var(--pe-accent-border);
        }
        .pe-q-item.is-answered .pe-q-num span {
            display: none;
        }
        .pe-q-item.is-answered .pe-q-num svg {
            display: block;
            animation: pe-draw-check var(--pe-dur-slow) var(--pe-ease-out) forwards;
        }
        @keyframes pe-draw-check {
            to { stroke-dashoffset: 0; }
        }
        .pe-q-header-main {
            flex: 1;
            min-width: 0;
        }
        .pe-q-text {
            font-size: var(--pe-fs-md);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text);
            line-height: 1.45;
        }
        .pe-q-hint {
            display: block;
            font-size: var(--pe-fs-xs);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text-faint);
            margin-top: 3px;
            max-height: 30px;
        }
        .pe-q-header-main .pe-q-hint--code {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            margin-top: 4px;
            padding: 2px 8px 2px 6px;
            background: var(--pe-accent-soft);
            border: 1px solid var(--pe-accent-border);
            border-radius: 6px;
            color: var(--pe-accent-text);
            font-size: var(--pe-fs-2xs);
            font-weight: var(--pe-fw-medium);
            max-height: 24px;
            width: fit-content;
        }
        .pe-q-hint--code svg {
            width: 10px;
            height: 10px;
            flex-shrink: 0;
        }
        .pe-q-summary {
            display: block;
            font-size: var(--pe-fs-sm);
            color: var(--pe-text-muted);
            margin-top: 4px;
            line-height: 1.4;
            opacity: 0;
            max-height: 0;
            overflow: hidden;
            transition: opacity var(--pe-dur-base) var(--pe-ease-out), max-height var(--pe-dur-base) var(--pe-ease-out);
        }
        .pe-q-summary__value {
            color: var(--pe-text);
            font-weight: var(--pe-fw-semi);
        }
        .pe-q-item.is-answered:not(.is-open) .pe-q-hint {
            opacity: 0;
            max-height: 0;
            overflow: hidden;
        }
        .pe-q-item.is-answered:not(.is-open) .pe-q-summary {
            opacity: 1;
            max-height: 60px;
        }
        .pe-q-chevron {
            flex-shrink: 0;
            width: 16px;
            height: 16px;
            color: var(--pe-text-faint);
            margin-top: 3px;
            transition: transform var(--pe-dur-base) var(--pe-ease-emph);
        }
        .pe-q-item.is-open .pe-q-chevron {
            transform: rotate(180deg);
            color: var(--pe-text-muted);
        }
        .pe-q-content-inner {
            padding: 0 14px 12px 46px;
            min-width: 0;
        }

        /* Opções (Radio & Checkbox Customizados) */
        .pe-options-group {
            display: flex;
            flex-direction: column;
            gap: 1px;
            min-width: 0;
        }
        .pe-option {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 8px 10px;
            font-size: var(--pe-fs-base);
            color: var(--pe-text);
            background: transparent;
            border: none;
            border-left: 2px solid transparent;
            border-radius: 0 6px 6px 0;
            cursor: pointer;
            user-select: none;
        }
        .pe-option:hover {
            background: var(--pe-surface-2);
        }
        .pe-option.is-checked {
            background: var(--pe-surface-3);
            border-left-color: var(--pe-accent);
        }
        .pe-radio,
        .pe-checkbox {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
            position: relative;
        }
        .pe-radio {
            border-radius: 50%;
            border: 1.5px solid var(--pe-control-border);
        }
        .pe-checkbox {
            border-radius: 4px;
            border: 1.5px solid var(--pe-control-border);
        }
        .pe-option.is-checked .pe-radio,
        .pe-free-text.is-active .pe-radio {
            border-color: var(--pe-accent);
        }
        .pe-option.is-checked .pe-radio::after,
        .pe-free-text.is-active .pe-radio::after {
            content: '';
            position: absolute;
            inset: 3px;
            border-radius: 50%;
            background: var(--pe-accent);
        }
        .pe-option.is-checked .pe-checkbox,
        .pe-free-text.is-active .pe-checkbox {
            border-color: var(--pe-accent);
            background: var(--pe-accent);
        }
        .pe-option.is-checked .pe-checkbox::after,
        .pe-free-text.is-active .pe-checkbox::after {
            content: '';
            position: absolute;
            left: 3.5px;
            top: 1px;
            width: 5px;
            height: 8px;
            border: solid var(--pe-surface);
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }
        .pe-options-divider {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px 6px;
            font-size: var(--pe-fs-2xs);
            font-weight: var(--pe-fw-semi);
            text-transform: uppercase;
            letter-spacing: .08em;
            color: var(--pe-text-faint);
        }
        .pe-options-divider::before,
        .pe-options-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--pe-border);
        }

        .pe-free-text {
            display: flex;
            flex-direction: column;
            gap: 0;
            padding: 0;
            min-width: 0;
        }
        .pe-free-text__row {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 8px 10px;
            border-left: 2px solid transparent;
            border-radius: 0 6px 6px 0;
            cursor: pointer;
            user-select: none;
            font-size: var(--pe-fs-base);
            color: var(--pe-text);
        }
        .pe-free-text__row:hover {
            background: var(--pe-surface-2);
        }
        .pe-free-text.is-active .pe-free-text__row {
            background: var(--pe-surface-3);
            border-left-color: var(--pe-accent);
        }
        .pe-free-text__label {
            font-weight: var(--pe-fw-medium);
        }
        .pe-free-text__input-wrap {
            max-height: 0;
            overflow: hidden;
            transition: max-height var(--pe-dur-base) var(--pe-ease-emph);
        }
        .pe-free-text.is-active .pe-free-text__input-wrap {
            max-height: 200px;
        }
        .pe-free-text__input-wrap > div {
            padding: 0 10px 8px 35px;
            min-width: 0;
        }
        .pe-free-text__input {
            width: 100%;
            padding: 8px 10px;
            margin-top: 4px;
            font-family: inherit;
            font-size: var(--pe-fs-base);
            color: var(--pe-text);
            background: var(--pe-surface);
            border: 1px solid var(--pe-control-border);
            border-radius: 8px;
            outline: none;
            min-width: 0;
            max-width: 100%;
        }
        .pe-free-text__input:focus {
            border-color: var(--pe-accent);
            box-shadow: var(--pe-focus-ring);
        }
        .pe-textarea {
            width: 100%;
            padding: 9px 12px;
            font-family: inherit;
            font-size: var(--pe-fs-md);
            color: var(--pe-text);
            background: var(--pe-surface-2);
            border: 1px solid var(--pe-control-border);
            border-radius: var(--pe-radius);
            outline: none;
            resize: vertical;
            min-height: 68px;
            line-height: 1.5;
            min-width: 0;
            max-width: 100%;
        }
        .pe-textarea:focus {
            border-color: var(--pe-accent);
            background: var(--pe-surface);
            box-shadow: var(--pe-focus-ring);
        }

        /* ════════════════════════════════════════════════════════════════════
           5. ÁREA DE CÓDIGO & DROPZONE DE ARQUIVOS
           ════════════════════════════════════════════════════════════════════ */
        .pe-code-wrap {
            margin-top: 8px;
            min-width: 0;
        }
        .pe-code-area {
            position: relative;
            background: var(--pe-surface-code);
            border-radius: var(--pe-radius);
            padding: 10px 10px 8px;
            min-width: 0;
        }
        .pe-code-actions {
            position: absolute;
            top: 6px;
            right: 6px;
            display: flex;
            gap: 2px;
            padding: 2px;
            background: var(--pe-surface);
            border: 1px solid var(--pe-border);
            border-radius: 7px;
            opacity: 0;
            transform: translateY(-2px);
            pointer-events: none;
            transition: opacity var(--pe-dur-fast) ease, transform var(--pe-dur-fast) ease;
            z-index: 2;
        }
        .pe-code-area:is(:hover, :focus-within) .pe-code-actions {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }
        @media (hover: none) {
            .pe-code-actions {
                opacity: 1;
                transform: none;
                pointer-events: auto;
            }
        }
        .pe-code-action {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            font-family: inherit;
            font-size: var(--pe-fs-xs);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text-muted);
            background: transparent;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .pe-code-action:hover {
            background: var(--pe-surface-2);
            color: var(--pe-text);
        }
        .pe-code-action svg {
            width: 11px;
            height: 11px;
            flex-shrink: 0;
        }
        .pe-code-tabs {
            display: flex;
            padding: 3px;
            margin: 0 0 8px;
            background: var(--pe-surface-2);
            border-radius: 7px;
            gap: 2px;
            width: fit-content;
        }
        .pe-code-tab {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 5px 12px;
            font-family: inherit;
            font-size: var(--pe-fs-sub);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text-muted);
            background: transparent;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .pe-code-tab:hover {
            color: var(--pe-text);
        }
        .pe-code-tab.is-active {
            background: var(--pe-surface);
            color: var(--pe-text);
            box-shadow: var(--pe-shadow-1);
        }
        .pe-code-tab svg {
            width: 12px;
            height: 12px;
            flex-shrink: 0;
        }
        .pe-code-pane {
            padding: 0;
            min-width: 0;
        }
        .pe-code-pane[hidden] {
            display: none;
        }
        .pe-code-textarea {
            width: 100%;
            padding: 10px 12px;
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-sub);
            line-height: 1.55;
            color: var(--pe-text);
            background: var(--pe-surface);
            border: 1px solid var(--pe-control-border);
            border-radius: 8px;
            outline: none;
            resize: vertical;
            min-height: 100px;
            min-width: 0;
            max-width: 100%;
        }
        .pe-code-textarea.is-error {
            border-color: var(--pe-error);
        }
        .pe-code-textarea-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 8px;
            padding: 0 4px;
            font-size: var(--pe-fs-xs);
            color: var(--pe-text-faint);
            gap: 8px;
            flex-wrap: wrap;
            min-width: 0;
        }
        .pe-code-lang {
            font-family: inherit;
            font-size: var(--pe-fs-xs);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text-muted);
            background: var(--pe-surface);
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius-sm);
            padding: 4px 8px;
            cursor: pointer;
            outline: none;
            max-width: 100%;
        }
        .pe-code-count {
            font-variant-numeric: tabular-nums;
        }
        .pe-code-count.is-error {
            color: var(--pe-error);
            font-weight: var(--pe-fw-semi);
        }
        .pe-code-error {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-top: 6px;
            padding: 0 4px;
            font-size: var(--pe-fs-xs);
            color: var(--pe-error);
            font-weight: var(--pe-fw-medium);
            max-height: 0;
            overflow: hidden;
            transition: max-height var(--pe-dur-base) ease;
        }
        .pe-code-error.is-visible {
            max-height: 30px;
        }
        .pe-code-error svg {
            flex-shrink: 0;
            width: 12px;
            height: 12px;
        }

        .pe-dropzone {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 20px 16px 16px;
            border: 1.5px dashed var(--pe-control-border);
            border-radius: var(--pe-radius);
            background: var(--pe-surface);
            text-align: center;
            cursor: pointer;
        }
        .pe-dropzone:hover {
            border-color: var(--pe-text-muted);
            background: var(--pe-surface-2);
        }
        .pe-dropzone__icon svg {
            width: 22px;
            height: 22px;
        }
        .pe-dropzone__title {
            font-size: var(--pe-fs-sm);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text-muted);
        }
        .pe-dropzone__hint {
            font-size: var(--pe-fs-xs);
            color: var(--pe-text-faint);
            line-height: 1.5;
        }
        .pe-dropzone__hint code {
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-2xs);
            background: var(--pe-surface-2);
            padding: 1px 4px;
            border-radius: 3px;
            color: var(--pe-text-muted);
        }
        .pe-dropzone__btn {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            margin-top: 6px;
            padding: 6px 12px;
            font-family: inherit;
            font-size: var(--pe-fs-sub);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-accent-text);
            background: var(--pe-surface);
            border: 1px solid var(--pe-accent-border);
            border-radius: 7px;
            cursor: pointer;
        }
        .pe-file-list {
            margin-top: 8px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .pe-file-list:empty {
            display: none;
        }
        .pe-file-chip {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 7px 10px;
            background: var(--pe-surface);
            border: 1px solid var(--pe-border);
            border-radius: 8px;
            font-size: var(--pe-fs-sub);
        }
        .pe-file-chip.is-new {
            animation: pe-file-pulse 0.7s var(--pe-ease-standard);
        }
        @keyframes pe-file-pulse {
            0% { box-shadow: 0 0 0 0 rgba(16, 163, 127, .45); border-color: var(--pe-success); }
            100% { box-shadow: 0 0 0 12px rgba(16, 163, 127, 0); border-color: var(--pe-border); }
        }
        .pe-file-chip svg {
            width: 14px;
            height: 14px;
            color: var(--pe-text-muted);
            flex-shrink: 0;
        }
        .pe-file-chip__name {
            flex: 1 1 auto;
            min-width: 0;
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .pe-file-chip__size {
            font-size: var(--pe-fs-2xs);
            color: var(--pe-text-faint);
            font-variant-numeric: tabular-nums;
            flex-shrink: 0;
        }
        .pe-file-chip__remove {
            width: 20px;
            height: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            border-radius: 5px;
            color: var(--pe-text-faint);
            cursor: pointer;
            padding: 0;
            flex-shrink: 0;
        }
        .pe-file-chip__remove:hover {
            background: var(--pe-surface-2);
            color: var(--pe-error);
        }
        .pe-file-chip__remove svg {
            width: 12px;
            height: 12px;
        }

        /* ════════════════════════════════════════════════════════════════════
           6. LOADING OVERLAY & COREOGRAFIA DE ESTADOS
           ════════════════════════════════════════════════════════════════════ */
        .pe-panel-loading {
            position: absolute;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 5;
            padding: 16px;
            background: color-mix(in srgb, var(--pe-surface) 92%, transparent);
            border-radius: inherit;
            overflow: hidden;
            --local-accent: #7C9CFF;
            --pe-loader-accent: var(--local-accent);
            --pe-loader-glow: rgba(124, 156, 255, .4);
        }
        .pe-panel-loading.is-active {
            display: flex;
        }
        .pe-panel-loading__card {
            position: relative;
            width: 100%;
            max-width: 380px;
            border-radius: 22px;
            padding: 12px 16px;
            background: var(--pe-loading-card-bg);
            border: 1px solid var(--pe-border);
            box-shadow: var(--pe-loading-card-shadow);
            overflow: hidden;
            isolation: isolate;
            transition: background 600ms var(--pe-ease-emph), box-shadow 600ms var(--pe-ease-emph);
            min-width: 0;
        }
        .pe-panel-loading__card::after {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(120% 100% at 100% 0%, color-mix(in srgb, var(--pe-loader-accent) 10%, transparent), transparent 38%);
            pointer-events: none;
        }
        .pe-panel-loading__halo {
            position: absolute;
            top: -16px;
            right: -16px;
            width: 110px;
            height: 110px;
            border-radius: 50%;
            background: radial-gradient(circle, var(--pe-loader-glow) 0%, transparent 65%);
            opacity: .35;
            pointer-events: none;
            filter: blur(20px);
            transition: opacity 600ms var(--pe-ease-emph), background 600ms var(--pe-ease-emph);
            z-index: 0;
        }
        .pe-panel-loading__top {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 2px;
            position: relative;
            z-index: 1;
        }
        .pe-gear-wrap {
            width: 48px;
            height: 48px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .pe-gear-wrap canvas {
            width: 48px;
            height: 48px;
            display: block;
            position: relative;
            z-index: 1;
        }
        .pe-panel-loading__body {
            position: relative;
            z-index: 1;
            min-width: 0;
        }
        .pe-panel-loading__title-wrap {
            position: relative;
            min-height: 1.3em;
        }
        .pe-panel-loading__title {
            font-size: var(--pe-fs-lg);
            font-weight: var(--pe-fw-semi);
            letter-spacing: -.015em;
            color: var(--pe-text);
            margin: 0;
            line-height: 1.3;
            transition: opacity 220ms var(--pe-ease-emph), transform 220ms var(--pe-ease-emph);
        }
        .pe-panel-loading__title.is-swapping {
            opacity: 0;
            transform: translateY(-3px);
        }
        .pe-panel-loading__sub-wrap {
            position: relative;
            min-height: 1.35em;
            margin-top: 2px;
        }
        .pe-panel-loading__sub {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            font-size: var(--pe-fs-sm);
            color: var(--pe-text-muted);
            line-height: 1.35;
            transition: opacity 220ms var(--pe-ease-emph), transform 220ms var(--pe-ease-emph);
        }
        .pe-panel-loading__sub.is-swapping {
            opacity: 0;
            transform: translateY(-3px);
        }
        .pe-dots {
            display: inline-flex;
            gap: 3px;
            align-items: center;
        }
        .pe-dots span {
            width: 3px;
            height: 3px;
            border-radius: 50%;
            background: var(--pe-text-muted);
            opacity: .4;
            animation: pe-dot-pulse 1.6s ease-in-out infinite;
        }
        .pe-dots span:nth-child(2) { animation-delay: .16s; }
        .pe-dots span:nth-child(3) { animation-delay: .32s; }
        @keyframes pe-dot-pulse {
            0%, 60%, 100% { opacity: .3; transform: scale(1); }
            30% { opacity: 1; transform: scale(1.2); }
        }
        .pe-token-pill,
        .pe-retry-pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-2xs);
            font-weight: var(--pe-fw-medium);
            border-radius: var(--pe-radius-pill);
            font-variant-numeric: tabular-nums;
            line-height: 1.4;
        }
        .pe-token-pill {
            color: var(--pe-loader-accent);
            background: color-mix(in srgb, var(--pe-loader-accent) 10%, transparent);
            border: 1px solid color-mix(in srgb, var(--pe-loader-accent) 25%, transparent);
        }
        .pe-token-pill::before {
            content: '';
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--pe-loader-accent);
            opacity: .8;
        }
        .pe-retry-pill {
            color: var(--pe-warning);
            background: color-mix(in srgb, var(--pe-warning) 12%, transparent);
            border: 1px solid color-mix(in srgb, var(--pe-warning) 30%, transparent);
        }
        .pe-retry-pill::before {
            content: '';
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--pe-warning);
            opacity: .9;
        }
        .pe-shimmer {
            position: relative;
            height: 2px;
            margin: 12px 0;
            border-radius: var(--pe-radius-pill);
            background: rgba(127, 127, 127, .06);
            overflow: hidden;
            z-index: 1;
        }
        .pe-shimmer::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 35%;
            background: linear-gradient(90deg, transparent 0%, var(--pe-loader-accent) 50%, transparent 100%);
            opacity: .65;
            animation: pe-shimmer-run 2.2s var(--pe-ease-emph) infinite;
        }
        @keyframes pe-shimmer-run {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(320%); }
        }
        .pe-panel-loading__meta {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: var(--pe-fs-xs);
            color: var(--pe-text-faint);
            flex-wrap: wrap;
        }
        .pe-panel-loading__meta-l,
        .pe-panel-loading__meta-r {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .pe-time {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-2xs);
            font-variant-numeric: tabular-nums;
            color: var(--pe-text-muted);
        }
        .pe-time__label {
            font-family: var(--pe-font);
            font-size: var(--pe-fs-3xs);
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text-faint);
            letter-spacing: .08em;
            text-transform: uppercase;
        }
        .pe-debug-toggle {
            appearance: none;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: transparent;
            border: 1px solid var(--pe-border);
            color: var(--pe-text-muted);
            font-family: var(--pe-font);
            font-size: var(--pe-fs-xs);
            font-weight: var(--pe-fw-medium);
            padding: 4px 10px;
            border-radius: var(--pe-radius-pill);
            cursor: pointer;
            transition: background var(--pe-dur-fast) ease, border-color var(--pe-dur-fast) ease, color var(--pe-dur-fast) ease;
        }
        .pe-debug-toggle:hover {
            background: var(--pe-surface-2);
            border-color: var(--pe-border-strong);
            color: var(--pe-text);
        }
        .pe-debug-toggle:focus-visible {
            outline: none;
            border-color: var(--pe-accent);
            box-shadow: var(--pe-accent-ring);
        }
        .pe-debug-toggle svg {
            width: 10px;
            height: 10px;
            flex-shrink: 0;
            transition: transform 220ms var(--pe-ease-emph);
        }
        .pe-debug-toggle[aria-expanded="true"] svg {
            transform: rotate(180deg);
        }
        .pe-cancel {
            appearance: none;
            background: transparent;
            border: 1px solid var(--pe-control-border);
            color: var(--pe-text-muted);
            font-family: var(--pe-font);
            font-size: var(--pe-fs-xs);
            font-weight: var(--pe-fw-medium);
            padding: 4px 12px;
            border-radius: var(--pe-radius-pill);
            cursor: pointer;
            transition: background var(--pe-dur-fast) ease, border-color var(--pe-dur-fast) ease, color var(--pe-dur-fast) ease, opacity var(--pe-dur-fast) ease;
        }
        .pe-cancel:hover {
            background: var(--pe-surface-2);
            border-color: var(--pe-text-muted);
            color: var(--pe-text);
        }
        .pe-cancel:focus-visible {
            outline: none;
            border-color: var(--pe-accent);
            box-shadow: var(--pe-accent-ring);
        }
        .pe-cancel[disabled] {
            opacity: var(--pe-disabled-opacity);
            cursor: wait;
        }
        .pe-debug {
            margin: 0 -16px;
            position: relative;
            z-index: 1;
        }
        .pe-debug__inner {
            margin: 14px 16px 0 16px;
            padding-top: 12px;
            border-top: 1px dashed var(--pe-border-strong);
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 0;
        }
        .pe-debug__grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 16px;
            font-size: var(--pe-fs-xs);
            min-width: 0;
        }
        .pe-debug__row {
            display: flex;
            align-items: baseline;
            gap: 6px;
            min-width: 0;
        }
        .pe-debug__key {
            flex-shrink: 0;
            min-width: 64px;
            font-family: var(--pe-font);
            font-size: var(--pe-fs-3xs);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text-faint);
            text-transform: uppercase;
            letter-spacing: .05em;
        }
        .pe-debug__val {
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-2xs);
            color: var(--pe-text-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
            transition: color 200ms var(--pe-ease-emph);
        }
        .pe-debug__val.is-muted  { color: var(--pe-text-faint); }
        .pe-debug__val.is-accent { color: var(--pe-loader-accent); }
        .pe-debug__val.is-warn   { color: var(--pe-warning); }
        .pe-debug__val.is-err    { color: var(--pe-error); }
        .pe-debug__val.is-ok     { color: var(--pe-success); }
        .pe-debug__log {
            max-height: 130px;
            overflow-y: auto;
            background: var(--pe-surface-code);
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius);
            padding: 6px 8px;
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-2xs);
            line-height: 1.55;
            scrollbar-width: thin;
            scrollbar-color: var(--pe-border-strong) transparent;
        }
        .pe-debug__log::-webkit-scrollbar { width: 6px; }
        .pe-debug__log::-webkit-scrollbar-thumb {
            background: var(--pe-border-strong);
            border-radius: 3px;
        }
        .pe-debug__log-line {
            display: flex;
            align-items: baseline;
            gap: 6px;
            color: var(--pe-text-muted);
            animation: pe-log-in 260ms var(--pe-ease-emph);
        }
        @keyframes pe-log-in {
            from { opacity: 0; transform: translateY(-2px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .pe-debug__log-line + .pe-debug__log-line {
            margin-top: 1px;
        }
        .pe-debug__log-time {
            color: var(--pe-text-faint);
            flex-shrink: 0;
            min-width: 42px;
        }
        .pe-debug__log-ev {
            color: var(--pe-loader-accent);
            flex-shrink: 0;
        }
        .pe-debug__log-detail {
            color: var(--pe-text-muted);
            min-width: 0;
            overflow-wrap: anywhere;
            word-break: break-word;
        }
        .pe-debug__log-line.is-warn .pe-debug__log-ev { color: var(--pe-warning); }
        .pe-debug__log-line.is-err .pe-debug__log-ev  { color: var(--pe-error); }
        .pe-debug__log-line.is-ok .pe-debug__log-ev   { color: var(--pe-success); }

        .pe-panel-loading[data-state="connecting"] { --pe-loader-accent: #7C9CFF; --pe-loader-glow: rgba(124, 156, 255, .4); }
        .pe-panel-loading[data-state="preparing"]   { --pe-loader-accent: rgb(148, 0, 211); --pe-loader-glow: rgb(148, 0, 211); }
        .pe-panel-loading[data-state="dispatching"] { --pe-loader-accent: rgb(128, 128, 128); --pe-loader-glow: rgb(128, 128, 128); }
        .pe-panel-loading[data-state="awaiting_ttfb"] { --pe-loader-accent: rgb(0, 255, 255); --pe-loader-glow: rgb(0, 255, 255); }
        .pe-panel-loading[data-state="awaiting_token"] { --pe-loader-accent: rgb(64, 180, 255); --pe-loader-glow: rgb(64, 180, 255); }
        .pe-panel-loading[data-state="waiting"]    { --pe-loader-accent: #9BA1AD; --pe-loader-glow: rgba(155, 161, 173, .3); }
        .pe-panel-loading[data-state="streaming"]  { --pe-loader-accent: #4D8BFF; --pe-loader-glow: rgba(77, 139, 255, .5); }
        .pe-panel-loading[data-state="finalizing"] { --pe-loader-accent: var(--pe-success); --pe-loader-glow: rgba(11, 117, 91, .45); }
        .pe-panel-loading[data-state="retrying"]   { --pe-loader-accent: var(--pe-warning); --pe-loader-glow: color-mix(in srgb, var(--pe-warning) 45%, transparent); }

        .pe-panel-loading.is-float {
            position: relative;
            inset: auto;
            display: flex;
            align-items: stretch;
            justify-content: flex-start;
            padding: 0;
            background: transparent;
            border-radius: 0;
            overflow: visible;
        }
        .pe-panel-loading.is-float .pe-panel-loading__card {
            min-width: 0;
            max-width: 400px;
            flex: 1 1 auto;
        }
        .pe-float-wrap {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: var(--pe-z-float);
            max-width: 400px;
            font-family: var(--pe-font);
        }

        /* ════════════════════════════════════════════════════════════════════
           7. ERROS, TOASTS & HISTÓRICO DE EXECUÇÃO
           ════════════════════════════════════════════════════════════════════ */
        .pe-panel-error {
            padding: 11px 13px;
            border-radius: var(--pe-radius);
            background: var(--pe-surface-2);
            border: 1px solid var(--pe-border-strong);
            border-left: 3px solid var(--pe-error);
            color: var(--pe-text);
            font-size: var(--pe-fs-base);
            font-weight: var(--pe-fw-medium);
            line-height: 1.45;
            margin-bottom: 12px;
        }
        .pe-panel-error-slot:empty {
            display: none;
        }
        .pe-panel-error-slot {
            margin-bottom: 10px;
        }
        .pe-panel-error__title {
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text);
            margin-bottom: 3px;
        }
        .pe-panel-error__desc {
            font-weight: var(--pe-fw-regular);
            color: var(--pe-text-muted);
            font-size: var(--pe-fs-sm);
            line-height: 1.4;
        }
        .pe-panel-error__details {
            margin-top: 8px;
            font-size: var(--pe-fs-xs);
        }
        .pe-panel-error__details summary {
            cursor: pointer;
            color: var(--pe-accent-text);
            font-weight: var(--pe-fw-medium);
            user-select: none;
        }
        .pe-panel-error__details pre {
            margin: 6px 0 0;
            padding: 8px 10px;
            background: var(--pe-surface-code);
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius-sm);
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-2xs);
            line-height: 1.4;
            color: var(--pe-text-muted);
            white-space: pre-wrap;
            word-break: break-word;
            overflow-wrap: anywhere;
            max-height: 180px;
            overflow: auto;
            min-width: 0;
            max-width: 100%;
        }

        .pe-toast {
            position: fixed;
            right: 18px;
            bottom: 18px;
            z-index: var(--pe-z-toast);
            max-width: 360px;
            padding: 11px 15px;
            font-family: var(--pe-font);
            font-size: var(--pe-fs-md);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text);
            background: linear-gradient(180deg, var(--pe-surface), var(--pe-surface-2));
            border: 1px solid var(--pe-border-strong);
            border-left: 3px solid var(--pe-text-muted);
            border-radius: var(--pe-radius);
            box-shadow: var(--pe-shadow-panel);
            word-break: break-word;
            pointer-events: none;
        }
        .pe-toast.is-error   { border-left-color: var(--pe-error); }
        .pe-toast.is-success { border-left-color: var(--pe-success); }
        .pe-toast.has-action,
        .pe-toast.has-details {
            pointer-events: auto;
        }
        .pe-toast__row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        .pe-toast__msg {
            flex: 1 1 auto;
            min-width: 0;
        }
        .pe-toast__msg.is-multiline {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .pe-toast__line--headline {
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text);
        }
        .pe-toast__line--detail {
            font-weight: var(--pe-fw-regular);
            font-size: var(--pe-fs-sm);
            color: var(--pe-text-muted);
            line-height: 1.4;
        }
        .pe-toast__action {
            flex-shrink: 0;
            padding: 4px 10px;
            font-family: inherit;
            font-size: var(--pe-fs-sub);
            font-weight: var(--pe-fw-semi);
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
            border: 1px solid var(--pe-accent-border);
            border-radius: var(--pe-radius-sm);
            cursor: pointer;
        }
        .pe-toast__action:hover {
            background: var(--pe-accent);
            color: #fff;
            border-color: var(--pe-accent);
        }
        .pe-toast__details {
            margin-top: 8px;
            font-size: var(--pe-fs-2xs);
        }
        .pe-toast__details summary {
            cursor: pointer;
            color: var(--pe-text-faint);
            font-weight: var(--pe-fw-medium);
            user-select: none;
        }
        .pe-toast__details pre {
            margin: 6px 0 0;
            padding: 8px 10px;
            background: var(--pe-surface-2);
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius-sm);
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-3xs);
            line-height: 1.4;
            color: var(--pe-text-muted);
            white-space: pre-wrap;
            word-break: break-word;
            overflow-wrap: anywhere;
            max-height: 200px;
            overflow: auto;
            min-width: 0;
            max-width: 100%;
        }

        /* History */
        .pe-history-item {
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius);
            margin-bottom: 8px;
            background: var(--pe-surface);
            overflow: hidden;
            min-width: 0;
        }
        .pe-history-item:last-child {
            margin-bottom: 0;
        }
        .pe-history-item__heading {
            display: flex;
            align-items: center;
            gap: 4px;
            padding-right: 6px;
            min-width: 0;
        }
        .pe-history-item__header {
            display: flex;
            flex: 1 1 auto;
            align-items: center;
            gap: 10px;
            width: 100%;
            min-width: 0;
            padding: 10px 6px 10px 12px;
            background: transparent;
            border: none;
            font-family: inherit;
            text-align: left;
            cursor: pointer;
        }
        .pe-history-item__header:hover {
            background: var(--pe-surface-2);
        }
        .pe-history-item__copy {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-width: 44px;
            min-height: 44px;
            padding: 7px 9px;
            border: 1px solid transparent;
            border-radius: 8px;
            color: var(--pe-text-muted);
            background: transparent;
            font: var(--pe-fw-medium) var(--pe-fs-xs)/1.2 var(--pe-font);
            cursor: pointer;
            transition: background var(--pe-dur-fast), color var(--pe-dur-fast), border-color var(--pe-dur-fast);
        }
        .pe-history-item__copy:hover {
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
            border-color: var(--pe-accent-border);
        }
        .pe-history-item__copy:focus-visible {
            outline: 2px solid var(--pe-accent);
            outline-offset: 1px;
            box-shadow: var(--pe-accent-ring);
        }
        .pe-history-item__status {
            flex-shrink: 0;
            width: 20px;
            height: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-size: var(--pe-fs-xs);
            font-weight: 700;
            background: var(--pe-surface-2);
        }
        .pe-history-item__status.is-success { color: var(--pe-success); }
        .pe-history-item__status.is-error   { color: var(--pe-error); }
        .pe-history-item__status.is-aborted { color: var(--pe-warning); }
        .pe-history-item__main {
            flex: 1 1 auto;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .pe-history-item__preview {
            font-size: var(--pe-fs-base);
            color: var(--pe-text);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .pe-history-item__meta {
            font-size: var(--pe-fs-2xs);
            color: var(--pe-text-faint);
            font-variant-numeric: tabular-nums;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            align-items: center;
        }
        .pe-history-item__chevron {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
            color: var(--pe-text-faint);
            transition: transform var(--pe-dur-base) var(--pe-ease-emph);
        }
        .pe-history-item.is-expanded .pe-history-item__chevron {
            transform: rotate(180deg);
        }
        .pe-history-item__details {
            display: none;
            padding: 10px 12px;
            border-top: 1px solid var(--pe-border);
            background: var(--pe-surface-code);
            min-width: 0;
        }
        .pe-history-item.is-expanded .pe-history-item__details {
            display: block;
        }
        .pe-history-badge {
            display: inline-block;
            padding: 1px 6px;
            font-size: var(--pe-fs-3xs);
            font-weight: var(--pe-fw-semi);
            text-transform: uppercase;
            letter-spacing: .05em;
            color: var(--pe-text-muted);
            background: var(--pe-surface-2);
            border-radius: 4px;
            margin-right: 6px;
        }
        .pe-history-legacy-badge {
            display: inline-block;
            padding: 1px 5px;
            font-size: var(--pe-fs-3xs);
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text-faint);
            background: var(--pe-surface-3);
            border-radius: 3px;
            margin-right: 6px;
        }
        .pe-history-outcome {
            padding: 1px 6px;
            border-radius: 3px;
            font-weight: var(--pe-fw-semi);
            font-size: var(--pe-fs-3xs);
        }
        .pe-outcome-applied   { color: var(--pe-success); background: var(--pe-success-soft); }
        .pe-outcome-cancelled { color: var(--pe-text-muted); background: var(--pe-surface-3); }
        .pe-outcome-error     { color: var(--pe-error); background: var(--pe-error-soft); }
        .pe-outcome-aborted   { color: var(--pe-warning); background: var(--pe-warning-soft); }
        .pe-outcome-pending   { color: var(--pe-accent-text); background: var(--pe-accent-soft); }

        .pe-history-section {
            margin-bottom: 10px;
            min-width: 0;
        }
        .pe-history-section:last-child {
            margin-bottom: 0;
        }
        .pe-history-section__label {
            font-size: var(--pe-fs-3xs);
            font-weight: var(--pe-fw-semi);
            text-transform: uppercase;
            letter-spacing: .08em;
            color: var(--pe-text-faint);
            margin-bottom: 4px;
        }
        .pe-history-pre {
            margin: 0;
            padding: 8px 10px;
            background: var(--pe-surface-2);
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius-sm);
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-xs);
            line-height: 1.5;
            color: var(--pe-text-muted);
            white-space: pre-wrap;
            word-break: break-word;
            overflow-wrap: anywhere;
            max-height: 220px;
            overflow: auto;
            min-width: 0;
            max-width: 100%;
        }
        .pe-history-pre.is-error {
            background: var(--pe-error-soft);
            border-color: color-mix(in srgb, var(--pe-error) 30%, transparent);
            color: var(--pe-error);
        }
        .pe-history-kv {
            font-size: var(--pe-fs-sm);
            font-family: var(--pe-mono);
            color: var(--pe-text-muted);
            font-variant-numeric: tabular-nums;
            overflow-wrap: anywhere;
        }
        .pe-history-empty {
            padding: 24px;
            text-align: center;
            color: var(--pe-text-faint);
            font-size: var(--pe-fs-base);
            line-height: 1.5;
        }
        .pe-history-call {
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius-sm);
            margin-bottom: 6px;
            background: var(--pe-surface);
            overflow: hidden;
            min-width: 0;
        }
        .pe-history-call:last-child {
            margin-bottom: 0;
        }
        .pe-history-call__header {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 7px 10px;
            background: transparent;
            border: none;
            font-family: inherit;
            text-align: left;
            cursor: pointer;
            font-size: var(--pe-fs-sub);
            min-width: 0;
        }
        .pe-history-call__header:hover {
            background: var(--pe-surface-2);
        }
        .pe-history-call__status {
            flex-shrink: 0;
            width: 16px;
            height: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-size: var(--pe-fs-3xs);
            font-weight: 700;
            background: var(--pe-surface-2);
        }
        .pe-history-call__status.is-success { color: var(--pe-success); }
        .pe-history-call__status.is-error   { color: var(--pe-error); }
        .pe-history-call__main {
            flex: 1 1 auto;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 1px;
        }
        .pe-history-call__title {
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text);
        }
        .pe-history-call__meta {
            font-size: var(--pe-fs-3xs);
            color: var(--pe-text-faint);
            font-variant-numeric: tabular-nums;
        }
        .pe-history-call__chevron {
            width: 12px;
            height: 12px;
            flex-shrink: 0;
            color: var(--pe-text-faint);
            transition: transform var(--pe-dur-base) var(--pe-ease-emph);
        }
        .pe-history-call.is-expanded .pe-history-call__chevron {
            transform: rotate(180deg);
        }
        .pe-history-call__details {
            display: none;
            padding: 8px 10px;
            border-top: 1px solid var(--pe-border);
            background: var(--pe-surface-code);
            min-width: 0;
        }
        .pe-history-call.is-expanded .pe-history-call__details {
            display: block;
        }

        /* ════════════════════════════════════════════════════════════════════
           8. PARÂMETROS, CONTEXTO & SYSTEM PROMPT
           ════════════════════════════════════════════════════════════════════ */
        .pe-param-body {
            display: flex;
            flex-direction: column;
            min-width: 0;
        }
        .pe-param-presets {
            display: flex;
            gap: 6px;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--pe-border-soft);
        }
        .pe-param-preset {
            flex: 1;
            padding: 6px 10px;
            font-family: inherit;
            font-size: var(--pe-fs-sub);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-text-muted);
            background: var(--pe-surface);
            border: 1px solid var(--pe-border);
            border-radius: 7px;
            cursor: pointer;
        }
        .pe-param-preset:hover {
            background: var(--pe-accent-soft);
            border-color: var(--pe-accent-border);
            color: var(--pe-accent-text);
        }
        .pe-param-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 12px;
            min-width: 0;
        }
        .pe-param-label {
            flex: 0 0 130px;
            font-size: var(--pe-fs-sub);
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text-muted);
            padding-top: 6px;
        }
        .pe-param-control {
            flex: 1 1 auto;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
            max-width: 100%;
        }
        .pe-param-input {
            width: 100%;
            max-width: 200px;
            padding: 6px 8px;
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-sm);
            color: var(--pe-text);
            background: var(--pe-surface-2);
            border: 1px solid var(--pe-control-border);
            border-radius: var(--pe-radius-sm);
            outline: none;
            font-variant-numeric: tabular-nums;
            min-width: 0;
        }
        .pe-param-input:focus {
            border-color: var(--pe-accent);
            background: var(--pe-surface);
            box-shadow: var(--pe-focus-ring);
        }
        select.pe-param-input {
            max-width: 240px;
            font-family: var(--pe-font);
        }
        .pe-param-hint {
            font-size: var(--pe-fs-2xs);
            color: var(--pe-text-faint);
            line-height: 1.4;
            overflow-wrap: anywhere;
        }
        .pe-param-row--full {
            flex-direction: column;
            align-items: stretch;
            gap: 6px;
            min-width: 0;
        }
        .pe-param-row--full .pe-param-label {
            flex: 0 0 auto;
            padding-top: 0;
        }
        .pe-param-row--full .pe-param-input {
            max-width: 100%;
        }

        .pe-context-info {
            padding: 12px 14px;
            background: var(--pe-surface-2);
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius);
            margin-bottom: 14px;
        }
        .pe-context-info__title {
            font-size: var(--pe-fs-base);
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text);
            margin-bottom: 4px;
        }
        .pe-context-info__text {
            font-size: var(--pe-fs-sm);
            color: var(--pe-text-muted);
            font-variant-numeric: tabular-nums;
            margin-bottom: 6px;
        }
        .pe-context-info__hint {
            font-size: var(--pe-fs-xs);
            color: var(--pe-text-faint);
            line-height: 1.4;
            margin-bottom: 10px;
        }
        .pe-context-manage {
            padding: 6px 12px;
            font-family: inherit;
            font-size: var(--pe-fs-sub);
            font-weight: var(--pe-fw-medium);
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
            border: 1px solid var(--pe-accent-border);
            border-radius: 7px;
            cursor: pointer;
            transition: background var(--pe-dur-fast), color var(--pe-dur-fast), border-color var(--pe-dur-fast), transform var(--pe-dur-fast);
        }
        .pe-context-manage:hover {
            background: var(--pe-accent);
            color: #fff;
            border-color: var(--pe-accent);
            transform: translateY(-1px);
        }

        /* System Prompt */
        .pe-scope .pe-system-prompt {
            gap: 14px;
        }
        .pe-scope .pe-system-prompt__intro {
            padding: 2px 2px 0;
        }
        .pe-scope .pe-system-prompt__title {
            margin: 0 0 4px;
            font-size: var(--pe-fs-xl);
            line-height: 1.35;
            font-weight: var(--pe-fw-bold);
            letter-spacing: -.01em;
            color: var(--pe-text);
        }
        .pe-scope .pe-system-prompt__description {
            margin: 0;
            max-width: 680px;
            font-size: var(--pe-fs-sm);
            line-height: 1.55;
            color: var(--pe-text-muted);
        }
        .pe-scope .pe-system-prompt__card {
            padding: 16px;
            background: var(--pe-surface);
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius-lg);
            min-width: 0;
        }
        .pe-scope .pe-system-prompt__editor-card {
            border-color: var(--pe-accent-border);
            box-shadow: var(--pe-shadow-1);
        }
        .pe-scope .pe-system-prompt__section-heading {
            margin-bottom: 14px;
        }
        .pe-scope .pe-system-prompt__section-heading h6 {
            margin: 0;
            font-size: var(--pe-fs-md);
            font-weight: var(--pe-fw-bold);
            line-height: 1.4;
            color: var(--pe-text);
        }
        .pe-scope .pe-system-prompt__section-heading p {
            margin: 4px 0 0;
            font-size: var(--pe-fs-sub);
            line-height: 1.45;
            color: var(--pe-text-muted);
        }
        .pe-scope .pe-system-prompt__label {
            display: block;
            margin: 0 0 6px;
            font-size: var(--pe-fs-sub);
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text-muted);
        }
        .pe-scope .pe-system-prompt__textarea {
            display: block;
            width: 100%;
            min-height: 230px;
            padding: 12px 13px;
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-sm);
            line-height: 1.6;
            tab-size: 2;
            background: linear-gradient(180deg, var(--pe-surface-code), var(--pe-surface));
            border: 1px solid var(--pe-control-border);
            border-radius: var(--pe-radius);
            resize: vertical;
            transition: border-color var(--pe-dur-fast), box-shadow var(--pe-dur-fast), background var(--pe-dur-fast);
        }
        .pe-scope .pe-system-prompt__textarea:focus {
            border-color: var(--pe-accent);
            box-shadow: var(--pe-accent-ring);
            background: var(--pe-surface);
        }
        .pe-scope .pe-system-prompt__textarea[aria-invalid="true"] {
            border-color: var(--pe-error);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--pe-error) 14%, transparent);
        }
        .pe-scope .pe-system-prompt__meta {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-top: 8px;
            min-width: 0;
        }
        .pe-scope .pe-system-prompt__count {
            flex: 0 0 auto;
            font-size: var(--pe-fs-2xs);
            font-variant-numeric: tabular-nums;
            color: var(--pe-text-faint);
        }
        .pe-scope .pe-system-prompt__feedback {
            flex: 1 1 auto;
            min-width: 0;
            text-align: right;
            font-size: var(--pe-fs-xs);
            line-height: 1.45;
            color: var(--pe-text-muted);
            overflow-wrap: anywhere;
        }
        .pe-scope .pe-system-prompt__feedback.is-error   { color: var(--pe-error); font-weight: var(--pe-fw-semi); }
        .pe-scope .pe-system-prompt__feedback.is-warning { color: var(--pe-warning); }
        .pe-scope .pe-system-prompt__feedback.is-valid   { color: var(--pe-success); }
        .pe-scope .pe-system-prompt__editor-controls {
            display: flex;
            justify-content: flex-end;
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px solid var(--pe-border-soft);
        }
        .pe-scope .pe-system-prompt__preset-fields {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 12px;
        }
        .pe-scope .pe-system-prompt__field {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            min-width: 0;
        }
        .pe-scope .pe-system-prompt__select,
        .pe-scope .pe-system-prompt__name {
            width: 100%;
            max-width: none;
            min-height: 36px;
            font-family: var(--pe-font);
            font-size: var(--pe-fs-sm);
            border: 1px solid var(--pe-control-border);
            border-radius: 8px;
        }
        .pe-scope .pe-system-prompt__helper {
            margin: 5px 0 0;
            font-size: var(--pe-fs-2xs);
            line-height: 1.4;
            color: var(--pe-text-faint);
        }
        .pe-scope .pe-system-prompt__preset-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 14px;
            padding-top: 12px;
            border-top: 1px solid var(--pe-border-soft);
        }
        .pe-scope .pe-system-prompt__preset-actions .pe-btn {
            min-height: 32px;
            padding: 6px 9px;
            font-size: var(--pe-fs-sub);
        }
        .pe-scope .pe-system-prompt__default {
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius);
            background: var(--pe-surface-2);
            overflow: hidden;
        }
        .pe-scope .pe-system-prompt__default summary {
            padding: 11px 13px;
            font-size: var(--pe-fs-sub);
            font-weight: var(--pe-fw-semi);
            color: var(--pe-text-muted);
            cursor: pointer;
            list-style-position: inside;
        }
        .pe-scope .pe-system-prompt__default summary:hover {
            color: var(--pe-text);
        }
        .pe-scope .pe-system-prompt__default[open] summary {
            border-bottom: 1px solid var(--pe-border);
        }
        .pe-scope .pe-system-prompt__default .pe-system-prompt__helper {
            margin: 12px 13px 8px;
        }
        .pe-scope .pe-system-prompt__default-textarea {
            display: block;
            width: calc(100% - 26px);
            max-width: none;
            min-height: 120px;
            margin: 0 13px 13px;
            padding: 10px 11px;
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-xs);
            line-height: 1.55;
            background: var(--pe-surface-code);
            border: 1px solid var(--pe-control-border);
            color: var(--pe-text-muted);
            resize: vertical;
        }
        .pe-scope .pe-system-prompt__default-textarea:focus {
            border-color: var(--pe-accent);
            box-shadow: var(--pe-focus-ring);
        }
        .pe-scope .pe-system-prompt__default-textarea:read-only {
            cursor: text;
        }

        /* ════════════════════════════════════════════════════════════════════
           9. MODAL PRINCIPAL (Glassmorphism Especular Tokenizado)
           ════════════════════════════════════════════════════════════════════ */
        .pe-modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: var(--pe-z-modal);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: clamp(10px, 3vw, 28px);
            background: var(--pe-glass-backdrop);
            backdrop-filter: blur(16px) saturate(1.4);
            -webkit-backdrop-filter: blur(16px) saturate(1.4);
            opacity: 0;
            transition: opacity 220ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pe-modal-backdrop.is-open {
            opacity: 1;
        }
        .pe-modal-backdrop.is-open .pe-modal {
            transform: translate3d(0, 0, 0);
            opacity: 1;
        }

        .pe-scope .pe-modal {
            position: relative;
            margin: 0;
            min-width: 0;
            width: min(1040px, 100%);
            height: min(820px, calc(100dvh - 56px));
            max-height: min(820px, calc(100dvh - 56px));
            border: 1px solid var(--pe-glass-modal-border);
            border-radius: 18px;
            background: var(--pe-glass-modal-bg);
            box-shadow: var(--pe-glass-modal-shadow);
            transform: translate3d(0, 8px, 0);
            transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .pe-scope .pe-modal::before {
            content: "";
            position: absolute;
            z-index: 1;
            top: 0;
            left: 18px;
            right: 18px;
            height: 1px;
            background: var(--pe-glass-specular);
            pointer-events: none;
        }
        .pe-scope .pe-modal .pe-panel__header {
            min-height: 76px;
            padding: 16px 22px;
            background: var(--pe-glass-bar-bg);
            border-bottom: 1px solid var(--pe-glass-bar-border);
            flex-shrink: 0;
        }
        .pe-modal-heading {
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-width: 0;
        }
        .pe-scope .pe-modal .pe-panel__header h4 {
            font-size: var(--pe-fs-h5);
            line-height: 1.25;
            letter-spacing: -.02em;
            font-weight: var(--pe-fw-bold);
            margin: 0;
        }
        .pe-modal-heading p {
            margin: 0;
            color: var(--pe-text-muted);
            font-size: var(--pe-fs-sub);
            line-height: 1.4;
        }
        .pe-scope .pe-modal .pe-panel__close {
            width: 34px;
            height: 34px;
            border: 1px solid var(--pe-border);
            background: var(--pe-surface-2);
            border-radius: var(--pe-radius);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, .15);
        }
        .pe-scope .pe-modal .pe-panel__close:hover {
            background: var(--pe-surface-3);
            color: var(--pe-text);
        }
        .pe-scope .pe-modal .pe-panel__close:focus-visible {
            outline: 2px solid var(--pe-accent);
            outline-offset: 2px;
            box-shadow: var(--pe-accent-ring);
        }

        .pe-modal-layout {
            display: flex;
            flex: 1 1 0;
            min-height: 0;
            min-width: 0;
            position: relative;
            overflow: hidden;
        }
        .pe-scope .pe-modal .pe-modal-tabs {
            flex: 0 0 224px;
            width: 224px;
            min-width: 0;
            padding: 20px 12px;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 5px;
            overflow-x: hidden;
            overflow-y: auto;
            border-bottom: 0;
            border-right: 1px solid var(--pe-glass-sidebar-border);
            background: var(--pe-glass-sidebar-bg);
        }
        .pe-scope .pe-modal .pe-modal-tabs::before {
            content: attr(data-section-label);
            padding: 0 10px 9px;
            color: var(--pe-text-faint);
            font-size: var(--pe-fs-3xs);
            line-height: 1.2;
            font-weight: 700;
            letter-spacing: .12em;
        }
        .pe-scope .pe-modal .pe-modal-tab {
            position: relative;
            display: flex;
            align-items: center;
            gap: var(--pe-space-2);
            width: 100%;
            min-height: 40px;
            margin: 0;
            padding: 8px 10px;
            border: 1px solid transparent;
            border-radius: var(--pe-radius-sm);
            color: var(--pe-text-muted);
            text-align: left;
            white-space: normal;
            font-size: var(--pe-fs-sm);
            font-weight: var(--pe-fw-medium);
            background: transparent;
            cursor: pointer;
            transition: background-color var(--pe-dur-fast) ease, color var(--pe-dur-fast) ease, border-color var(--pe-dur-fast) ease;
        }
        .pe-scope .pe-modal .pe-modal-tab:hover {
            color: var(--pe-text);
            background: var(--pe-surface);
            border-color: var(--pe-border-soft);
        }
        .pe-scope .pe-modal .pe-modal-tab:focus-visible {
            outline: 2px solid var(--pe-accent);
            outline-offset: 2px;
            box-shadow: none;
        }
        .pe-scope .pe-modal .pe-modal-tab.is-active {
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
            border-color: var(--pe-accent-border);
        }
        .pe-modal-tab .pe-ico {
            width: 16px;
            height: 16px;
            color: currentColor;
        }
        .pe-modal-tab__label {
            font-size: var(--pe-fs-sm);
            line-height: 1.35;
            font-weight: inherit;
        }
        .pe-modal-main {
            display: flex;
            flex: 1 1 0;
            flex-direction: column;
            min-width: 0;
            min-height: 0;
            background: transparent;
            position: relative;
        }

        .pe-scope .pe-modal .pe-panel__body {
            flex: 1 1 auto;
            min-height: 0;
            padding: 26px clamp(20px, 4vw, 40px) 48px;
            overflow-x: hidden;
            overflow-y: auto;
            overscroll-behavior: contain;
            scrollbar-color: var(--pe-border-strong) transparent;
            scrollbar-width: thin;
            background: transparent;
        }
        .pe-scope .pe-modal .pe-panel__body:has(> .pe-provider-settings) {
            display: flex;
            flex-direction: column;
            overflow-y: hidden;
            padding: 20px clamp(14px, 3vw, 28px) 28px;
        }
        .pe-scope .pe-modal .pe-panel__body:has(> .pe-provider-settings) > .pe-settings-intro {
            flex-shrink: 0;
            margin-bottom: 14px;
            padding-bottom: 12px;
        }
        .pe-scope .pe-modal .pe-panel__body:has(> .pe-provider-settings) > .pe-param-body.pe-provider-settings {
            flex: 1 1 0;
            min-height: 0;
            height: auto;
        }

        .pe-scope .pe-modal .pe-panel__footer {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
            min-height: 64px;
            padding: 12px 24px;
            background: var(--pe-glass-bar-bg);
            border-top: 1px solid var(--pe-glass-bar-border);
            flex-shrink: 0;
            transition: grid-template-rows 300ms ease;
        }
        .pe-scope .pe-modal .pe-panel__footer.is-collapsed {
            display: grid;
            grid-template-rows: 0fr;
            overflow: hidden;
            padding-top: 0;
            padding-bottom: 0;
            min-height: 0;
            border-top-width: 0;
        }
        .pe-scope .pe-modal .pe-panel__footer .pe-btn:first-child:not(:only-child) {
            margin-right: auto;
        }
        .pe-scope .pe-modal .pe-panel__footer .pe-btn {
            min-height: 36px;
            padding: 8px 18px;
            border-radius: 8px;
            line-height: 1.2;
            transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease;
        }
        .pe-scope .pe-modal .pe-panel__footer .pe-btn:hover:not([disabled]) {
            transform: translate3d(0, -1px, 0);
        }
        .pe-scope .pe-modal .pe-panel__footer .pe-btn--primary {
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
            border-color: var(--pe-accent-border);
            box-shadow: 0 2px 5px rgba(77, 107, 254, .12), inset 0 1px 0 rgba(255, 255, 255, .14);
        }

        .pe-settings-intro {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            margin: 0 0 22px;
            padding: 0 0 18px;
            border-bottom: 1px solid var(--pe-border-soft);
            animation: pe-settings-fade-in 180ms ease both;
        }
        .pe-settings-intro__icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 38px;
            width: 38px;
            height: 38px;
            border: 1px solid var(--pe-accent-border);
            border-radius: 11px;
            color: var(--pe-accent);
            background: linear-gradient(145deg, var(--pe-accent-soft), var(--pe-surface));
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, .25);
        }
        .pe-settings-intro__icon .pe-ico {
            width: 18px;
            height: 18px;
        }
        .pe-settings-intro__text {
            min-width: 0;
        }
        .pe-settings-intro h5 {
            margin: 0 0 4px;
            color: var(--pe-text);
            font-size: var(--pe-fs-h5);
            line-height: 1.3;
            font-weight: var(--pe-fw-bold);
            letter-spacing: -.015em;
        }
        .pe-settings-intro p {
            margin: 0;
            color: var(--pe-text-muted);
            font-size: var(--pe-fs-sm);
            line-height: 1.5;
        }

        /* Cards & Superfícies Internas do Modal */
        .pe-scope .pe-modal .pe-param-body:not(.pe-system-prompt) {
            gap: 0;
            padding: 20px;
            max-width: 680px;
            border: 1px solid var(--pe-glass-card-border);
            border-radius: 13px;
            background: var(--pe-glass-card-bg);
            box-shadow: var(--pe-glass-card-shadow);
        }
        .pe-scope .pe-modal .pe-system-prompt__card,
        .pe-scope .pe-modal .pe-history-item {
            border: 1px solid var(--pe-glass-card-border);
            border-radius: 12px;
            background: var(--pe-glass-card-bg);
            box-shadow: var(--pe-glass-card-shadow);
        }
        .pe-scope .pe-modal .pe-context-info {
            padding: 16px;
            border: 1px solid var(--pe-glass-context-border);
            border-radius: 12px;
            background: var(--pe-glass-context-bg);
            box-shadow: var(--pe-glass-card-shadow);
        }
        .pe-scope .pe-modal .pe-history-empty {
            padding: 24px;
            border: 1px dashed var(--pe-border-strong);
            border-radius: 12px;
            background: var(--pe-surface-2);
        }

        .pe-scope .pe-modal .pe-param-presets {
            gap: 4px;
            margin-bottom: 17px;
            padding-bottom: 15px;
        }
        .pe-scope .pe-modal .pe-param-preset {
            position: relative;
            min-height: 34px;
            font-size: var(--pe-fs-sub);
            border-radius: 8px;
            transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1), background-color 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
        }
        .pe-scope .pe-modal .pe-param-preset:hover {
            transform: translate3d(0, -1px, 0);
        }
        .pe-scope .pe-modal .pe-param-preset.is-active,
        .pe-scope .pe-modal .pe-param-preset[aria-pressed="true"] {
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
            border-color: var(--pe-accent);
            box-shadow: 0 0 0 2px rgba(77, 107, 254, .18), 0 3px 8px rgba(77, 107, 254, .10);
            font-weight: var(--pe-fw-bold);
        }
        .pe-scope .pe-modal .pe-param-preset:focus-visible {
            outline: 2px solid var(--pe-accent);
            outline-offset: 2px;
            box-shadow: var(--pe-accent-ring);
        }
        .pe-scope .pe-modal .pe-param-input {
            min-height: 36px;
            border-radius: 8px;
            font-size: var(--pe-fs-sm);
            background: var(--pe-surface-2);
            border-color: var(--pe-control-border);
        }
        .pe-scope .pe-modal .pe-param-input::placeholder {
            color: var(--pe-text-faint);
            opacity: 1;
        }
        .pe-scope .pe-modal .pe-param-input:focus {
            background: var(--pe-surface);
            border-color: var(--pe-accent);
        }
        .pe-scope .pe-modal .pe-param-label {
            color: var(--pe-text);
            font-size: var(--pe-fs-sm);
        }
        .pe-scope .pe-modal .pe-param-hint {
            font-size: var(--pe-fs-xs);
            line-height: 1.5;
            color: var(--pe-text-faint);
        }
        .pe-settings-errors {
            margin-bottom: 10px;
            animation: pe-settings-fade-in 160ms ease both;
        }
        @keyframes pe-settings-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        /* ════════════════════════════════════════════════════════════════════
           10. ABA PROVEDOR, ROTEAMENTO, CATÁLOGO & LISTA VIRTUALIZADA
           ════════════════════════════════════════════════════════════════════ */
        .pe-scope .pe-modal .pe-param-body.pe-provider-settings {
            max-width: none;
            gap: 10px;
            padding: 0;
            border: 0;
            background: transparent;
            box-shadow: none;
            display: flex;
            flex-direction: column;
            min-height: 0;
            flex: 1 1 0;
            height: auto;
        }
        .pe-provider-header {
            display: flex;
            flex-direction: column;
            gap: 10px;
            flex: 0 0 auto;
            min-width: 0;
        }
        .pe-provider-scroll {
            display: flex;
            flex-direction: column;
            gap: 10px;
            flex: 1 1 auto;
            min-height: 0;
            padding-right: 4px;
            padding-bottom: 32px;
        }
        .pe-catalog-loading {
            padding: 7px 10px;
            border: 1px solid var(--pe-border-soft);
            border-radius: 8px;
            color: var(--pe-text-muted);
            background: var(--pe-surface-2);
            font-size: var(--pe-fs-xs);
        }

        /* Filtros do Catálogo (Grid Responsivo Unificado) */
        .pe-catalog-filters {
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            gap: 7px;
            min-width: 0;
            padding: 0 0 var(--pe-space-3) 0;
            background: transparent;
        }
        .pe-catalog-filters .pe-param-input {
            flex: 1 1 auto;
            width: auto;
            min-width: 120px;
            min-height: 34px;
        }
        .pe-scope .pe-modal .pe-param-body.pe-provider-settings .pe-catalog-filters {
            display: grid;
            grid-template-columns: minmax(180px, 1fr) auto auto;
            align-items: center;
            gap: var(--pe-space-2);
            padding: 0;
        }
        .pe-scope .pe-modal .pe-param-body.pe-provider-settings .pe-catalog-filters > .pe-param-input {
            grid-column: 1;
            width: 100%;
            max-width: none;
            min-height: 34px;
            padding: 6px 10px;
            flex: none;
        }
        .pe-catalog-toggle {
            position: relative;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            min-height: 34px;
            padding: 6px 10px;
            border: 1px solid var(--pe-control-border);
            border-radius: var(--pe-radius-pill);
            color: var(--pe-text-muted);
            background: var(--pe-surface-2);
            font-size: var(--pe-fs-2xs);
            line-height: 1.3;
            white-space: nowrap;
            cursor: pointer;
            transition: background-color var(--pe-dur-fast), border-color var(--pe-dur-fast), color var(--pe-dur-fast);
        }
        .pe-catalog-toggle input {
            position: absolute;
            width: 1px;
            height: 1px;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            clip-path: inset(50%);
        }
        .pe-catalog-toggle:has(input:checked) {
            border-color: var(--pe-accent-border);
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
        }
        .pe-catalog-toggle:focus-within {
            outline: 2px solid var(--pe-accent);
            outline-offset: 2px;
        }
        .pe-catalog-fallback-toggle {
            padding: 8px 10px;
            border: 1px solid var(--pe-control-border);
            border-radius: 8px;
            background: var(--pe-surface-2);
        }
        .pe-catalog-fallback-toggle input {
            position: static;
            width: 15px;
            height: 15px;
            margin: 0;
            overflow: visible;
            clip: auto;
            clip-path: none;
            accent-color: var(--pe-accent);
        }
        .pe-catalog-provider-back {
            min-height: 30px;
            padding: 5px 9px;
            font-size: var(--pe-fs-2xs);
        }

        .pe-catalog-list {
            display: flex;
            flex-direction: column;
            gap: 0;
            min-height: 96px;
            overflow: auto;
            border: 1px solid var(--pe-border);
            border-radius: 9px;
            background: var(--pe-surface);
        }
        .pe-provider-settings .pe-catalog-list {
            flex: 1 1 auto;
            min-height: 150px;
            max-height: none;
            overflow: visible;
            border: 0;
            border-radius: 0;
            background: transparent;
        }
        .pe-catalog-list[hidden],
        .pe-provider-section__models[hidden],
        .pe-provider-picker[hidden] {
            display: none;
        }

        /* Provider Cards & Editor */
        .pe-provider-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            min-width: 0;
        }
        .pe-provider-section-heading {
            min-width: 0;
        }
        .pe-provider-section-heading h6 {
            margin: 0;
            color: var(--pe-text);
            font-size: var(--pe-fs-md);
            line-height: 1.4;
            font-weight: var(--pe-fw-bold);
        }
        .pe-provider-section-heading p {
            margin: 3px 0 0;
            color: var(--pe-text-muted);
            font-size: var(--pe-fs-sub);
            line-height: 1.45;
        }
        .pe-provider-toolbar > .pe-btn {
            flex: 0 0 auto;
            min-height: 38px;
            border-radius: 8px;
        }
        .pe-provider-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            min-width: 0;
        }
        .pe-provider-card {
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 0;
            padding: 14px;
            border: 1px solid var(--pe-glass-card-border);
            border-radius: 12px;
            background: var(--pe-glass-card-bg);
            box-shadow: var(--pe-glass-card-shadow);
            transition: border-color var(--pe-dur-fast), background-color var(--pe-dur-fast);
        }
        .pe-provider-card.is-active {
            border-color: var(--pe-accent);
            background: linear-gradient(180deg, var(--pe-accent-soft), var(--pe-glass-card-bg));
        }
        .pe-provider-card__header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
            min-width: 0;
        }
        .pe-provider-card__header strong {
            min-width: 0;
            color: var(--pe-text);
            font-size: var(--pe-fs-md);
            line-height: 1.4;
            font-weight: var(--pe-fw-bold);
            overflow-wrap: anywhere;
        }
        .pe-provider-card__badges {
            display: flex;
            flex: 0 0 auto;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 5px;
        }
        .pe-provider-badge,
        .pe-provider-role {
            display: inline-flex;
            align-items: center;
            min-height: 22px;
            padding: 3px 7px;
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius-pill);
            color: var(--pe-text-muted);
            background: var(--pe-surface);
            font-size: var(--pe-fs-3xs);
            line-height: 1.2;
            font-weight: var(--pe-fw-semi);
            white-space: nowrap;
        }
        .pe-provider-badge.is-dynamic,
        .pe-provider-role.is-active {
            color: var(--pe-accent-text);
            border-color: var(--pe-accent-border);
            background: var(--pe-accent-soft);
        }
        .pe-provider-badge.is-curated {
            color: var(--pe-text-muted);
            background: var(--pe-surface-2);
        }
        .pe-provider-role.is-fallback {
            color: var(--pe-warning);
            border-color: color-mix(in srgb, var(--pe-warning) 32%, var(--pe-border));
            background: var(--pe-warning-soft);
        }
        .pe-provider-card__meta {
            min-width: 0;
            padding: 8px 9px;
            border: 1px solid var(--pe-border-soft);
            border-radius: 8px;
            color: var(--pe-text-muted);
            background: var(--pe-surface-code);
            font-family: var(--pe-mono);
            font-size: var(--pe-fs-2xs);
            line-height: 1.5;
            overflow-wrap: anywhere;
            word-break: break-word;
        }
        .pe-provider-actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
            margin: 0;
        }
        .pe-provider-actions .pe-btn {
            min-height: 34px;
            padding: 7px 9px;
            border-radius: 7px;
            font-size: var(--pe-fs-xs);
        }
        .pe-provider-actions .pe-btn[aria-pressed="true"] {
            font-weight: var(--pe-fw-bold);
        }
        .pe-provider-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-left: 8px;
            padding: 3px 8px;
            border-radius: var(--pe-radius-pill);
            font-size: var(--pe-fs-xs);
            font-weight: var(--pe-fw-semi);
            line-height: 1.3;
            border: 1px solid transparent;
        }
        .pe-provider-status::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
            opacity: .8;
        }
        .pe-provider-status.is-ok {
            color: var(--pe-success);
            background: var(--pe-success-soft);
            border-color: color-mix(in srgb, var(--pe-success) 18%, transparent);
        }
        .pe-provider-status.is-error {
            color: var(--pe-error);
            background: var(--pe-error-soft);
            border-color: color-mix(in srgb, var(--pe-error) 18%, transparent);
        }
        .pe-provider-empty {
            grid-column: 1 / -1;
            padding: 20px;
            border: 1px dashed var(--pe-border-strong);
            border-radius: 12px;
            color: var(--pe-text-muted);
            background: var(--pe-surface-2);
            font-size: var(--pe-fs-sm);
            line-height: 1.55;
            text-align: center;
        }
        .pe-provider-editor-wrap:empty {
            display: none;
        }
        .pe-provider-editor {
            padding: 16px;
            border: 1px solid var(--pe-accent-border);
            border-radius: 12px;
            background: linear-gradient(180deg, var(--pe-accent-soft), var(--pe-surface));
            box-shadow: var(--pe-shadow-1);
        }
        .pe-provider-editor .pe-field-title {
            margin: 0 0 14px;
            color: var(--pe-text);
            font-size: var(--pe-fs-lg);
            line-height: 1.4;
            font-weight: var(--pe-fw-bold);
        }
        .pe-provider-editor .pe-param-row {
            margin-bottom: 13px;
        }
        .pe-provider-editor .pe-param-label {
            padding-top: 0;
            font-size: var(--pe-fs-sub);
        }
        .pe-provider-editor .pe-param-control {
            gap: 5px;
        }
        .pe-provider-editor .pe-param-input {
            width: 100%;
            max-width: none;
            min-height: 38px;
            font-family: var(--pe-font);
            font-variant-numeric: normal;
            border-color: var(--pe-control-border);
        }
        .pe-provider-editor textarea.pe-param-input {
            min-height: 110px;
            padding: 10px 11px;
            font-family: var(--pe-mono);
            line-height: 1.5;
            resize: vertical;
        }
        .pe-provider-editor .pe-check-row {
            display: flex;
            align-items: flex-start;
            gap: 9px;
            min-height: 40px;
            margin: 2px 0 14px;
            padding: 10px 11px;
            border: 1px solid var(--pe-control-border);
            border-radius: 8px;
            color: var(--pe-text);
            background: var(--pe-surface);
            font-size: var(--pe-fs-sub);
            line-height: 1.4;
            cursor: pointer;
        }
        .pe-provider-editor .pe-check-row input {
            flex: 0 0 auto;
            width: 16px;
            height: 16px;
            margin: 0;
            accent-color: var(--pe-accent);
        }
        .pe-provider-editor .pe-provider-actions {
            padding-top: 12px;
            border-top: 1px solid var(--pe-border-soft);
        }
        .pe-provider-editor .pe-provider-actions .pe-btn {
            min-height: 38px;
        }

        /* Painel de Roteamento (.pe-routing-panel) */
        .pe-routing-panel {
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius);
            background: var(--pe-surface-2);
            font-size: var(--pe-fs-sm);
            min-width: 0;
            overflow: hidden;
        }
        .pe-routing-step {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            flex: 0 1 auto;
            overflow: hidden;
        }
        .pe-routing-label {
            display: inline-flex;
            align-items: center;
            padding: 2px 7px;
            border-radius: var(--pe-radius-pill);
            font-size: var(--pe-fs-3xs);
            font-weight: var(--pe-fw-semi);
            text-transform: uppercase;
            letter-spacing: .04em;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .pe-routing-label.is-primary {
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
            border: 1px solid var(--pe-accent-border);
        }
        .pe-routing-label.is-fallback {
            color: var(--pe-warning);
            background: var(--pe-warning-soft);
            border: 1px solid color-mix(in srgb, var(--pe-warning) 28%, var(--pe-border));
        }
        .pe-routing-value {
            color: var(--pe-text);
            font-weight: var(--pe-fw-medium);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 0 1 auto;
        }
        .pe-routing-arrow {
            color: var(--pe-text-faint);
            font-size: var(--pe-fs-lg);
            flex-shrink: 0;
        }
        .pe-routing-none {
            color: var(--pe-text-faint);
            font-style: italic;
        }
        .pe-routing-clear {
            margin-left: auto;
            flex: 0 0 auto;
            min-width: 32px;
            height: 32px;
            padding: 0 10px;
            gap: 6px;
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius-sm);
            background: var(--pe-surface);
            color: var(--pe-text-muted);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: background var(--pe-dur-fast), color var(--pe-dur-fast), border-color var(--pe-dur-fast);
        }
        .pe-routing-clear:hover:not([disabled]) {
            background: var(--pe-error-soft);
            color: var(--pe-error);
            border-color: var(--pe-error);
        }
        .pe-routing-clear[disabled] {
            opacity: var(--pe-disabled-opacity);
            cursor: not-allowed;
        }

        /* Accordion de Modelos & Viewport Virtualizado */
        .pe-provider-accordion {
            display: flex;
            flex-direction: column;
            min-width: 0;
            overflow: visible;
        }
        .pe-provider-group-title {
            margin: var(--pe-space-3) 0 var(--pe-space-1);
            padding: 0 2px;
            color: var(--pe-text-faint);
            font-size: var(--pe-fs-xs);
            font-weight: var(--pe-fw-semi);
            line-height: 1.4;
            text-transform: uppercase;
            letter-spacing: .02em;
        }
        .pe-provider-group-title:first-child {
            margin-top: 0;
        }
        .pe-model-card {
            margin-bottom: var(--pe-space-2);
            border: 1px solid var(--pe-border);
            border-radius: 8px;
            background: var(--pe-surface);
            transition: border-color var(--pe-dur-fast) var(--pe-ease-standard), background-color var(--pe-dur-fast) var(--pe-ease-standard);
        }
        .pe-model-card.is-active {
            border-color: var(--pe-accent-border);
            background: var(--pe-accent-soft);
        }
        .pe-model-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            width: 100%;
            padding: 11px 12px;
            border: 0;
            border-radius: 8px;
            color: var(--pe-text);
            background: transparent;
            font: inherit;
            text-align: left;
            cursor: pointer;
        }
        .pe-model-header:focus-visible {
            outline: 2px solid var(--pe-accent);
            outline-offset: 2px;
        }
        .pe-model-card.is-active .pe-model-header {
            border-bottom: 1px solid var(--pe-border-soft);
            border-radius: 8px 8px 0 0;
        }
        .pe-model-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
            flex: 1 1 auto;
        }
        .pe-model-info__name {
            color: var(--pe-text);
            font-size: var(--pe-fs-sm);
            font-weight: var(--pe-fw-semi);
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .pe-model-info__id {
            color: var(--pe-text-muted);
            font: var(--pe-fs-2xs)/1.4 var(--pe-mono);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .pe-model-header__meta {
            display: flex;
            align-items: center;
            gap: 6px;
            flex: 0 0 auto;
        }
        .pe-model-badges {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 4px;
        }
        .pe-model-badge {
            padding: 2px 5px;
            border: 1px solid var(--pe-border-soft);
            border-radius: var(--pe-radius-pill);
            color: var(--pe-text-muted);
            background: var(--pe-surface-2);
            font-size: var(--pe-fs-3xs);
            line-height: 1.3;
            font-weight: var(--pe-fw-semi);
            white-space: nowrap;
        }
        .pe-model-badge.is-primary {
            color: var(--pe-accent-text);
            background: var(--pe-accent-soft);
            border-color: var(--pe-accent-border);
        }
        .pe-model-badge.is-fallback {
            color: var(--pe-warning);
            background: var(--pe-warning-soft);
            border-color: color-mix(in srgb, var(--pe-warning) 28%, var(--pe-border));
        }
        .pe-chevron {
            flex: 0 0 auto;
            color: var(--pe-text-faint);
            font-size: var(--pe-fs-xs);
            line-height: 1;
            transition: transform var(--pe-dur-base) var(--pe-ease-standard);
            transform: rotate(0deg);
        }
        .pe-model-card.is-active .pe-chevron {
            transform: rotate(180deg);
        }
        .pe-model-details {
            display: grid;
            grid-template-columns: max-content minmax(0, 1fr);
            gap: 5px 12px;
            min-width: 0;
            padding: 10px 11px 11px;
            font-size: var(--pe-fs-2xs);
            line-height: 1.4;
        }
        .pe-model-details dt {
            margin: 0;
            color: var(--pe-text-muted);
            font-weight: var(--pe-fw-semi);
        }
        .pe-model-details dd {
            min-width: 0;
            margin: 0;
            color: var(--pe-text);
            overflow-wrap: anywhere;
        }
        .pe-model-details__actions {
            grid-column: 1 / -1;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 4px;
        }
        .pe-model-details__actions .pe-btn {
            min-height: 35px;
            padding: 7px 10px;
            font-size: var(--pe-fs-xs);
        }
        .pe-model-details__actions .pe-btn:focus-visible {
            outline: 2px solid var(--pe-accent);
            outline-offset: 2px;
        }

        /* Viewport Virtualizado (.pe-virtual-*) */
        .pe-virtual-list {
            position: relative;
            flex: 1 1 0;
            min-height: 260px;
            overflow-y: auto;
            overflow-x: hidden;
            border: 1px solid var(--pe-border);
            border-radius: var(--pe-radius);
            background: var(--pe-surface);
            overscroll-behavior: contain;
            scrollbar-width: thin;
            scrollbar-color: var(--pe-border-strong) transparent;
            overflow-anchor: none;
        }
        .pe-virtual-list::-webkit-scrollbar { width: 8px; }
        .pe-virtual-list::-webkit-scrollbar-thumb {
            background: var(--pe-border-strong);
            border-radius: 4px;
        }
        .pe-virtual-list::-webkit-scrollbar-thumb:hover {
            background: var(--pe-text-faint);
        }
        .pe-virtual-canvas {
            position: relative;
            width: 100%;
            min-height: 100%;
        }
        .pe-virtual-item {
            position: absolute;
            left: 0;
            right: 0;
            padding: 0 var(--pe-space-1) var(--pe-space-2);
            contain: layout style;
        }
        .pe-virtual-item .pe-provider-group-title {
            margin: 0;
            padding: var(--pe-space-3) var(--pe-space-1) 0 var(--pe-space-1);
        }
        .pe-virtual-item:first-child .pe-provider-group-title {
            padding-top: var(--pe-space-2);
        }
        .pe-virtual-item .pe-model-card {
            margin-bottom: 0;
        }
        .pe-virtual-canvas > .pe-provider-empty {
            padding: var(--pe-space-5) var(--pe-space-4);
            margin: var(--pe-space-3);
        }

        /* ════════════════════════════════════════════════════════════════════
           11. MEDIA QUERIES CONSOLIDADAS (Ordem Estrita: 768 -> 640 -> 520)
           ════════════════════════════════════════════════════════════════════ */

        /* Breakpoint 1: Tablet / Compact (<= 768px) */
        @media (max-width: 768px) {
            .pe-btn .pe-label { display: none; }
            .pe-btn { padding: 7px 9px; }
            .pe-actionbar { padding: 6px; }
            .pe-panel { margin: 4px 4px 6px; max-height: min(65vh, 460px); }
            .pe-panel__header { gap: 8px; padding: 10px 12px; }
            .pe-panel__header h4 { font-size: var(--pe-fs-base); }
            .pe-prompt-base__meta { display: none; }
            .pe-q-content-inner { padding: 0 12px 12px 12px; }
            .pe-code-textarea { min-height: 88px; font-size: var(--pe-fs-xs); }
            .pe-agents-popover { width: 290px; }
            .pe-param-label { flex: 0 0 100px; }

            .pe-scope .pe-system-prompt { gap: 10px; }
            .pe-scope .pe-system-prompt__card { padding: 12px; }
            .pe-scope .pe-system-prompt__textarea { min-height: 190px; font-size: var(--pe-fs-xs); }
            .pe-scope .pe-system-prompt__meta { flex-direction: column; gap: 4px; }
            .pe-scope .pe-system-prompt__feedback { text-align: left; }
            .pe-scope .pe-system-prompt__preset-fields { grid-template-columns: minmax(0, 1fr); }
            .pe-scope .pe-system-prompt__preset-actions .pe-btn { flex: 1 1 calc(50% - 6px); justify-content: center; }

            .pe-modal-backdrop { padding: 10px; }
            .pe-scope .pe-modal {
                width: min(680px, 100%);
                height: min(820px, calc(100dvh - 20px));
                max-height: min(820px, calc(100dvh - 20px));
            }
            .pe-modal-layout { flex-direction: column; border-bottom: 0; }
            .pe-scope .pe-modal .pe-modal-tabs {
                flex: 0 0 auto;
                width: 100%;
                padding: 8px 10px;
                flex-direction: row;
                align-items: stretch;
                gap: 5px;
                overflow-x: auto;
                overflow-y: hidden;
                border-right: 0;
                border-bottom: 1px solid var(--pe-border);
                scrollbar-width: none;
            }
            .pe-scope .pe-modal .pe-modal-tabs::-webkit-scrollbar { display: none; }
            .pe-scope .pe-modal .pe-modal-tabs::before { display: none; }
            .pe-scope .pe-modal .pe-modal-tab {
                flex: 1 0 auto;
                width: auto;
                min-height: 40px;
                justify-content: center;
                gap: var(--pe-space-2);
                padding: 8px 10px;
                white-space: nowrap;
            }
            .pe-modal-tab .pe-ico { width: 15px; height: 15px; }
            .pe-scope .pe-modal .pe-panel__body { padding: 20px clamp(14px, 4vw, 26px) 32px; }
            .pe-scope .pe-modal .pe-panel__footer { min-height: 60px; padding: 10px 16px; border-top: 1px solid var(--pe-border); }
            .pe-scope .pe-modal .pe-panel__footer .pe-btn .pe-label,
            .pe-scope .pe-system-prompt .pe-btn .pe-label,
            .pe-provider-actions .pe-btn .pe-label,
            .pe-model-details__actions .pe-btn .pe-label {
                display: inline-block;
            }
        }

        /* Breakpoint 2: Intermediário do Catálogo (<= 640px) */
        @media (max-width: 640px) {
            .pe-catalog-filters { flex-wrap: wrap; }
            .pe-catalog-filters .pe-param-input { flex: 1 1 100%; width: 100%; }
            .pe-scope .pe-modal .pe-param-body.pe-provider-settings .pe-catalog-filters {
                grid-template-columns: 1fr 1fr;
            }
            .pe-scope .pe-modal .pe-param-body.pe-provider-settings .pe-catalog-filters > .pe-param-input {
                grid-column: 1 / -1;
            }
            .pe-virtual-list,
            .pe-scope .pe-modal .pe-param-body.pe-provider-settings .pe-virtual-list {
                min-height: 220px;
            }
        }

        /* Breakpoint 3: Mobile Pequeno (<= 520px) */
        @media (max-width: 520px) {
            .pe-toast { right: 12px; bottom: 12px; left: 12px; max-width: none; }
            .pe-float-wrap { left: 12px; right: 12px; bottom: 12px; max-width: none; }
            .pe-panel-loading.is-float .pe-panel-loading__card { max-width: none; }
            .pe-panel-loading__meta { flex-direction: column; align-items: flex-start; }
            .pe-panel-loading__meta-r { width: 100%; justify-content: space-between; }

            .pe-history-item__heading { gap: 0; padding-right: 4px; }
            .pe-history-item__header { gap: 7px; padding-left: 8px; }
            .pe-history-item__copy { width: 44px; min-width: 44px; padding: 7px; }
            .pe-history-item__copy .pe-label { display: none; }

            .pe-provider-toolbar { align-items: stretch; flex-direction: column; }
            .pe-provider-toolbar > .pe-btn { width: 100%; min-height: 44px; }
            .pe-scope .pe-modal .pe-param-body.pe-provider-settings .pe-catalog-filters > .pe-param-input {
                min-height: 42px;
            }
            .pe-provider-list { grid-template-columns: minmax(0, 1fr); gap: 10px; }
            .pe-provider-card { padding: 12px; }
            .pe-provider-actions .pe-btn { flex: 1 1 calc(50% - 6px); min-height: 44px; justify-content: center; padding: 8px 6px; }
            .pe-provider-editor { padding: 12px; }
            .pe-provider-editor .pe-param-row--full { gap: 5px; }
            .pe-provider-editor .pe-param-input { min-height: 42px; }
            .pe-provider-editor textarea.pe-param-input { min-height: 100px; }
            .pe-provider-editor .pe-provider-actions .pe-btn { flex: 1 1 calc(50% - 6px); min-height: 44px; }

            .pe-scope .pe-modal .pe-panel__header { min-height: 64px; padding: 12px 15px; }
            .pe-scope .pe-modal .pe-panel__header h4 { font-size: var(--pe-fs-title); }
            .pe-modal-heading p { font-size: var(--pe-fs-2xs); }
            .pe-scope .pe-modal .pe-modal-tab { gap: 4px; min-width: 42px; padding: 8px; }
            .pe-scope .pe-modal .pe-modal-tab__label { font-size: var(--pe-fs-2xs); }
            .pe-scope .pe-modal .pe-panel__body { padding: 17px 12px 32px; }
            .pe-scope .pe-modal .pe-panel__body:has(> .pe-provider-settings) { padding: 14px 12px 20px; }
            .pe-virtual-list,
            .pe-scope .pe-modal .pe-param-body.pe-provider-settings .pe-virtual-list {
                min-height: 180px;
            }

            .pe-settings-intro { gap: 10px; margin-bottom: 16px; padding-bottom: 14px; }
            .pe-settings-intro__icon { flex-basis: 34px; width: 34px; height: 34px; }
            .pe-settings-intro h5 { font-size: var(--pe-fs-title); }
            .pe-settings-intro p { font-size: var(--pe-fs-xs); }
            .pe-scope .pe-modal .pe-param-body:not(.pe-system-prompt) { padding: 14px; }
            .pe-scope .pe-modal .pe-param-presets { flex-wrap: wrap; }
            .pe-scope .pe-modal .pe-param-preset { flex: 1 1 40%; }
            .pe-scope .pe-modal .pe-param-row:not(.pe-param-row--full) { flex-direction: column; gap: 5px; }
            .pe-scope .pe-modal .pe-param-row:not(.pe-param-row--full) .pe-param-label { flex: auto; padding-top: 0; }
            .pe-scope .pe-modal .pe-param-row:not(.pe-param-row--full) .pe-param-input { max-width: 100%; }
            .pe-scope .pe-modal .pe-panel__footer { gap: 6px; padding: 9px 10px; }
            .pe-scope .pe-modal .pe-panel__footer .pe-btn { min-height: 34px; padding: 7px 9px; font-size: var(--pe-fs-xs); }
        }

        /* Preferência de Movimento Reduzido (Acessibilidade WCAG 2.3.3) */
        @media (prefers-reduced-motion: reduce) {
            .pe-scope *,
            .pe-scope *::before,
            .pe-scope *::after,
            .pe-modal-backdrop,
            .pe-agents-popover,
            .pe-toast {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        }
    `;

    if (typeof GM_addStyle === 'function') {
        const styleNode = GM_addStyle(css);
        if (styleNode && typeof styleNode === 'object') {
            styleNode.id = 'pe-core-styles';
        }
    } else {
        const styleNode = document.createElement('style');
        styleNode.id = 'pe-core-styles';
        styleNode.textContent = css;
        (document.head || document.documentElement).appendChild(styleNode);
    }

    peStylesInjected = true;
}