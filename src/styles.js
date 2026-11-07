// ===== src/styles.js =====
    function injectStyles() {
        GM_addStyle(`
            :where(.kpe-scope){
                --kpe-surface:#ffffff;--kpe-surface-2:#f7f8fa;--kpe-surface-3:#eef0f3;--kpe-surface-code:#f9fafb;--kpe-overlay:rgba(15,18,25,.42);
                --kpe-text:#0f1115;--kpe-text-muted:#4b5563;--kpe-text-faint:#6b7280;
                --kpe-border:#e6e8ec;--kpe-border-strong:#c9cdd4;--kpe-border-soft:#eef0f3;
                --kpe-success:#10a37f;--kpe-success-soft:#e7f6f1;--kpe-error:#cf2e2e;--kpe-error-soft:#fdecec;--kpe-warning:#b45309;--kpe-warning-soft:#fef3c7;
                --kpe-accent:#4d6bfe;--kpe-accent-hover:#3d5ce6;--kpe-accent-soft:#eef1ff;--kpe-accent-border:#d6ddff;--kpe-accent-text:#3d4dc4;
                --kpe-radius-sm:6px;--kpe-radius:10px;--kpe-radius-lg:14px;--kpe-radius-pill:999px;
                --kpe-space-1:4px;--kpe-space-2:8px;--kpe-space-3:12px;--kpe-space-4:16px;--kpe-space-5:20px;--kpe-space-6:24px;--kpe-space-7:32px;--kpe-space-8:40px;
                --kpe-shadow-1:0 1px 2px rgba(16,18,24,.06),0 0 0 1px rgba(16,18,24,.02);--kpe-shadow-2:0 4px 12px rgba(16,18,24,.08),0 1px 3px rgba(16,18,24,.04);--kpe-shadow-3:0 24px 48px -12px rgba(16,18,24,.24),0 4px 12px rgba(16,18,24,.08);--kpe-shadow-panel:0 18px 40px rgba(16,18,24,.12),0 6px 18px rgba(16,18,24,.08);
                --kpe-focus-ring:0 0 0 3px rgba(77,107,254,.18);--kpe-accent-ring:0 0 0 3px rgba(77,107,254,.18);
                --kpe-font:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Helvetica Neue",Arial,sans-serif;
                --kpe-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
                --kpe-fs-2xs:10.5px;--kpe-fs-xs:11px;--kpe-fs-sm:12px;--kpe-fs-md:13px;--kpe-fs-lg:14px;--kpe-fs-xl:16px;--kpe-fs-2xl:20px;
                --kpe-lh-tight:1.25;--kpe-lh-base:1.5;--kpe-lh-loose:1.6;--kpe-fw-regular:400;--kpe-fw-medium:500;--kpe-fw-semi:600;--kpe-fw-bold:650;
                --kpe-dur-instant:100ms;--kpe-dur-fast:160ms;--kpe-dur-base:240ms;--kpe-dur-slow:360ms;--kpe-ease-standard:cubic-bezier(.2,0,0,1);--kpe-ease-enter:cubic-bezier(.05,.7,.1,1);--kpe-ease-exit:cubic-bezier(.3,0,.8,.15);--kpe-ease-spring:cubic-bezier(.34,1.56,.64,1);
            }
            @media (prefers-color-scheme: dark){:where(.kpe-scope){
                --kpe-surface:#17181c;--kpe-surface-2:#1f2127;--kpe-surface-3:#2a2d34;--kpe-surface-code:#1b1d22;--kpe-overlay:rgba(0,0,0,.55);
                --kpe-text:#f2f3f5;--kpe-text-muted:#a3a8b3;--kpe-text-faint:#7a7f8a;
                --kpe-border:#2a2d34;--kpe-border-strong:#3d414a;--kpe-border-soft:#22252b;
                --kpe-success:#2ecc9b;--kpe-success-soft:#16332b;--kpe-error:#ff6b6b;--kpe-error-soft:#3a1a1a;--kpe-warning:#f5b94c;--kpe-warning-soft:#3a2b0f;
                --kpe-accent:#8fa3ff;--kpe-accent-hover:#a3b3ff;--kpe-accent-soft:#232945;--kpe-accent-border:#38427a;--kpe-accent-text:#b8c5ff;
                --kpe-focus-ring:0 0 0 3px rgba(143,163,255,.22);--kpe-accent-ring:0 0 0 3px rgba(143,163,255,.22);
                --kpe-shadow-1:0 1px 2px rgba(0,0,0,.22),0 0 0 1px rgba(255,255,255,.02);--kpe-shadow-2:0 4px 12px rgba(0,0,0,.25),0 1px 3px rgba(0,0,0,.18);--kpe-shadow-3:0 24px 48px -12px rgba(0,0,0,.42),0 4px 12px rgba(0,0,0,.2);
            }}
            /* audit-skip: reduced-motion guard must override animations */ @media (prefers-reduced-motion: reduce){.kpe-scope *,.kpe-scope *::before,.kpe-scope *::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;}}
            :where(.kpe-scope) *,:where(.kpe-scope) *::before,:where(.kpe-scope) *::after{box-sizing:border-box;}
            .kpe-scope :focus-visible{outline:2px solid var(--kpe-accent);outline-offset:2px;border-radius:inherit;box-shadow:none;}
        `);
        GM_addStyle(`
            .kpe-scope .kpe-ico{width:14px;height:14px;flex-shrink:0;display:inline-block;vertical-align:middle;}
            .kpe-mount{display:block;width:100%;position:relative;font-family:var(--kpe-font);box-sizing:border-box;margin-bottom:var(--kpe-space-2);}
            /* audit-skip: intentional scoped selector */ .kpe-mount *,.kpe-mount *::before,.kpe-mount *::after{box-sizing:border-box;}
            .kpe-actionbar{display:flex;align-items:center;gap:var(--kpe-space-1);padding:var(--kpe-space-1) var(--kpe-space-2);background:transparent;border-bottom:1px solid var(--kpe-border-soft);font-family:var(--kpe-font);font-size:var(--kpe-fs-sm);line-height:1;min-height:40px;flex-wrap:wrap;}
            .kpe-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:var(--kpe-space-2);height:32px;padding:0 var(--kpe-space-3);font:500 12px/1 var(--kpe-font);color:var(--kpe-text-muted);background:transparent;border:1px solid transparent;border-radius:var(--kpe-radius-sm);cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;isolation:isolate;transition:background var(--kpe-dur-fast),color var(--kpe-dur-fast),border-color var(--kpe-dur-fast),opacity var(--kpe-dur-fast);will-change:transform;}
            .kpe-btn:hover:not([disabled]){background:var(--kpe-surface-2);color:var(--kpe-text);}
            .kpe-btn:active:not([disabled]){transform:translateY(1px);}
            .kpe-btn[disabled]{opacity:.45;cursor:not-allowed;}
            .kpe-btn .kpe-ico{width:14px;height:14px;flex-shrink:0;display:inline-block;}
            .kpe-btn .kpe-label{display:inline-block;}
            .kpe-btn--primary{
                color:var(--kpe-accent-text);
                background:var(--kpe-accent-soft);
                border-color:var(--kpe-accent-border);
                font-weight:600;
            }
            .kpe-btn--primary:hover:not([disabled]){
                color:var(--kpe-accent-text);
                background:var(--kpe-accent-soft);
                border-color:var(--kpe-accent);
            }
            .kpe-btn--primary .kpe-ico{color:var(--kpe-accent-text);}
            .kpe-btn--primary[disabled]{
                color:var(--kpe-accent-text);
                background:var(--kpe-accent-soft);
                border-color:var(--kpe-accent-border);
                opacity:.55;
            }
            .kpe-btn--outline,.kpe-btn--ghost{color:var(--kpe-text-muted);background:transparent;border-color:transparent;}
            .kpe-btn--outline:hover:not([disabled]),.kpe-btn--ghost:hover:not([disabled]){background:var(--kpe-surface-2);color:var(--kpe-text);border-color:transparent;}
            .kpe-btn--subtle{height:28px;padding:0 var(--kpe-space-2);}
            .kpe-btn--icon{width:32px;padding:0;}
            .kpe-btn--icon .kpe-ico{width:16px;height:16px;}
            .kpe-btn--danger{color:var(--kpe-error);}
            .kpe-btn--danger:hover:not([disabled]){background:var(--kpe-error-soft);color:var(--kpe-error);}
            .kpe-btn--agents .kpe-status-dot{width:6px;height:6px;border-radius:50%;background:var(--kpe-text-faint);flex-shrink:0;margin-left:2px;transition:background var(--kpe-dur-base) ease,box-shadow var(--kpe-dur-base) ease;}
            .kpe-btn--agents.is-loaded{color:var(--kpe-accent-text);background:var(--kpe-accent-soft);border-color:var(--kpe-accent-border);}
            .kpe-btn--agents.is-loaded:hover{background:var(--kpe-accent-soft);border-color:var(--kpe-accent-border);color:var(--kpe-accent-text);}
            /* audit-skip: intentional scoped selector */ .kpe-btn--agents.is-loaded .kpe-ico{color:var(--kpe-accent-text);}
            /* audit-skip: intentional scoped selector */ .kpe-btn--agents.is-loaded .kpe-status-dot{background:var(--kpe-accent);box-shadow:0 0 0 2px var(--kpe-accent-border);}
            .kpe-btn.is-loading{pointer-events:none;}
            /* audit-skip: intentional scoped selector */ .kpe-btn.is-loading .kpe-ico,.kpe-btn.is-loading .kpe-label{opacity:.55;}
            .kpe-btn.is-loading::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent 20%,rgba(127,127,127,0.10) 45%,rgba(127,127,127,0.18) 50%,rgba(127,127,127,0.10) 55%,transparent 80%);background-size:220% 100%;animation:kpe-shimmer 1.3s linear infinite;pointer-events:none;border-radius:inherit;}
            @keyframes kpe-shimmer{from{background-position:140% 0;}to{background-position:-40% 0;}}
            .kpe-spin{animation:kpe-rotate 0.9s linear infinite;}
            @keyframes kpe-rotate{to{transform:rotate(360deg);}}
            .kpe-agents-popover{position:fixed;top:0;left:0;width:340px;background:var(--kpe-surface);border:1px solid var(--kpe-border);border-radius:var(--kpe-radius);box-shadow:var(--kpe-shadow-2);opacity:0;transform:translateY(4px) scale(.985);transform-origin:bottom left;pointer-events:none;transition:opacity var(--kpe-dur-fast),transform var(--kpe-dur-fast) var(--kpe-ease-spring);z-index:2147483646;overflow:hidden;font-family:var(--kpe-font);font-size:var(--kpe-fs-sm);color:var(--kpe-text);}
            .kpe-agents-popover.is-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}
            .kpe-pop-head{display:flex;align-items:center;gap:var(--kpe-space-2);padding:var(--kpe-space-3);border-bottom:1px solid var(--kpe-border-soft);}
            .kpe-pop-head-title{flex:1 1 auto;display:flex;align-items:center;gap:6px;font-size:var(--kpe-fs-sm);font-weight:var(--kpe-fw-semi);color:var(--kpe-text);min-width:0;}
            .kpe-pop-head-title .kpe-ico{width:14px;height:14px;color:var(--kpe-accent);flex-shrink:0;}
            .kpe-pop-close{width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:var(--kpe-radius-sm);color:var(--kpe-text-faint);cursor:pointer;padding:0;flex-shrink:0;}
            .kpe-pop-close:hover{background:var(--kpe-surface-2);color:var(--kpe-text);}
            .kpe-pop-close svg{width:12px;height:12px;}
            .kpe-pop-body{padding:var(--kpe-space-3);}
            .kpe-pop-empty{display:flex;flex-direction:column;gap:var(--kpe-space-2);}
            .kpe-pop-empty-title{font-size:var(--kpe-fs-sm);font-weight:var(--kpe-fw-medium);color:var(--kpe-text-muted);text-align:center;line-height:1.5;}
            .kpe-pop-empty-hint{font-size:var(--kpe-fs-2xs);color:var(--kpe-text-faint);text-align:center;line-height:1.5;}
            .kpe-pop-empty-hint code{font-family:var(--kpe-mono);font-size:10px;background:var(--kpe-surface-2);padding:1px 4px;border-radius:3px;}
            .kpe-pop-divider{height:1px;background:var(--kpe-border-soft);margin:var(--kpe-space-1) 0;}
            .kpe-pop-action{display:flex;align-items:center;gap:9px;width:100%;padding:9px 10px;font-family:inherit;font-size:var(--kpe-fs-sm);font-weight:var(--kpe-fw-medium);color:var(--kpe-text);background:transparent;border:none;border-radius:var(--kpe-radius-sm);cursor:pointer;text-align:left;}
            .kpe-pop-action:hover{background:var(--kpe-surface-2);}
            .kpe-pop-action .kpe-ico{width:14px;height:14px;color:var(--kpe-accent);flex-shrink:0;}
            .kpe-pop-action-body{flex:1 1 auto;display:flex;flex-direction:column;gap:1px;min-width:0;}
            .kpe-pop-action-title{font-weight:var(--kpe-fw-medium);color:var(--kpe-text);line-height:1.3;}
            .kpe-pop-action-hint{font-size:var(--kpe-fs-2xs);color:var(--kpe-text-faint);font-weight:var(--kpe-fw-regular);line-height:1.3;}
            .kpe-pop-paste{display:flex;flex-direction:column;gap:var(--kpe-space-2);}
            .kpe-pop-paste-textarea{width:100%;padding:9px 11px;font-family:var(--kpe-mono);font-size:11px;line-height:1.55;color:var(--kpe-text);background:var(--kpe-surface-2);border:1px solid var(--kpe-border);border-radius:var(--kpe-radius-sm);outline:none;resize:vertical;min-height:100px;box-sizing:border-box;min-width:0;max-width:100%;}
            .kpe-pop-paste-actions{display:flex;gap:var(--kpe-space-2);}
            .kpe-pop-paste-actions button{flex:1;padding:6px 10px;font-family:inherit;font-size:11.5px;font-weight:var(--kpe-fw-medium);border-radius:var(--kpe-radius-sm);cursor:pointer;border:1px solid var(--kpe-border);background:var(--kpe-surface);color:var(--kpe-text-muted);}
            .kpe-pop-paste-actions button:hover{background:var(--kpe-surface-2);color:var(--kpe-text);}
            .kpe-pop-paste-actions button.primary{background:var(--kpe-accent);border-color:var(--kpe-accent);color:#fff;}
            .kpe-pop-paste-actions button[disabled]{opacity:.5;cursor:not-allowed;}
            .kpe-pop-toggle{display:flex;align-items:center;gap:8px;padding:6px 2px;cursor:pointer;user-select:none;}
            .kpe-pop-toggle input{display:none;}
            .kpe-pop-toggle-switch{width:28px;height:16px;flex-shrink:0;background:var(--kpe-border-strong);border-radius:var(--kpe-radius-pill);position:relative;transition:background var(--kpe-dur-base) ease;}
            .kpe-pop-toggle-switch::after{content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform var(--kpe-dur-base) cubic-bezier(.34,1.56,.64,1);}
            .kpe-pop-toggle input:checked + .kpe-pop-toggle-switch{background:var(--kpe-accent);}
            .kpe-pop-toggle input:checked + .kpe-pop-toggle-switch::after{transform:translateX(12px);}
            .kpe-pop-toggle-label{flex:1 1 auto;font-size:11.5px;color:var(--kpe-text-muted);line-height:1.3;}
            .kpe-pop-toggle-label strong{font-weight:var(--kpe-fw-semi);color:var(--kpe-text);}
            .kpe-pop-foot{display:flex;gap:var(--kpe-space-2);padding:var(--kpe-space-2) var(--kpe-space-3);background:var(--kpe-surface-code);border-top:1px solid var(--kpe-border-soft);}
            .kpe-pop-foot-btn{flex:1;min-width:0;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:6px 8px;font-family:inherit;font-size:11px;font-weight:var(--kpe-fw-medium);border-radius:var(--kpe-radius-sm);cursor:pointer;border:1px solid var(--kpe-border);background:var(--kpe-surface);color:var(--kpe-text-muted);white-space:nowrap;}.kpe-pop-foot-btn .kpe-ico{width:12px;height:12px;flex-shrink:0;}
            .kpe-pop-foot-btn:hover{background:var(--kpe-surface-2);color:var(--kpe-text);}
            .kpe-pop-foot-btn.danger{color:var(--kpe-error);border-color:var(--kpe-error-soft);}
            .kpe-pop-foot-btn.danger:hover{background:var(--kpe-error-soft);border-color:var(--kpe-error);color:var(--kpe-error);}
            .kpe-inline-slot{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--kpe-dur-slow) var(--kpe-ease-emph);}
            .kpe-inline-slot.is-open{grid-template-rows:1fr;}
            .kpe-inline-clip{overflow:hidden;min-height:0;}
            .kpe-panel{position:relative;margin:6px 6px 8px;max-height:min(58vh,520px);display:flex;flex-direction:column;background:var(--kpe-surface);color:var(--kpe-text);border:1px solid var(--kpe-border-strong);border-radius:var(--kpe-radius-lg);box-shadow:0 1px 3px rgba(16,18,24,.06);font-family:var(--kpe-font);font-size:13.5px;overflow:hidden;opacity:0;will-change:transform,opacity;min-width:0;}
            .kpe-panel__header{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--kpe-border);flex-shrink:0;min-width:0;}
            .kpe-panel__header h4{margin:0;font-size:14px;font-weight:600;color:var(--kpe-text);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:0 1 auto;}
            .kpe-panel__header-extra{display:flex;align-items:center;gap:8px;flex:1 1 auto;min-width:0;}
            .kpe-panel__close{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;color:var(--kpe-text-muted);background:transparent;border:1px solid transparent;border-radius:var(--kpe-radius-sm);cursor:pointer;flex-shrink:0;margin-left:auto;}
            .kpe-panel__close:hover{color:var(--kpe-text);background:var(--kpe-surface-2);}
            .kpe-panel__body{position:relative;padding:14px 16px;overflow:hidden auto;flex:1 1 auto;overscroll-behavior:contain;min-height:60px;min-width:0;}
            .kpe-panel__footer{display:flex;justify-content:space-between;align-items:center;gap:var(--kpe-gap-3);padding:10px 16px;border-top:1px solid var(--kpe-border);flex-shrink:0;}
            .kpe-panel__expand{font-size:11.5px;color:var(--kpe-text-muted);background:transparent;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;font-weight:500;font-family:inherit;}
            .kpe-panel__expand:hover{background:var(--kpe-surface-2);color:var(--kpe-text);}
            .kpe-panel__actions{display:flex;gap:var(--kpe-gap-3);}
            .kpe-progress-inline{display:flex;align-items:center;gap:8px;flex:1 1 auto;min-width:0;}
            .kpe-progress-inline .kpe-progress-track{flex:1 1 auto;height:4px;background:var(--kpe-surface-2);border-radius:999px;overflow:hidden;min-width:40px;}
            .kpe-progress-inline .kpe-progress-fill{height:100%;width:0;background:var(--kpe-text-muted);border-radius:999px;transition:width var(--kpe-dur-slow) var(--kpe-ease-emph);}
            .kpe-progress-inline .kpe-progress-label{font-size:11.5px;font-weight:600;color:var(--kpe-text-muted);white-space:nowrap;flex-shrink:0;font-variant-numeric:tabular-nums;}
            .kpe-section-label{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--kpe-text-faint);margin:14px 0 6px;}
            .kpe-section-label:first-child{margin-top:0;}
            .kpe-section-label svg{width:12px;height:12px;flex-shrink:0;}
            .kpe-agents-indicator{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--kpe-accent-soft);border:1px solid var(--kpe-accent-border);border-radius:var(--kpe-radius);font-size:11.5px;color:var(--kpe-accent);}
            .kpe-agents-indicator .kpe-ico{width:14px;height:14px;flex-shrink:0;}
            .kpe-agents-indicator__body{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;}
            .kpe-agents-indicator__title{font-weight:600;color:var(--kpe-accent);}
            .kpe-agents-indicator__meta{font-size:10.5px;opacity:.8;font-variant-numeric:tabular-nums;}
            .kpe-field{margin-bottom:14px;}
            .kpe-field:last-child{margin-bottom:0;}
            .kpe-field-label{display:block;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--kpe-text-faint);margin-bottom:6px;}
            .kpe-field-text{max-height:240px;overflow:auto;padding:12px 14px;background:var(--kpe-surface-2);border:1px solid var(--kpe-border);border-radius:var(--kpe-radius);white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;line-height:1.55;font-size:13px;color:var(--kpe-text);min-width:0;max-width:100%;}
            .kpe-prompt-base{margin-bottom:12px;border:1px solid var(--kpe-border);border-radius:var(--kpe-radius);background:var(--kpe-surface-2);overflow:hidden;}
            .kpe-prompt-base__trigger{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;font-family:inherit;font-size:12px;font-weight:500;color:var(--kpe-text-muted);background:transparent;border:none;cursor:pointer;text-align:left;}
            .kpe-prompt-base__trigger:hover{background:var(--kpe-surface-3);color:var(--kpe-text);}
            .kpe-prompt-base__icon{width:14px;height:14px;flex-shrink:0;color:var(--kpe-text-faint);}
            .kpe-prompt-base__label{flex-shrink:0;font-weight:600;color:var(--kpe-text);}
            .kpe-prompt-base__meta{flex:1 1 auto;font-size:11.5px;font-weight:400;color:var(--kpe-text-faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
            .kpe-prompt-base__count{flex-shrink:0;padding:2px 6px;font-size:10.5px;font-weight:600;color:var(--kpe-text-muted);background:var(--kpe-surface-3);border-radius:4px;font-variant-numeric:tabular-nums;}
            .kpe-prompt-base__chevron{width:14px;height:14px;flex-shrink:0;color:var(--kpe-text-faint);transition:transform var(--kpe-dur-base) var(--kpe-ease-emph);}
            /* audit-skip: intentional scoped selector */ .kpe-prompt-base.is-expanded .kpe-prompt-base__chevron{transform:rotate(90deg);}
            .kpe-prompt-base__content{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--kpe-dur-base) var(--kpe-ease-emph);}
            /* audit-skip: intentional scoped selector */ .kpe-prompt-base.is-expanded .kpe-prompt-base__content{grid-template-rows:1fr;}
            .kpe-prompt-base__content > div{overflow:hidden;min-height:0;}
            .kpe-prompt-base__text{padding:10px 12px 12px;font-size:12.5px;line-height:1.55;color:var(--kpe-text);white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;border-top:1px solid var(--kpe-border);max-height:200px;overflow-y:auto;min-width:0;max-width:100%;}
            .kpe-q-item{border:1px solid var(--kpe-border);border-radius:var(--kpe-radius);margin-bottom:8px;background:var(--kpe-surface);overflow:hidden;}
            .kpe-q-item.is-open{border-color:var(--kpe-border-strong);}
            .kpe-q-header{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;cursor:pointer;user-select:none;background:transparent;width:100%;text-align:left;border:none;font-family:inherit;position:relative;overflow:hidden;}
            .kpe-q-header:hover{background:var(--kpe-surface-2);}
            .kpe-ripple{position:absolute;border-radius:50%;background:rgba(107,114,128,.18);transform:scale(0);opacity:1;animation:kpe-ripple var(--kpe-dur-slow) var(--kpe-ease-out) forwards;pointer-events:none;}
            @keyframes kpe-ripple{to{transform:scale(2.6);opacity:0;}}
            .kpe-q-num{flex-shrink:0;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--kpe-text-muted);background:var(--kpe-surface);border:1px solid var(--kpe-border-strong);border-radius:50%;margin-top:1px;position:relative;}
            .kpe-q-num svg{width:12px;height:12px;stroke:currentColor;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:20;stroke-dashoffset:20;display:none;}
            /* audit-skip: intentional scoped selector */ .kpe-q-item.is-answered .kpe-q-num{background:var(--kpe-text-muted);color:var(--kpe-surface);border-color:var(--kpe-text-muted);}
            /* audit-skip: intentional scoped selector */ .kpe-q-item.is-answered .kpe-q-num span{display:none;}
            /* audit-skip: intentional scoped selector */ .kpe-q-item.is-answered .kpe-q-num svg{display:block;animation:kpe-draw-check var(--kpe-dur-slow) var(--kpe-ease-out) forwards;}
            @keyframes kpe-draw-check{to{stroke-dashoffset:0;}}
            .kpe-q-header-main{flex:1;min-width:0;}
            .kpe-q-text{font-size:13px;font-weight:500;color:var(--kpe-text);line-height:1.45;}
            .kpe-q-hint{display:block;font-size:11px;font-weight:500;color:var(--kpe-text-faint);margin-top:3px;max-height:30px;}
            /* audit-skip: force inline-flex for code hint badge */ .kpe-q-hint--code{display:inline-flex !important;align-items:center;gap:5px;margin-top:4px;padding:2px 8px 2px 6px;background:var(--kpe-accent-soft);border:1px solid var(--kpe-accent-border);border-radius:6px;color:var(--kpe-accent);font-size:10.5px;font-weight:500;max-height:24px;width:fit-content;}
            .kpe-q-hint--code svg{width:10px;height:10px;flex-shrink:0;}
            .kpe-q-summary{display:block;font-size:12px;color:var(--kpe-text-muted);margin-top:4px;line-height:1.4;opacity:0;max-height:0;overflow:hidden;transition:opacity var(--kpe-dur-base) var(--kpe-ease-out),max-height var(--kpe-dur-base) var(--kpe-ease-out);}
            .kpe-q-summary__value{color:var(--kpe-text);font-weight:600;}
            /* audit-skip: intentional scoped selector */ .kpe-q-item.is-answered:not(.is-open) .kpe-q-hint{opacity:0;max-height:0;overflow:hidden;}
            /* audit-skip: intentional scoped selector */ .kpe-q-item.is-answered:not(.is-open) .kpe-q-summary{opacity:1;max-height:60px;}
            .kpe-q-chevron{flex-shrink:0;width:16px;height:16px;color:var(--kpe-text-faint);margin-top:3px;transition:transform var(--kpe-dur-base) var(--kpe-ease-emph);}
            /* audit-skip: intentional scoped selector */ .kpe-q-item.is-open .kpe-q-chevron{transform:rotate(180deg);color:var(--kpe-text-muted);}
            .kpe-q-content{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--kpe-dur-base) var(--kpe-ease-emph);}
            /* audit-skip: intentional scoped selector */ .kpe-q-item.is-open .kpe-q-content{grid-template-rows:1fr;}
            .kpe-q-content > div{overflow:hidden;min-height:0;}
            .kpe-q-content-inner{padding:0 14px 12px 46px;min-width:0;}
            .kpe-options-group{display:flex;flex-direction:column;gap:1px;min-width:0;}
            .kpe-option{display:flex;align-items:center;gap:9px;padding:8px 10px;font-size:12.5px;color:var(--kpe-text);background:transparent;border:none;border-left:2px solid transparent;border-radius:0 6px 6px 0;cursor:pointer;user-select:none;}
            .kpe-option:hover{background:var(--kpe-surface-2);}
            .kpe-option.is-checked{background:var(--kpe-surface-3);border-left-color:var(--kpe-text-muted);}
            .kpe-radio,.kpe-checkbox{width:14px;height:14px;flex-shrink:0;position:relative;}
            .kpe-radio{border-radius:50%;border:1.5px solid var(--kpe-border-strong);}
            .kpe-checkbox{border-radius:4px;border:1.5px solid var(--kpe-border-strong);}
            /* audit-skip: intentional scoped selector */ .kpe-option.is-checked .kpe-radio{border-color:var(--kpe-text-muted);}
            /* audit-skip: intentional scoped selector */ .kpe-option.is-checked .kpe-radio::after{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--kpe-text-muted);}
            /* audit-skip: intentional scoped selector */ .kpe-option.is-checked .kpe-checkbox{border-color:var(--kpe-text-muted);background:var(--kpe-text-muted);}
            /* audit-skip: intentional scoped selector */ .kpe-option.is-checked .kpe-checkbox::after{content:'';position:absolute;left:3.5px;top:1px;width:5px;height:8px;border:solid var(--kpe-surface);border-width:0 2px 2px 0;transform:rotate(45deg);}
            .kpe-options-divider{display:flex;align-items:center;gap:8px;padding:8px 10px 6px;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--kpe-text-faint);}
            .kpe-options-divider::before,.kpe-options-divider::after{content:'';flex:1;height:1px;background:var(--kpe-border);}
            .kpe-free-text{display:flex;flex-direction:column;gap:0;padding:0;min-width:0;}
            .kpe-free-text__row{display:flex;align-items:center;gap:9px;padding:8px 10px;border-left:2px solid transparent;border-radius:0 6px 6px 0;cursor:pointer;user-select:none;font-size:12.5px;color:var(--kpe-text);}
            .kpe-free-text__row:hover{background:var(--kpe-surface-2);}
            /* audit-skip: intentional scoped selector */ .kpe-free-text.is-active .kpe-free-text__row{background:var(--kpe-surface-3);border-left-color:var(--kpe-text-muted);}
            /* audit-skip: intentional scoped selector */ .kpe-free-text.is-active .kpe-radio::after{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--kpe-text-muted);}
            /* audit-skip: intentional scoped selector */ .kpe-free-text.is-active .kpe-checkbox{border-color:var(--kpe-text-muted);background:var(--kpe-text-muted);}
            /* audit-skip: intentional scoped selector */ .kpe-free-text.is-active .kpe-checkbox::after{content:'';position:absolute;left:3.5px;top:1px;width:5px;height:8px;border:solid var(--kpe-surface);border-width:0 2px 2px 0;transform:rotate(45deg);}
            .kpe-free-text__label{font-weight:500;}
            .kpe-free-text__input-wrap{max-height:0;overflow:hidden;transition:max-height var(--kpe-dur-base) var(--kpe-ease-emph);}
            /* audit-skip: intentional scoped selector */ .kpe-free-text.is-active .kpe-free-text__input-wrap{max-height:200px;}
            .kpe-free-text__input-wrap > div{padding:0 10px 8px 35px;min-width:0;}
            .kpe-free-text__input{width:100%;padding:8px 10px;margin-top:4px;font-family:inherit;font-size:12.5px;color:var(--kpe-text);background:var(--kpe-surface);border:1px solid var(--kpe-border-strong);border-radius:8px;outline:none;box-sizing:border-box;min-width:0;max-width:100%;}
            .kpe-textarea{width:100%;padding:9px 12px;font-family:inherit;font-size:13px;color:var(--kpe-text);background:var(--kpe-surface-2);border:1px solid var(--kpe-border-strong);border-radius:var(--kpe-radius);outline:none;resize:vertical;min-height:68px;line-height:1.5;box-sizing:border-box;min-width:0;max-width:100%;}
            .kpe-textarea:focus{border-color:var(--kpe-text-muted);background:var(--kpe-surface);box-shadow:var(--kpe-focus-ring);}
            .kpe-code-wrap{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--kpe-dur-base) var(--kpe-ease-emph);margin-top:8px;min-width:0;}
            .kpe-code-wrap.is-visible{grid-template-rows:1fr;}
            .kpe-code-clip{overflow:hidden;min-height:0;}
            .kpe-code-area{position:relative;background:var(--kpe-surface-code);border-radius:var(--kpe-radius);padding:10px 10px 8px;min-width:0;}
            .kpe-code-actions{position:absolute;top:6px;right:6px;display:flex;gap:2px;padding:2px;background:var(--kpe-surface);border:1px solid var(--kpe-border);border-radius:7px;opacity:0;transform:translateY(-2px);pointer-events:none;transition:opacity var(--kpe-dur-fast) ease,transform var(--kpe-dur-fast) ease;z-index:2;}
            .kpe-code-area:hover .kpe-code-actions{opacity:1;transform:translateY(0);pointer-events:auto;}
            .kpe-code-action{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;font-family:inherit;font-size:11px;font-weight:500;color:var(--kpe-text-muted);background:transparent;border:none;border-radius:5px;cursor:pointer;}
            .kpe-code-action:hover{background:var(--kpe-surface-2);color:var(--kpe-text);}
            .kpe-code-action svg{width:11px;height:11px;flex-shrink:0;}
            .kpe-code-tabs{display:flex;padding:3px;margin:0 0 8px;background:var(--kpe-surface-2);border-radius:7px;gap:2px;width:fit-content;}
            .kpe-code-tab{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:5px 12px;font-family:inherit;font-size:11.5px;font-weight:500;color:var(--kpe-text-muted);background:transparent;border:none;border-radius:5px;cursor:pointer;}
            .kpe-code-tab:hover{color:var(--kpe-text);}
            .kpe-code-tab.is-active{background:var(--kpe-surface);color:var(--kpe-text);box-shadow:0 1px 2px rgba(16,18,24,.06);}
            .kpe-code-tab svg{width:12px;height:12px;flex-shrink:0;}
            .kpe-code-pane{padding:0;min-width:0;}
            .kpe-code-pane[hidden]{display:none;}
            .kpe-code-textarea{width:100%;padding:10px 12px;font-family:var(--kpe-mono);font-size:11.5px;line-height:1.55;color:var(--kpe-text);background:var(--kpe-surface);border:1px solid transparent;border-radius:8px;outline:none;resize:vertical;min-height:100px;box-sizing:border-box;min-width:0;max-width:100%;}
            .kpe-code-textarea.is-error{border-color:var(--kpe-error);}
            .kpe-code-textarea-footer{display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding:0 4px;font-size:11px;color:var(--kpe-text-faint);gap:8px;flex-wrap:wrap;min-width:0;}
            .kpe-code-lang{font-family:inherit;font-size:11px;font-weight:500;color:var(--kpe-text-muted);background:var(--kpe-surface);border:1px solid var(--kpe-border);border-radius:6px;padding:4px 8px;cursor:pointer;outline:none;box-sizing:border-box;max-width:100%;}
            .kpe-code-count{font-variant-numeric:tabular-nums;}
            .kpe-code-count.is-error{color:var(--kpe-error);font-weight:600;}
            .kpe-code-error{display:flex;align-items:center;gap:5px;margin-top:6px;padding:0 4px;font-size:11px;color:var(--kpe-error);font-weight:500;max-height:0;overflow:hidden;transition:max-height var(--kpe-dur-base) ease;}
            .kpe-code-error.is-visible{max-height:30px;}
            .kpe-code-error svg{flex-shrink:0;width:12px;height:12px;}
            .kpe-dropzone{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:20px 16px 16px;border:1.5px dashed var(--kpe-border-strong);border-radius:var(--kpe-radius);background:var(--kpe-surface);text-align:center;cursor:pointer;}
            .kpe-dropzone:hover{border-color:var(--kpe-text-faint);background:var(--kpe-surface-2);}
            .kpe-dropzone__icon svg{width:22px;height:22px;}
            .kpe-dropzone__title{font-size:12px;font-weight:500;color:var(--kpe-text-muted);}
            .kpe-dropzone__hint{font-size:11px;color:var(--kpe-text-faint);line-height:1.5;}
            .kpe-dropzone__hint code{font-family:var(--kpe-mono);font-size:10.5px;background:var(--kpe-surface-2);padding:1px 4px;border-radius:3px;color:var(--kpe-text-muted);}
            .kpe-dropzone__btn{display:inline-flex;align-items:center;gap:5px;margin-top:6px;padding:6px 12px;font-family:inherit;font-size:11.5px;font-weight:500;color:var(--kpe-accent);background:var(--kpe-surface);border:1px solid var(--kpe-accent-border);border-radius:7px;cursor:pointer;}
            .kpe-file-list{margin-top:8px;display:flex;flex-direction:column;gap:5px;}
            .kpe-file-list:empty{display:none;}
            .kpe-file-chip{display:flex;align-items:center;gap:9px;padding:7px 10px;background:var(--kpe-surface);border:1px solid var(--kpe-border);border-radius:8px;font-size:11.5px;}
            .kpe-file-chip.is-new{animation:kpe-file-pulse 0.7s cubic-bezier(.2,0,0,1);}
            @keyframes kpe-file-pulse{0%{box-shadow:0 0 0 0 rgba(16,163,127,.45);border-color:var(--kpe-success);}100%{box-shadow:0 0 0 12px rgba(16,163,127,0);border-color:var(--kpe-border);}}
            .kpe-file-chip svg{width:14px;height:14px;color:var(--kpe-text-muted);flex-shrink:0;}
            .kpe-file-chip__name{flex:1 1 auto;min-width:0;font-weight:500;color:var(--kpe-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .kpe-file-chip__size{font-size:10.5px;color:var(--kpe-text-faint);font-variant-numeric:tabular-nums;flex-shrink:0;}
            .kpe-file-chip__remove{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:5px;color:var(--kpe-text-faint);cursor:pointer;padding:0;flex-shrink:0;}
            .kpe-file-chip__remove:hover{background:var(--kpe-surface-2);color:var(--kpe-error);}
            .kpe-file-chip__remove svg{width:12px;height:12px;}

            /* ===== Loading Overlay — organic machine with gear top-right ===== */
            .kpe-panel-loading{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:5;padding:16px;background:color-mix(in srgb,var(--kpe-surface) 94%,transparent);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);border-radius:inherit;overflow:hidden;--local-accent:#7C9CFF;--kpe-loader-accent:var(--local-accent);--kpe-loader-glow:rgba(124,156,255,.4);}
            .kpe-panel-loading.is-active{display:flex;}
            .kpe-panel-loading__card{position:relative;width:100%;max-width:380px;border-radius:22px;padding:12px 16px;background:linear-gradient(180deg,rgba(255,255,255,.03),transparent 35%),var(--kpe-surface);border:1px solid var(--kpe-border);box-shadow:0 24px 56px -12px rgba(15,18,25,.45),0 8px 18px rgba(15,18,25,.18),inset 0 1px 0 rgba(255,255,255,.06);overflow:hidden;isolation:isolate;transition:background 600ms var(--kpe-ease-emph),box-shadow 600ms var(--kpe-ease-emph);min-width:0;}
            .kpe-panel-loading__card::after{content:"";position:absolute;inset:0;background:radial-gradient(120% 100% at 100% 0%,color-mix(in srgb,var(--kpe-loader-accent) 10%,transparent),transparent 38%);pointer-events:none;}
            @media (prefers-color-scheme: light){.kpe-panel-loading__card{background:linear-gradient(180deg,rgba(255,255,255,.86),var(--kpe-surface));box-shadow:0 24px 56px -12px rgba(16,18,24,.18),0 8px 18px rgba(16,18,24,.08),inset 0 1px 0 rgba(255,255,255,.9);}}
            .kpe-panel-loading__halo{position:absolute;top:-16px;right:-16px;width:110px;height:110px;border-radius:50%;background:radial-gradient(circle,var(--kpe-loader-glow) 0%,transparent 65%);opacity:.35;pointer-events:none;filter:blur(20px);transition:opacity 600ms var(--kpe-ease-emph),background 600ms var(--kpe-ease-emph);z-index:0;}
            .kpe-panel-loading__top{display:flex;justify-content:flex-end;margin-bottom:2px;position:relative;z-index:1;}
            .kpe-gear-wrap{width:48px;height:48px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
            .kpe-gear-wrap canvas{width:48px;height:48px;display:block;position:relative;z-index:1;}
            .kpe-panel-loading__body{position:relative;z-index:1;min-width:0;}
            .kpe-panel-loading__title-wrap{position:relative;min-height:1.3em;}
            .kpe-panel-loading__title{font-size:14px;font-weight:600;letter-spacing:-.015em;color:var(--kpe-text);margin:0;line-height:1.3;transition:opacity 220ms var(--kpe-ease-emph),transform 220ms var(--kpe-ease-emph);will-change:opacity,transform;}
            .kpe-panel-loading__title.is-swapping{opacity:0;transform:translateY(-3px);}
            .kpe-panel-loading__sub-wrap{position:relative;min-height:1.35em;margin-top:2px;}
            .kpe-panel-loading__sub{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px;color:var(--kpe-text-muted);line-height:1.35;transition:opacity 220ms var(--kpe-ease-emph),transform 220ms var(--kpe-ease-emph);will-change:opacity,transform;}
            .kpe-panel-loading__sub.is-swapping{opacity:0;transform:translateY(-3px);}
            .kpe-dots{display:inline-flex;gap:3px;align-items:center;}
            .kpe-dots span{width:3px;height:3px;border-radius:50%;background:var(--kpe-text-muted);opacity:.4;animation:kpe-dot-pulse 1.6s ease-in-out infinite;will-change:transform,opacity;}
            .kpe-dots span:nth-child(2){animation-delay:.16s;}
            .kpe-dots span:nth-child(3){animation-delay:.32s;}
            @keyframes kpe-dot-pulse{0%,60%,100%{opacity:.3;transform:scale(1);}30%{opacity:1;transform:scale(1.2);}}
            .kpe-token-pill,.kpe-retry-pill{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;font-family:var(--kpe-mono);font-size:10.5px;font-weight:500;border-radius:99px;font-variant-numeric:tabular-nums;line-height:1.4;will-change:opacity;}
            .kpe-token-pill{color:var(--kpe-loader-accent);background:color-mix(in srgb,var(--kpe-loader-accent) 10%,transparent);border:1px solid color-mix(in srgb,var(--kpe-loader-accent) 25%,transparent);}
            .kpe-token-pill::before{content:'';width:4px;height:4px;border-radius:50%;background:var(--kpe-loader-accent);opacity:.8;}
            .kpe-retry-pill{color:#F5B94C;background:rgba(245,185,76,.1);border:1px solid rgba(245,185,76,.28);}
            .kpe-retry-pill::before{content:'';width:4px;height:4px;border-radius:50%;background:#F5B94C;opacity:.9;}
            .kpe-shimmer{position:relative;height:2px;margin:12px 0;border-radius:99px;background:rgba(127,127,127,.06);overflow:hidden;z-index:1;}
            .kpe-shimmer::after{content:'';position:absolute;top:0;left:0;height:100%;width:35%;background:linear-gradient(90deg,transparent 0%,var(--kpe-loader-accent) 50%,transparent 100%);opacity:.65;animation:kpe-shimmer-run 2.2s var(--kpe-ease-emph) infinite;will-change:transform;}
            @keyframes kpe-shimmer-run{0%{transform:translateX(-100%);}100%{transform:translateX(320%);}}
            .kpe-panel-loading__meta{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;color:var(--kpe-text-faint);flex-wrap:wrap;}
            .kpe-panel-loading__meta-l,.kpe-panel-loading__meta-r{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
            .kpe-time{display:inline-flex;align-items:center;gap:6px;font-family:var(--kpe-mono);font-size:10.5px;font-variant-numeric:tabular-nums;color:var(--kpe-text-muted);}
            .kpe-time__label{font-family:var(--kpe-font);font-size:10px;font-weight:600;color:var(--kpe-text-faint);letter-spacing:.08em;text-transform:uppercase;}
            .kpe-debug-toggle{appearance:none;display:inline-flex;align-items:center;gap:5px;background:transparent;border:1px solid var(--kpe-border);color:var(--kpe-text-muted);font-family:var(--kpe-font);font-size:11px;font-weight:500;padding:4px 10px;border-radius:99px;cursor:pointer;transition:background var(--kpe-dur-fast) ease,border-color var(--kpe-dur-fast) ease,color var(--kpe-dur-fast) ease;}
            .kpe-debug-toggle:hover{background:var(--kpe-surface-2);border-color:var(--kpe-border-strong);color:var(--kpe-text);}
            .kpe-debug-toggle:focus-visible{outline:none;border-color:var(--kpe-accent);box-shadow:var(--kpe-accent-ring);}
            .kpe-debug-toggle svg{width:10px;height:10px;flex-shrink:0;transition:transform 220ms var(--kpe-ease-emph);}
            .kpe-debug-toggle[aria-expanded="true"] svg{transform:rotate(180deg);}
            .kpe-cancel{appearance:none;background:transparent;border:1px solid var(--kpe-border-strong);color:var(--kpe-text-muted);font-family:var(--kpe-font);font-size:11px;font-weight:500;padding:4px 12px;border-radius:99px;cursor:pointer;transition:background var(--kpe-dur-fast) ease,border-color var(--kpe-dur-fast) ease,color var(--kpe-dur-fast) ease,opacity var(--kpe-dur-fast) ease;}
            .kpe-cancel:hover{background:var(--kpe-surface-2);border-color:var(--kpe-text-faint);color:var(--kpe-text);}
            .kpe-cancel:focus-visible{outline:none;border-color:var(--kpe-accent);box-shadow:var(--kpe-accent-ring);}
            .kpe-cancel[disabled]{opacity:.6;cursor:wait;}
            .kpe-debug{display:grid;grid-template-rows:0fr;transition:grid-template-rows 260ms var(--kpe-ease-emph);margin:0 -16px;position:relative;z-index:1;}
            .kpe-debug.is-open{grid-template-rows:1fr;}
            .kpe-debug__clip{overflow:hidden;min-height:0;}
            .kpe-debug__inner{margin:14px 16px 0 16px;padding-top:12px;border-top:1px dashed var(--kpe-border-strong);display:flex;flex-direction:column;gap:12px;min-width:0;}
            .kpe-debug__grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:11px;min-width:0;}
            .kpe-debug__row{display:flex;align-items:baseline;gap:6px;min-width:0;}
            .kpe-debug__key{flex-shrink:0;min-width:64px;font-family:var(--kpe-font);font-size:10px;font-weight:500;color:var(--kpe-text-faint);text-transform:uppercase;letter-spacing:.05em;}
            .kpe-debug__val{font-family:var(--kpe-mono);font-size:10.5px;color:var(--kpe-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;transition:color 200ms var(--kpe-ease-emph);}
            .kpe-debug__val.is-muted{color:var(--kpe-text-faint);}
            .kpe-debug__val.is-accent{color:var(--kpe-loader-accent);}
            .kpe-debug__val.is-warn{color:#F5B94C;}
            .kpe-debug__val.is-err{color:var(--kpe-error);}
            .kpe-debug__val.is-ok{color:var(--kpe-success);}
            .kpe-debug__log{max-height:130px;overflow-y:auto;background:var(--kpe-surface-code);border:1px solid var(--kpe-border);border-radius:10px;padding:6px 8px;font-family:var(--kpe-mono);font-size:10.5px;line-height:1.55;scrollbar-width:thin;scrollbar-color:var(--kpe-border-strong) transparent;}
            .kpe-debug__log::-webkit-scrollbar{width:6px;}
            .kpe-debug__log::-webkit-scrollbar-thumb{background:var(--kpe-border-strong);border-radius:3px;}
            .kpe-debug__log-line{display:flex;align-items:baseline;gap:6px;color:var(--kpe-text-muted);animation:kpe-log-in 260ms var(--kpe-ease-emph);}
            @keyframes kpe-log-in{from{opacity:0;transform:translateY(-2px);}to{opacity:1;transform:translateY(0);}}
            .kpe-debug__log-line + .kpe-debug__log-line{margin-top:1px;}
            .kpe-debug__log-time{color:var(--kpe-text-faint);flex-shrink:0;min-width:42px;}
            .kpe-debug__log-ev{color:var(--kpe-loader-accent);flex-shrink:0;}
            .kpe-debug__log-detail{color:var(--kpe-text-muted);min-width:0;overflow-wrap:anywhere;word-break:break-word;}
            /* audit-skip: intentional scoped selector */ .kpe-debug__log-line.is-warn .kpe-debug__log-ev{color:#F5B94C;}
            /* audit-skip: intentional scoped selector */ .kpe-debug__log-line.is-err .kpe-debug__log-ev{color:var(--kpe-error);}
            /* audit-skip: intentional scoped selector */ .kpe-debug__log-line.is-ok .kpe-debug__log-ev{color:var(--kpe-success);}
            .kpe-panel-loading[data-state="connecting"]{--kpe-loader-accent:#7C9CFF;--kpe-loader-glow:rgba(124,156,255,.4);}
            .kpe-panel-loading[data-state="waiting"]{--kpe-loader-accent:#9BA1AD;--kpe-loader-glow:rgba(155,161,173,.3);}
            .kpe-panel-loading[data-state="streaming"]{--kpe-loader-accent:#4D8BFF;--kpe-loader-glow:rgba(77,139,255,.5);}
            .kpe-panel-loading[data-state="finalizing"]{--kpe-loader-accent:#10A37F;--kpe-loader-glow:rgba(16,163,127,.45);}
            .kpe-panel-loading[data-state="retrying"]{--kpe-loader-accent:#F5B94C;--kpe-loader-glow:rgba(245,185,76,.45);}
            .kpe-panel-loading.is-float{position:relative;inset:auto;display:flex;align-items:stretch;justify-content:flex-start;padding:0;background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;border-radius:0;overflow:visible;}
            /* audit-skip: intentional scoped selector */ .kpe-panel-loading.is-float .kpe-panel-loading__card{min-width:0;max-width:400px;flex:1 1 auto;}
            .kpe-float-wrap{position:fixed;bottom:24px;right:24px;z-index:2147483645;max-width:400px;font-family:var(--kpe-font);}
            @media (max-width:520px){.kpe-float-wrap{left:12px;right:12px;bottom:12px;max-width:none;}.kpe-panel-loading.is-float .kpe-panel-loading__card{max-width:none;}.kpe-panel-loading__meta{flex-direction:column;align-items:flex-start;}.kpe-panel-loading__meta-r{width:100%;justify-content:space-between;}}
            @media (prefers-reduced-motion: reduce){
                .kpe-dots span{animation:none;opacity:.6;}
                .kpe-shimmer::after{animation:none;transform:translateX(35%);opacity:.5;}
                .kpe-debug,.kpe-debug-toggle svg,.kpe-panel-loading__title,.kpe-panel-loading__sub{transition:none;}
                .kpe-debug__log-line{animation:none;}
                .kpe-panel-loading__halo{transition:none;}
            }

            /* ===== Error block ===== */
            .kpe-panel-error{padding:11px 13px;border-radius:var(--kpe-radius);background:var(--kpe-surface-2);border:1px solid var(--kpe-border-strong);border-left:3px solid var(--kpe-error);color:var(--kpe-text);font-size:12.5px;font-weight:500;line-height:1.45;margin-bottom:12px;}
            .kpe-panel-error-slot:empty{display:none;}
            .kpe-panel-error-slot{margin-bottom:10px;}
            .kpe-panel-error__title{font-weight:600;color:var(--kpe-text);margin-bottom:3px;}
            .kpe-panel-error__desc{font-weight:400;color:var(--kpe-text-muted);font-size:12px;line-height:1.4;}
            .kpe-panel-error__details{margin-top:8px;font-size:11px;}
            .kpe-panel-error__details summary{cursor:pointer;color:var(--kpe-accent);font-weight:500;user-select:none;}
            .kpe-panel-error__details pre{margin:6px 0 0;padding:8px 10px;background:var(--kpe-surface-code);border:1px solid var(--kpe-border);border-radius:6px;font-family:var(--kpe-mono);font-size:10.5px;line-height:1.4;color:var(--kpe-text-muted);white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;max-height:180px;overflow:auto;min-width:0;max-width:100%;}
            .kpe-param-body{display:flex;flex-direction:column;min-width:0;}
            .kpe-param-presets{display:flex;gap:6px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--kpe-border-soft);}
            .kpe-param-preset{flex:1;padding:6px 10px;font-family:inherit;font-size:11.5px;font-weight:500;color:var(--kpe-text-muted);background:var(--kpe-surface);border:1px solid var(--kpe-border);border-radius:7px;cursor:pointer;}
            .kpe-param-preset:hover{background:var(--kpe-accent-soft);border-color:var(--kpe-accent-border);color:var(--kpe-accent);}
            .kpe-param-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;min-width:0;}
            .kpe-param-label{flex:0 0 130px;font-size:11.5px;font-weight:600;color:var(--kpe-text-muted);padding-top:6px;}
            .kpe-param-control{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px;max-width:100%;}
            .kpe-param-input{width:100%;max-width:200px;padding:6px 8px;font-family:var(--kpe-mono);font-size:12px;color:var(--kpe-text);background:var(--kpe-surface-2);border:1px solid var(--kpe-border);border-radius:6px;outline:none;font-variant-numeric:tabular-nums;box-sizing:border-box;min-width:0;}
            .kpe-param-input:focus{border-color:var(--kpe-text-muted);background:var(--kpe-surface);box-shadow:var(--kpe-focus-ring);}
            select.kpe-param-input{max-width:240px;font-family:var(--kpe-font);}
            .kpe-param-hint{font-size:10.5px;color:var(--kpe-text-faint);line-height:1.4;overflow-wrap:anywhere;}
            .kpe-param-row--full{flex-direction:column;align-items:stretch;gap:6px;min-width:0;}
            .kpe-param-row--full .kpe-param-label{flex:0 0 auto;padding-top:0;}
            .kpe-param-row--full .kpe-param-input{max-width:100%;}
            .kpe-provider-actions{display:flex;align-items:center;gap:8px;margin:4px 0 14px;}
            .kpe-provider-status{display:inline-flex;align-items:center;gap:6px;margin-left:8px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:600;line-height:1.3;border:1px solid transparent;}
            .kpe-provider-status::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.8;}
            .kpe-provider-status.is-ok{color:var(--kpe-success);background:var(--kpe-success-soft);border-color:color-mix(in srgb,var(--kpe-success) 18%, transparent);}
            .kpe-provider-status.is-error{color:var(--kpe-error);background:var(--kpe-error-soft);border-color:color-mix(in srgb,var(--kpe-error) 18%, transparent);}
            .kpe-pop-list{max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;margin-top:8px;}
            .kpe-pop-item{display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--kpe-surface-code);border:1px solid var(--kpe-border);border-radius:7px;font-size:11.5px;min-width:0;}
            .kpe-pop-item__checkbox{display:inline-flex;align-items:center;cursor:pointer;flex-shrink:0;}
            .kpe-pop-item__checkbox input{display:none;}
            .kpe-pop-item__checkbox input:not(:checked) + .kpe-checkbox{background:transparent;border-color:var(--kpe-border-strong);}
            .kpe-pop-item__checkbox input:not(:checked) + .kpe-checkbox::after{display:none;}
            .kpe-pop-item__checkbox input:checked + .kpe-checkbox{border-color:var(--kpe-text-muted);background:var(--kpe-text-muted);}
            .kpe-pop-item__checkbox input:checked + .kpe-checkbox::after{content:'';position:absolute;left:3.5px;top:1px;width:5px;height:8px;border:solid var(--kpe-surface);border-width:0 2px 2px 0;transform:rotate(45deg);}
            .kpe-pop-item__meta{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;}
            .kpe-pop-item__name{font-weight:500;color:var(--kpe-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .kpe-pop-item__size{font-size:10.5px;color:var(--kpe-text-faint);font-variant-numeric:tabular-nums;}
            .kpe-pop-item__remove{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:5px;color:var(--kpe-text-faint);cursor:pointer;padding:0;flex-shrink:0;}
            .kpe-pop-item__remove:hover{background:var(--kpe-surface-2);color:var(--kpe-error);}
            .kpe-pop-item__remove svg{width:12px;height:12px;}
            .kpe-pop-total{margin-top:10px;padding:8px 10px;background:var(--kpe-surface-2);border-radius:7px;font-size:11px;color:var(--kpe-text-muted);font-variant-numeric:tabular-nums;text-align:center;}
            .kpe-pop-total.is-over{color:var(--kpe-error);border:1px solid var(--kpe-error);}
            .kpe-pop-paste-name{width:100%;padding:8px 10px;font-family:var(--kpe-mono);font-size:11.5px;color:var(--kpe-text);background:var(--kpe-surface);border:1px solid var(--kpe-border);border-radius:7px;outline:none;box-sizing:border-box;min-width:0;max-width:100%;}
            .kpe-toast{position:fixed;right:18px;bottom:18px;z-index:2147483647;max-width:360px;padding:11px 15px;font-family:var(--kpe-font);font-size:13px;font-weight:500;color:var(--kpe-text);background:linear-gradient(180deg,var(--kpe-surface),var(--kpe-surface-2));border:1px solid var(--kpe-border-strong);border-left:3px solid var(--kpe-text-muted);border-radius:var(--kpe-radius);box-shadow:var(--kpe-shadow-panel);word-break:break-word;pointer-events:none;}
            .kpe-toast.is-error{border-left-color:var(--kpe-error);}
            .kpe-toast.is-success{border-left-color:var(--kpe-success);}
            @media (max-width:520px){.kpe-toast{right:12px;bottom:12px;left:12px;max-width:none;}}
            /* audit-skip: intentional scoped selector */ .kpe-toast.has-action,.kpe-toast.has-details{pointer-events:auto;}
            .kpe-toast__row{display:flex;align-items:flex-start;gap:10px;}
            .kpe-toast__msg{flex:1 1 auto;min-width:0;}
            .kpe-toast__msg.is-multiline{display:flex;flex-direction:column;gap:3px;}
            .kpe-toast__line--headline{font-weight:600;color:var(--kpe-text);}
            .kpe-toast__line--detail{font-weight:400;font-size:12px;color:var(--kpe-text-muted);line-height:1.4;}
            .kpe-toast__action{flex-shrink:0;padding:4px 10px;font-family:inherit;font-size:11.5px;font-weight:600;color:var(--kpe-accent);background:var(--kpe-accent-soft);border:1px solid var(--kpe-accent-border);border-radius:6px;cursor:pointer;}
            .kpe-toast__action:hover{background:var(--kpe-accent);color:#fff;border-color:var(--kpe-accent);}
            .kpe-toast__details{margin-top:8px;font-size:10.5px;}
            .kpe-toast__details summary{cursor:pointer;color:var(--kpe-text-faint);font-weight:500;user-select:none;}
            .kpe-toast__details pre{margin:6px 0 0;padding:8px 10px;background:var(--kpe-surface-2);border:1px solid var(--kpe-border);border-radius:6px;font-family:var(--kpe-mono);font-size:10px;line-height:1.4;color:var(--kpe-text-muted);white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;max-height:200px;overflow:auto;min-width:0;max-width:100%;}

            /* Settings modal */
            .kpe-modal-backdrop{position:fixed;inset:0;background:rgba(9,12,18,.52);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:2147483644;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;opacity:0;transition:opacity var(--kpe-dur-base) ease;}
            .kpe-modal-backdrop.is-open{opacity:1;}
            /* Fixed outer dimensions prevent tab content from resizing the dialog. */
            .kpe-modal{position:relative;box-sizing:border-box;width:min(760px,100%);height:min(680px,calc(100vh - 32px));height:min(680px,calc(100dvh - 32px));max-width:100%;max-height:min(680px,calc(100vh - 32px));max-height:min(680px,calc(100dvh - 32px));min-height:0;margin:0;opacity:1;transform:scale(0.96);transition:transform var(--kpe-dur-base) var(--kpe-ease-spring);min-width:0;}
            /* audit-skip: intentional scoped selector */ .kpe-modal-backdrop.is-open .kpe-modal{transform:scale(1);}
            /* Scroll only the active tab content; keep header, tabs and footer fixed. */
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__body{flex:1 1 0;min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;}
            .kpe-modal-tabs{display:flex;gap:2px;padding:0 12px;border-bottom:1px solid var(--kpe-border);flex:0 0 auto;overflow-x:auto;scrollbar-width:none;}
            .kpe-modal-tabs::-webkit-scrollbar{display:none;}
            .kpe-modal-tab{padding:10px 14px;font-family:inherit;font-size:12.5px;font-weight:500;color:var(--kpe-text-muted);background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;margin-bottom:-1px;transition:color var(--kpe-dur-fast) ease,border-color var(--kpe-dur-fast) ease;white-space:nowrap;}
            .kpe-modal-tab:hover{color:var(--kpe-text);}
            .kpe-modal-tab.is-active{color:var(--kpe-accent);border-bottom-color:var(--kpe-accent);}
            .kpe-settings-errors{margin-bottom:10px;}
            /* History */
            .kpe-history-item{border:1px solid var(--kpe-border);border-radius:var(--kpe-radius);margin-bottom:8px;background:var(--kpe-surface);overflow:hidden;min-width:0;}
            .kpe-history-item:last-child{margin-bottom:0;}
            .kpe-history-item__heading{display:flex;align-items:center;gap:4px;padding-right:6px;min-width:0;}
            .kpe-history-item__header{display:flex;flex:1 1 auto;align-items:center;gap:10px;width:100%;min-width:0;padding:10px 6px 10px 12px;background:transparent;border:none;font-family:inherit;text-align:left;cursor:pointer;}
            .kpe-history-item__header:hover{background:var(--kpe-surface-2);}
            .kpe-history-item__copy{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;gap:6px;min-width:44px;min-height:44px;padding:7px 9px;border:1px solid transparent;border-radius:8px;color:var(--kpe-text-muted);background:transparent;font:500 11px/1.2 var(--kpe-font);cursor:pointer;transition:background var(--kpe-dur-fast),color var(--kpe-dur-fast),border-color var(--kpe-dur-fast);}
            .kpe-history-item__copy:hover{color:var(--kpe-accent-text);background:var(--kpe-accent-soft);border-color:var(--kpe-accent-border);}
            .kpe-history-item__copy:focus-visible{outline:2px solid var(--kpe-accent);outline-offset:1px;box-shadow:var(--kpe-accent-ring);}
            .kpe-history-item__copy .kpe-ico{width:14px;height:14px;}
            .kpe-history-item__status{flex-shrink:0;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-size:11px;font-weight:700;background:var(--kpe-surface-2);}
            .kpe-history-item__status.is-success{color:var(--kpe-success);}
            .kpe-history-item__status.is-error{color:var(--kpe-error);}
            .kpe-history-item__status.is-aborted{color:#b45309;}
            .kpe-history-item__main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px;}
            .kpe-history-item__preview{font-size:12.5px;color:var(--kpe-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .kpe-history-item__meta{font-size:10.5px;color:var(--kpe-text-faint);font-variant-numeric:tabular-nums;display:flex;flex-wrap:wrap;gap:4px;align-items:center;}
            .kpe-history-item__chevron{width:14px;height:14px;flex-shrink:0;color:var(--kpe-text-faint);transition:transform var(--kpe-dur-base) var(--kpe-ease-emph);}
            /* audit-skip: intentional scoped selector */ .kpe-history-item.is-expanded .kpe-history-item__chevron{transform:rotate(180deg);}
            .kpe-history-item__details{display:none;padding:10px 12px;border-top:1px solid var(--kpe-border);background:var(--kpe-surface-code);min-width:0;}
            /* audit-skip: intentional scoped selector */ .kpe-history-item.is-expanded .kpe-history-item__details{display:block;}
            .kpe-history-badge{display:inline-block;padding:1px 6px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--kpe-text-muted);background:var(--kpe-surface-2);border-radius:4px;margin-right:6px;}
            .kpe-history-legacy-badge{display:inline-block;padding:1px 5px;font-size:9.5px;font-weight:600;color:var(--kpe-text-faint);background:var(--kpe-surface-3);border-radius:3px;margin-right:6px;}
            .kpe-history-outcome{padding:1px 6px;border-radius:3px;font-weight:600;font-size:10px;}
            .kpe-outcome-applied{color:var(--kpe-success);background:rgba(16,163,127,.1);}
            .kpe-outcome-cancelled{color:var(--kpe-text-muted);background:var(--kpe-surface-3);}
            .kpe-outcome-error{color:var(--kpe-error);background:rgba(209,69,59,.1);}
            .kpe-outcome-aborted{color:#b45309;background:rgba(180,83,9,.1);}
            .kpe-outcome-pending{color:var(--kpe-accent);background:var(--kpe-accent-soft);}
            .kpe-history-section{margin-bottom:10px;min-width:0;}
            .kpe-history-section:last-child{margin-bottom:0;}
            .kpe-history-section__label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--kpe-text-faint);margin-bottom:4px;}
            .kpe-history-pre{margin:0;padding:8px 10px;background:var(--kpe-surface-2);border:1px solid var(--kpe-border);border-radius:6px;font-family:var(--kpe-mono);font-size:11px;line-height:1.5;color:var(--kpe-text-muted);white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;max-height:220px;overflow:auto;min-width:0;max-width:100%;}
            .kpe-history-pre.is-error{background:rgba(209,69,59,0.06);border-color:rgba(209,69,59,0.3);color:var(--kpe-error);}
            .kpe-history-kv{font-size:12px;font-family:var(--kpe-mono);color:var(--kpe-text-muted);font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}
            .kpe-history-empty{padding:24px;text-align:center;color:var(--kpe-text-faint);font-size:12.5px;line-height:1.5;}
            .kpe-history-call{border:1px solid var(--kpe-border);border-radius:6px;margin-bottom:6px;background:var(--kpe-surface);overflow:hidden;min-width:0;}
            .kpe-history-call:last-child{margin-bottom:0;}
            .kpe-history-call__header{display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;background:transparent;border:none;font-family:inherit;text-align:left;cursor:pointer;font-size:11.5px;min-width:0;}
            .kpe-history-call__header:hover{background:var(--kpe-surface-2);}
            .kpe-history-call__status{flex-shrink:0;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-size:10px;font-weight:700;background:var(--kpe-surface-2);}
            .kpe-history-call__status.is-success{color:var(--kpe-success);}
            .kpe-history-call__status.is-error{color:var(--kpe-error);}
            .kpe-history-call__main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;}
            .kpe-history-call__title{font-weight:500;color:var(--kpe-text);}
            .kpe-history-call__meta{font-size:10px;color:var(--kpe-text-faint);font-variant-numeric:tabular-nums;}
            .kpe-history-call__chevron{width:12px;height:12px;flex-shrink:0;color:var(--kpe-text-faint);transition:transform var(--kpe-dur-base) var(--kpe-ease-emph);}
            /* audit-skip: intentional scoped selector */ .kpe-history-call.is-expanded .kpe-history-call__chevron{transform:rotate(180deg);}
            .kpe-history-call__details{display:none;padding:8px 10px;border-top:1px solid var(--kpe-border);background:var(--kpe-surface-code);min-width:0;}
            /* audit-skip: intentional scoped selector */ .kpe-history-call.is-expanded .kpe-history-call__details{display:block;}
            .kpe-context-info{padding:12px 14px;background:var(--kpe-surface-2);border:1px solid var(--kpe-border);border-radius:var(--kpe-radius);margin-bottom:14px;}
            .kpe-context-info__title{font-size:12.5px;font-weight:600;color:var(--kpe-text);margin-bottom:4px;}
            .kpe-context-info__text{font-size:12px;color:var(--kpe-text-muted);font-variant-numeric:tabular-nums;margin-bottom:6px;}
            .kpe-context-info__hint{font-size:11px;color:var(--kpe-text-faint);line-height:1.4;margin-bottom:10px;}
            .kpe-context-manage{padding:6px 12px;font-family:inherit;font-size:11.5px;font-weight:500;color:var(--kpe-accent);background:var(--kpe-accent-soft);border:1px solid var(--kpe-accent-border);border-radius:7px;cursor:pointer;transition:background var(--kpe-dur-fast),color var(--kpe-dur-fast),border-color var(--kpe-dur-fast),transform var(--kpe-dur-fast);}
            .kpe-context-manage:hover{background:var(--kpe-accent);color:#fff;border-color:var(--kpe-accent);transform:translateY(-1px);}
            @media (max-width:720px){
                .kpe-btn .kpe-label{display:none;}
                .kpe-btn{padding:7px 9px;}
                .kpe-actionbar{padding:6px;}
                .kpe-panel{margin:4px 4px 6px;max-height:min(65vh,460px);}
                .kpe-panel__header{gap:8px;padding:10px 12px;}
                .kpe-panel__header h4{font-size:12.5px;}
                .kpe-prompt-base__meta{display:none;}
                .kpe-q-content-inner{padding:0 12px 12px 12px;}
                .kpe-code-textarea{min-height:88px;font-size:11px;}
                .kpe-agents-popover{width:290px;}
                .kpe-param-label{flex:0 0 100px;}
            }
            .kpe-scope .kpe-system-prompt{gap:14px;}
            .kpe-scope .kpe-system-prompt__intro{padding:2px 2px 0;}
            .kpe-scope .kpe-system-prompt__title{margin:0 0 4px;font-size:16px;line-height:1.35;font-weight:650;letter-spacing:-.01em;color:var(--kpe-text);}
            .kpe-scope .kpe-system-prompt__description{margin:0;max-width:680px;font-size:12px;line-height:1.55;color:var(--kpe-text-muted);}
            .kpe-scope .kpe-system-prompt__card{padding:16px;background:var(--kpe-surface);border:1px solid var(--kpe-border);border-radius:var(--kpe-radius-lg);min-width:0;}
            .kpe-scope .kpe-system-prompt__editor-card{border-color:var(--kpe-accent-border);box-shadow:0 1px 3px rgba(16,18,24,.04);}
            .kpe-scope .kpe-system-prompt__section-heading{margin-bottom:14px;}
            .kpe-scope .kpe-system-prompt__section-heading h6{margin:0;font-size:13px;font-weight:650;line-height:1.4;color:var(--kpe-text);}
            .kpe-scope .kpe-system-prompt__section-heading p{margin:4px 0 0;font-size:11.5px;line-height:1.45;color:var(--kpe-text-muted);}
            .kpe-scope .kpe-system-prompt__label{display:block;margin:0 0 6px;font-size:11.5px;font-weight:600;color:var(--kpe-text-muted);}
            .kpe-scope .kpe-system-prompt__textarea{display:block;width:100%;min-height:230px;padding:12px 13px;font-family:var(--kpe-mono);font-size:12px;line-height:1.6;tab-size:2;background:linear-gradient(180deg,var(--kpe-surface-code),var(--kpe-surface));border:1px solid var(--kpe-border-strong);border-radius:10px;resize:vertical;transition:border-color var(--kpe-dur-fast),box-shadow var(--kpe-dur-fast),background var(--kpe-dur-fast),transform var(--kpe-dur-fast);}
            .kpe-scope .kpe-system-prompt__textarea:focus{border-color:var(--kpe-accent);box-shadow:var(--kpe-accent-ring);background:var(--kpe-surface);}
            .kpe-scope .kpe-system-prompt__textarea[aria-invalid="true"]{border-color:var(--kpe-error);box-shadow:0 0 0 3px rgba(207,46,46,.12);}
            .kpe-scope .kpe-system-prompt__meta{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-top:8px;min-width:0;}
            .kpe-scope .kpe-system-prompt__count{flex:0 0 auto;font-size:10.5px;font-variant-numeric:tabular-nums;color:var(--kpe-text-faint);}
            .kpe-scope .kpe-system-prompt__feedback{flex:1 1 auto;min-width:0;text-align:right;font-size:11px;line-height:1.45;color:var(--kpe-text-muted);overflow-wrap:anywhere;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-system-prompt__feedback.is-error{color:var(--kpe-error);font-weight:600;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-system-prompt__feedback.is-warning{color:var(--kpe-warning);}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-system-prompt__feedback.is-valid{color:var(--kpe-success);}
            .kpe-scope .kpe-system-prompt__editor-controls{display:flex;justify-content:flex-end;margin-top:12px;padding-top:10px;border-top:1px solid var(--kpe-border-soft);}
            .kpe-scope .kpe-system-prompt__preset-fields{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;}
            .kpe-scope .kpe-system-prompt__field{display:flex;flex-direction:column;align-items:stretch;min-width:0;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-system-prompt__select,.kpe-scope .kpe-system-prompt__name{width:100%;max-width:none;min-height:36px;font-family:var(--kpe-font);font-size:12px;border-radius:8px;}
            .kpe-scope .kpe-system-prompt__helper{margin:5px 0 0;font-size:10.5px;line-height:1.4;color:var(--kpe-text-faint);}
            .kpe-scope .kpe-system-prompt__preset-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;padding-top:12px;border-top:1px solid var(--kpe-border-soft);}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-system-prompt__preset-actions .kpe-btn{min-height:32px;padding:6px 9px;font-size:11.5px;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-system-prompt__preset-actions .kpe-btn[disabled]{opacity:.42;cursor:not-allowed;}
            .kpe-scope .kpe-system-prompt__default{border:1px solid var(--kpe-border);border-radius:var(--kpe-radius);background:var(--kpe-surface-2);overflow:hidden;}
            .kpe-scope .kpe-system-prompt__default summary{padding:11px 13px;font-size:11.5px;font-weight:600;color:var(--kpe-text-muted);cursor:pointer;list-style-position:inside;}
            .kpe-scope .kpe-system-prompt__default summary:hover{color:var(--kpe-text);}
            .kpe-scope .kpe-system-prompt__default[open] summary{border-bottom:1px solid var(--kpe-border);}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-system-prompt__default .kpe-system-prompt__helper{margin:12px 13px 8px;}
            .kpe-scope .kpe-system-prompt__default-textarea{display:block;width:calc(100% - 26px);max-width:none;min-height:120px;margin:0 13px 13px;padding:10px 11px;font-family:var(--kpe-mono);font-size:11px;line-height:1.55;background:var(--kpe-surface-code);color:var(--kpe-text-muted);resize:vertical;}
            .kpe-scope .kpe-system-prompt__default-textarea:focus{border-color:var(--kpe-border-strong);box-shadow:var(--kpe-focus-ring);}
            .kpe-scope .kpe-system-prompt__default-textarea:read-only{cursor:text;}
            @media (max-width:600px){
                .kpe-modal-backdrop{padding:12px;}
                .kpe-modal{width:100%;height:min(680px,calc(100vh - 24px));height:min(680px,calc(100dvh - 24px));max-height:min(680px,calc(100vh - 24px));max-height:min(680px,calc(100dvh - 24px));}
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer{justify-content:flex-end;gap:8px;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn:first-child{margin-right:auto;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn--primary{color:var(--kpe-accent-text);background:var(--kpe-accent-soft);border-color:var(--kpe-accent-border);}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn--primary:hover:not([disabled]){color:var(--kpe-accent-text);background:var(--kpe-accent-soft);border-color:var(--kpe-accent);}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn--primary .kpe-ico{color:var(--kpe-accent-text);}
            @media (max-width:600px){
                .kpe-scope .kpe-system-prompt{gap:10px;}
                .kpe-scope .kpe-system-prompt__card{padding:12px;}
                .kpe-scope .kpe-system-prompt__textarea{min-height:190px;font-size:11px;}
                .kpe-scope .kpe-system-prompt__meta{flex-direction:column;gap:4px;}
                .kpe-scope .kpe-system-prompt__feedback{text-align:left;}
                .kpe-scope .kpe-system-prompt__preset-fields{grid-template-columns:minmax(0,1fr);}
                .kpe-scope .kpe-system-prompt__preset-actions .kpe-btn{flex:1 1 calc(50% - 6px);justify-content:center;}
                .kpe-scope .kpe-modal .kpe-panel__footer{padding:9px 10px;gap:5px;}
                .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn{padding:7px 8px;font-size:11px;}
            }
            @media (max-width:720px){
                .kpe-scope .kpe-system-prompt .kpe-btn .kpe-label,
                .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn .kpe-label{display:inline-block;}
            }
        `);
        GM_addStyle(`
            .kpe-modal-backdrop{
                position:fixed;inset:0;z-index:2147483645;display:flex;align-items:center;justify-content:center;padding:clamp(10px,3vw,28px);background:rgba(20,23,31,.46);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);transition:opacity 220ms cubic-bezier(0.16,1,0.3,1);
            }
            /* audit-skip: intentional scoped selector */ .kpe-modal-backdrop.is-open .kpe-modal{transform:translate3d(0,0,0);opacity:1;}
            .kpe-scope .kpe-modal{
                width:min(1040px,100%);
                height:min(820px,calc(100vh - 56px));
                height:min(820px,calc(100dvh - 56px));
                max-height:min(820px,calc(100vh - 56px));
                max-height:min(820px,calc(100dvh - 56px));
                border-color:var(--kpe-border-strong);
                border-radius:18px;
                background:linear-gradient(180deg,var(--kpe-surface) 0%,var(--kpe-surface-2) 100%);
                box-shadow:0 28px 80px rgba(20,24,36,.24),0 4px 14px rgba(20,24,36,.12),inset 0 1px 0 rgba(255,255,255,.55);
                transform:translate3d(0,8px,0);
                transition:transform 220ms cubic-bezier(0.16,1,0.3,1),opacity 180ms ease;
                will-change:transform,opacity;
            }
            .kpe-scope .kpe-modal::before{
                content:"";
                position:absolute;
                z-index:1;
                top:0;
                left:18px;
                right:18px;
                height:1px;
                background:linear-gradient(90deg,transparent,rgba(255,255,255,.78),transparent);
                pointer-events:none;
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__header{
                min-height:76px;
                padding:16px 22px;
                background:var(--kpe-surface);
                border-bottom:1px solid var(--kpe-border);
            }
            .kpe-modal-heading{display:flex;flex-direction:column;gap:3px;min-width:0;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__header h4{
                font-size:17px;
                line-height:1.25;
                letter-spacing:-.02em;
                font-weight:650;
            }
            .kpe-modal-heading p{margin:0;color:var(--kpe-text-muted);font-size:11.5px;line-height:1.4;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__close{width:34px;height:34px;border-color:var(--kpe-border);background:var(--kpe-surface-2);border-radius:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.5);}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__close:hover{background:var(--kpe-surface-3);color:var(--kpe-text);}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__close:focus-visible{outline:2px solid var(--kpe-accent);outline-offset:2px;box-shadow:var(--kpe-accent-ring),inset 0 1px 0 rgba(255,255,255,.5);}
            .kpe-modal-layout{display:flex;flex:1 1 0;min-height:0;min-width:0;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-modal-tabs{
                flex:0 0 224px;
                width:224px;
                min-width:0;
                padding:20px 12px;
                display:flex;
                flex-direction:column;
                align-items:stretch;
                gap:5px;
                overflow-x:hidden;
                overflow-y:auto;
                border-right:1px solid var(--kpe-border);
                border-bottom:0;
                background:linear-gradient(180deg,var(--kpe-surface-2),var(--kpe-surface));
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-modal-tabs::before{
                content:"SEÇÕES";
                padding:0 10px 9px;
                color:var(--kpe-text-faint);
                font-size:9.5px;
                line-height:1.2;
                font-weight:700;
                letter-spacing:.12em;
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-modal-tab{
                position:relative;
                display:flex;
                align-items:center;
                gap:var(--kpe-space-2);
                width:100%;
                min-height:40px;
                margin:0;
                padding:8px 10px;
                border:1px solid transparent;
                border-radius:var(--kpe-radius-sm);
                color:var(--kpe-text-muted);
                text-align:left;
                white-space:normal;
                font-size:var(--kpe-fs-sm);
                font-weight:var(--kpe-fw-medium);
                transition:background-color var(--kpe-dur-fast) ease,color var(--kpe-dur-fast) ease,border-color var(--kpe-dur-fast) ease;
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-modal-tab:hover{
                color:var(--kpe-text);
                background:var(--kpe-surface);
                border-color:var(--kpe-border-soft);
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-modal-tab:focus-visible{
                outline:2px solid var(--kpe-accent);
                outline-offset:2px;
                box-shadow:none;
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-modal-tab.is-active{
                color:var(--kpe-accent-text);
                background:var(--kpe-accent-soft);
                border-color:var(--kpe-accent-border);
            }
            .kpe-modal-tab .kpe-ico{width:16px;height:16px;color:currentColor;flex-shrink:0;}
            .kpe-modal-tab__label{font-size:var(--kpe-fs-sm);line-height:1.35;font-weight:inherit;}
            .kpe-modal-main{display:flex;flex:1 1 0;flex-direction:column;min-width:0;min-height:0;background:var(--kpe-surface);}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__body{
                flex:1 1 0;
                min-height:0;
                padding:26px clamp(20px,4vw,40px);
                overflow-x:hidden;
                overflow-y:auto;
                overscroll-behavior:contain;
                scrollbar-color:var(--kpe-border-strong) transparent;
                scrollbar-width:thin;
                background:linear-gradient(180deg,rgba(255,255,255,.02),transparent 120px);
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer{
                position:sticky;
                bottom:0;
                z-index:2;
                display:flex;
                align-items:center;
                justify-content:flex-end;
                gap:8px;
                min-height:64px;
                padding:12px 18px;
                border-top:1px solid var(--kpe-border);
                background:linear-gradient(180deg,rgba(255,255,255,.94),var(--kpe-surface));
                backdrop-filter:blur(8px);
                -webkit-backdrop-filter:blur(8px);
            }
            .kpe-settings-intro{
                display:flex;
                align-items:flex-start;
                gap:14px;
                margin:0 0 22px;
                padding:0 0 18px;
                border-bottom:1px solid var(--kpe-border-soft);
                animation:kpe-settings-fade-in 180ms ease both;
                will-change:opacity;
            }
            .kpe-settings-intro__icon{
                display:flex;
                align-items:center;
                justify-content:center;
                flex:0 0 38px;
                width:38px;
                height:38px;
                border:1px solid var(--kpe-accent-border);
                border-radius:11px;
                color:var(--kpe-accent);
                background:linear-gradient(145deg,var(--kpe-accent-soft),var(--kpe-surface));
                box-shadow:inset 0 1px 0 rgba(255,255,255,.55);
            }
            .kpe-settings-intro__icon .kpe-ico{width:18px;height:18px;}
            .kpe-settings-intro__text{min-width:0;}
            .kpe-settings-intro h5{margin:0 0 4px;color:var(--kpe-text);font-size:17px;line-height:1.3;font-weight:650;letter-spacing:-.015em;}
            .kpe-settings-intro p{margin:0;color:var(--kpe-text-muted);font-size:12px;line-height:1.5;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-body:not(.kpe-system-prompt){
                gap:0;
                padding:20px;
                border:1px solid var(--kpe-border);
                border-radius:13px;
                background:linear-gradient(180deg,var(--kpe-surface),var(--kpe-surface-2));
                box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 3px 12px rgba(20,24,36,.035);
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-body.kpe-provider-settings{
                max-width:none;
                gap:12px;
                padding:0;
                border:0;
                background:transparent;
                box-shadow:none;
                display:flex;
                flex-direction:column;
                min-height:0;
            }
            .kpe-provider-header{
                display:flex;
                flex-direction:column;
                gap:10px;
                flex:0 0 auto;
                min-width:0;
            }
            .kpe-provider-scroll{
                display:flex;
                flex-direction:column;
                gap:10px;
                flex:1 1 auto;
                min-height:0;
                overflow-y:auto;
                padding-right:4px;
                overscroll-behavior:contain;
            }
            .kpe-catalog-loading{padding:7px 10px;border:1px solid var(--kpe-border-soft);border-radius:8px;color:var(--kpe-text-muted);background:var(--kpe-surface-2);font-size:11px;}
            .kpe-catalog-filters{display:flex;flex-wrap:wrap;align-items:center;gap:7px;min-width:0;padding:4px 0;background:var(--kpe-surface);}
            .kpe-provider-settings .kpe-catalog-filters{position:static;top:auto;z-index:auto;}
            .kpe-catalog-filters .kpe-param-input{flex:1 1 100%;width:100%;min-width:0;min-height:38px;}
            .kpe-catalog-toggle{position:relative;display:inline-flex;align-items:center;gap:7px;min-height:30px;padding:5px 9px;border:1px solid var(--kpe-border-soft);border-radius:var(--kpe-radius-pill);color:var(--kpe-text-muted);background:var(--kpe-surface-2);font-size:10.5px;line-height:1.3;white-space:normal;cursor:pointer;transition:background-color var(--kpe-dur-fast),border-color var(--kpe-dur-fast),color var(--kpe-dur-fast);}
            .kpe-catalog-toggle input{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;clip-path:inset(50%);}
            .kpe-catalog-toggle:has(input:checked){border-color:var(--kpe-accent-border);color:var(--kpe-accent-text);background:var(--kpe-accent-soft);}
            .kpe-catalog-toggle:focus-within{outline:2px solid var(--kpe-accent);outline-offset:2px;}
            .kpe-catalog-fallback-toggle{padding:8px 10px;border:1px solid var(--kpe-border-soft);border-radius:8px;background:var(--kpe-surface-2);}
            .kpe-catalog-fallback-toggle input{position:static;width:15px;height:15px;margin:0;overflow:visible;clip:auto;clip-path:none;accent-color:var(--kpe-accent);}
            .kpe-provider-badge.is-dynamic{color:#1769aa;border-color:rgba(23,105,170,.24);background:rgba(23,105,170,.08);}
            .kpe-provider-badge.is-curated{color:var(--kpe-text-muted);background:var(--kpe-surface-2);}
            .kpe-catalog-list{display:flex;flex-direction:column;gap:0;min-height:96px;overflow:auto;border:1px solid var(--kpe-border);border-radius:9px;background:var(--kpe-surface);}
            .kpe-provider-settings .kpe-catalog-list{flex:1 1 auto;min-height:150px;max-height:none;overflow:visible;border:0;border-radius:0;background:transparent;}
            .kpe-catalog-list[hidden]{display:none;}
            .kpe-provider-section{min-width:0;}
            .kpe-provider-section-header{display:none;}
            .kpe-provider-section__models[hidden]{display:none;}
            .kpe-provider-picker{display:none;}
            .kpe-provider-picker[hidden]{display:none;}
            .kpe-catalog-provider-back{min-height:30px;padding:5px 9px;font-size:10.5px;}
            /* audit-skip: intentional scoped selector */ .kpe-routing-chain,.kpe-routing-chain__step,.kpe-routing-chain__label,.kpe-routing-chain__arrow,.kpe-routing-chain__condition,.kpe-routing-chain__none{display:none;}
            /* audit-skip: intentional scoped selector */ .kpe-model-row,.kpe-model-row__provider,.kpe-model-row__name,.kpe-model-row__badges,.kpe-model-row__badge,.kpe-model-details__title,.kpe-model-details__id,.kpe-model-details__metadata{display:none;}
            .kpe-provider-settings .kpe-model-details{position:static;bottom:auto;z-index:auto;flex:0 0 auto;margin-top:0;}
            .kpe-provider-empty{padding:18px 12px;color:var(--kpe-text-muted);font-size:11.5px;line-height:1.5;text-align:center;}
            .kpe-provider-empty p{margin:0 0 8px;}
            .kpe-provider-empty .kpe-btn{min-height:32px;padding:5px 9px;font-size:10.5px;}
            .kpe-provider-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;min-width:0;}
            .kpe-provider-section-heading{min-width:0;}
            .kpe-provider-section-heading h6{margin:0;color:var(--kpe-text);font-size:13px;line-height:1.4;font-weight:650;}
            .kpe-provider-section-heading p{margin:3px 0 0;color:var(--kpe-text-muted);font-size:11.5px;line-height:1.45;}
            .kpe-provider-toolbar > .kpe-btn{flex:0 0 auto;min-height:38px;border-radius:8px;}
            .kpe-provider-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;min-width:0;}
            .kpe-provider-card{
                display:flex;
                flex-direction:column;
                gap:12px;
                min-width:0;
                padding:14px;
                border:1px solid var(--kpe-border);
                border-radius:12px;
                background:linear-gradient(180deg,var(--kpe-surface),var(--kpe-surface-2));
                box-shadow:inset 0 1px 0 rgba(255,255,255,.42),0 2px 8px rgba(20,24,36,.025);
                transition:border-color var(--kpe-dur-fast),background-color var(--kpe-dur-fast);
            }
            .kpe-provider-card.is-active{border-color:var(--kpe-accent);background:linear-gradient(180deg,var(--kpe-accent-soft),var(--kpe-surface));}
            .kpe-provider-card__header{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;min-width:0;}
            .kpe-provider-card__header strong{min-width:0;color:var(--kpe-text);font-size:13px;line-height:1.4;font-weight:650;overflow-wrap:anywhere;}
            .kpe-provider-card__badges{display:flex;flex:0 0 auto;flex-wrap:wrap;justify-content:flex-end;gap:5px;}
            .kpe-provider-badge,.kpe-provider-role{
                display:inline-flex;
                align-items:center;
                min-height:22px;
                padding:3px 7px;
                border:1px solid var(--kpe-border);
                border-radius:var(--kpe-radius-pill);
                color:var(--kpe-text-muted);
                background:var(--kpe-surface);
                font-size:10px;
                line-height:1.2;
                font-weight:600;
                white-space:nowrap;
            }
            .kpe-provider-role.is-active{color:var(--kpe-accent-text);border-color:var(--kpe-accent-border);background:var(--kpe-accent-soft);}
            .kpe-provider-role.is-fallback{color:var(--kpe-warning);border-color:color-mix(in srgb,var(--kpe-warning) 32%,var(--kpe-border));background:var(--kpe-warning-soft);}
            .kpe-provider-card__meta{
                min-width:0;
                padding:8px 9px;
                border:1px solid var(--kpe-border-soft);
                border-radius:8px;
                color:var(--kpe-text-muted);
                background:var(--kpe-surface-code);
                font-family:var(--kpe-mono);
                font-size:10.5px;
                line-height:1.5;
                overflow-wrap:anywhere;
                word-break:break-word;
            }
            .kpe-provider-actions{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0;}
            .kpe-provider-actions .kpe-btn{min-height:34px;padding:7px 9px;border-radius:7px;font-size:11px;}
            .kpe-provider-actions .kpe-btn[aria-pressed="true"]{font-weight:650;}
            /* audit-skip: intentional scoped selector */ .kpe-provider-empty{
                grid-column:1/-1;
                padding:20px;
                border:1px dashed var(--kpe-border-strong);
                border-radius:12px;
                color:var(--kpe-text-muted);
                background:var(--kpe-surface-2);
                font-size:12px;
                line-height:1.55;
                text-align:center;
            }
            .kpe-provider-editor-wrap:empty{display:none;}
            .kpe-provider-editor{
                padding:16px;
                border:1px solid var(--kpe-accent-border);
                border-radius:12px;
                background:linear-gradient(180deg,var(--kpe-accent-soft),var(--kpe-surface));
                box-shadow:inset 0 1px 0 rgba(255,255,255,.42),0 4px 14px rgba(77,107,254,.045);
            }
            .kpe-provider-editor .kpe-field-title{margin:0 0 14px;color:var(--kpe-text);font-size:14px;line-height:1.4;font-weight:650;}
            .kpe-provider-editor .kpe-param-row{margin-bottom:13px;}
            .kpe-provider-editor .kpe-param-label{padding-top:0;font-size:11.5px;}
            .kpe-provider-editor .kpe-param-control{gap:5px;}
            .kpe-provider-editor .kpe-param-input{width:100%;max-width:none;min-height:38px;font-family:var(--kpe-font);font-variant-numeric:normal;}
            .kpe-provider-editor textarea.kpe-param-input{min-height:110px;padding:10px 11px;font-family:var(--kpe-mono);line-height:1.5;resize:vertical;}
            .kpe-provider-editor .kpe-check-row{
                display:flex;
                align-items:flex-start;
                gap:9px;
                min-height:40px;
                margin:2px 0 14px;
                padding:10px 11px;
                border:1px solid var(--kpe-border);
                border-radius:8px;
                color:var(--kpe-text);
                background:var(--kpe-surface);
                font-size:11.5px;
                line-height:1.4;
                cursor:pointer;
            }
            .kpe-provider-editor .kpe-check-row input{flex:0 0 auto;width:16px;height:16px;margin:0;accent-color:var(--kpe-accent);}
            .kpe-provider-editor .kpe-provider-actions{padding-top:12px;border-top:1px solid var(--kpe-border-soft);}
            /* audit-skip: intentional scoped selector */ .kpe-provider-editor .kpe-provider-actions .kpe-btn{min-height:38px;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-body:not(.kpe-system-prompt) .kpe-param-row:last-child{margin-bottom:0;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-presets{margin-bottom:17px;padding-bottom:15px;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-preset{min-height:34px;font-size:11.5px;transition:transform 150ms cubic-bezier(0.16,1,0.3,1),opacity 150ms ease;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-preset:hover{transform:translate3d(0,-1px,0);}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-input{min-height:36px;border-radius:8px;font-size:12px;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-label{color:var(--kpe-text);font-size:12px;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-hint{font-size:11px;line-height:1.5;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-context-info{
                padding:16px;
                border:1px solid var(--kpe-accent-border);
                border-radius:12px;
                background:linear-gradient(180deg,var(--kpe-accent-soft),var(--kpe-surface));
                box-shadow:inset 0 1px 0 rgba(255,255,255,.48),0 10px 20px rgba(77,107,254,.04);
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-system-prompt__card{
                border:1px solid var(--kpe-border);
                border-radius:13px;
                background:linear-gradient(180deg,var(--kpe-surface),var(--kpe-surface-2));
                box-shadow:inset 0 1px 0 rgba(255,255,255,.48),0 3px 12px rgba(20,24,36,.035);
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-history-item{
                border:1px solid var(--kpe-border);
                border-radius:11px;
                background:linear-gradient(180deg,var(--kpe-surface),var(--kpe-surface-2));
                box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 2px 8px rgba(20,24,36,.025);
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-history-empty{
                padding:24px;
                border:1px dashed var(--kpe-border-strong);
                border-radius:12px;
                background:var(--kpe-surface-2);
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer{
                min-height:66px;
                padding:12px 22px;
                border-top:1px solid var(--kpe-border);
                background:linear-gradient(180deg,var(--kpe-surface),var(--kpe-surface-2));
                box-shadow:0 -4px 14px rgba(20,24,36,.025);
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn{
                min-height:36px;
                padding:8px 13px;
                border-radius:8px;
                transition:transform 150ms cubic-bezier(0.16,1,0.3,1),opacity 150ms ease;
                will-change:transform,opacity;
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn:hover:not([disabled]){transform:translate3d(0,-1px,0);}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn[disabled]{opacity:.48;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn--primary{box-shadow:0 2px 5px rgba(77,107,254,.12),inset 0 1px 0 rgba(255,255,255,.14);}
            .kpe-settings-errors{margin-bottom:10px;animation:kpe-settings-fade-in 160ms ease both;will-change:opacity;}
            @keyframes kpe-settings-fade-in{from{opacity:0;}to{opacity:1;}}
            @media (max-width:760px){
                .kpe-modal-backdrop{padding:10px;}
                .kpe-scope .kpe-modal{
                    width:min(680px,100%);
                    height:min(820px,calc(100vh - 20px));
                    height:min(820px,calc(100dvh - 20px));
                    max-height:min(820px,calc(100vh - 20px));
                    max-height:min(820px,calc(100dvh - 20px));
                }
                .kpe-modal-layout{flex-direction:column;}
                .kpe-scope .kpe-modal .kpe-modal-tabs{
                    flex:0 0 auto;
                    width:100%;
                    padding:8px 10px;
                    flex-direction:row;
                    align-items:stretch;
                    gap:5px;
                    overflow-x:auto;
                    overflow-y:hidden;
                    border-right:0;
                    border-bottom:1px solid var(--kpe-border);
                    scrollbar-width:none;
                }
                .kpe-scope .kpe-modal .kpe-modal-tabs::-webkit-scrollbar{display:none;}
                .kpe-scope .kpe-modal .kpe-modal-tabs::before{display:none;}
                .kpe-scope .kpe-modal .kpe-modal-tab{
                    flex:1 0 auto;
                    width:auto;
                    min-height:40px;
                    justify-content:center;
                    gap:var(--kpe-space-2);
                    padding:8px 10px;
                    white-space:nowrap;
                }
                .kpe-modal-tab .kpe-ico{width:15px;height:15px;}
                .kpe-scope .kpe-modal .kpe-panel__body{padding:20px clamp(14px,4vw,26px);}
                .kpe-scope .kpe-modal .kpe-panel__footer{min-height:60px;padding:10px 16px;}
            }
            @media (max-width:480px){
                .kpe-history-item__heading{gap:0;padding-right:4px;}
                .kpe-history-item__header{gap:7px;padding-left:8px;}
                .kpe-history-item__copy{width:44px;min-width:44px;padding:7px;}
                .kpe-history-item__copy .kpe-label{display:none;}
                .kpe-provider-toolbar{align-items:stretch;flex-direction:column;}
                .kpe-provider-toolbar > .kpe-btn{width:100%;min-height:44px;}
                .kpe-catalog-filters{align-items:center;}
                .kpe-catalog-filters .kpe-param-input{flex-basis:100%;min-height:42px;}
                .kpe-catalog-toggle{flex:0 1 auto;}
                .kpe-catalog-provider-back{flex:0 0 auto;}
                .kpe-provider-list{grid-template-columns:minmax(0,1fr);gap:10px;}
                .kpe-catalog-list{gap:0;}
                .kpe-provider-card{padding:12px;}
                .kpe-provider-actions .kpe-btn{flex:1 1 calc(50% - 6px);min-height:44px;justify-content:center;padding:8px 6px;}
                .kpe-provider-editor{padding:12px;}
                .kpe-provider-editor .kpe-param-row--full{gap:5px;}
                .kpe-provider-editor .kpe-param-input{min-height:42px;}
                .kpe-provider-editor textarea.kpe-param-input{min-height:100px;}
                .kpe-provider-editor .kpe-provider-actions .kpe-btn{flex:1 1 calc(50% - 6px);min-height:44px;}
                .kpe-scope .kpe-modal .kpe-panel__header{min-height:64px;padding:12px 15px;}
                .kpe-scope .kpe-modal .kpe-panel__header h4{font-size:15px;}
                .kpe-modal-heading p{font-size:10.5px;}
                .kpe-scope .kpe-modal .kpe-modal-tab{gap:0;min-width:42px;padding:8px;}
                .kpe-scope .kpe-modal .kpe-modal-tab__label{font-size:10.5px;}
                .kpe-scope .kpe-modal .kpe-panel__body{padding:17px 12px;}
                .kpe-settings-intro{gap:10px;margin-bottom:16px;padding-bottom:14px;}
                .kpe-settings-intro__icon{flex-basis:34px;width:34px;height:34px;}
                .kpe-settings-intro h5{font-size:15px;}
                .kpe-settings-intro p{font-size:11px;}
                .kpe-scope .kpe-modal .kpe-param-body:not(.kpe-system-prompt){padding:14px;}
                .kpe-scope .kpe-modal .kpe-param-presets{flex-wrap:wrap;}
                .kpe-scope .kpe-modal .kpe-param-preset{flex:1 1 40%;}
                .kpe-scope .kpe-modal .kpe-param-row:not(.kpe-param-row--full){flex-direction:column;gap:5px;}
                .kpe-scope .kpe-modal .kpe-param-row:not(.kpe-param-row--full) .kpe-param-label{flex:auto;padding-top:0;}
                .kpe-scope .kpe-modal .kpe-param-row:not(.kpe-param-row--full) .kpe-param-input{max-width:100%;}
                .kpe-scope .kpe-modal .kpe-panel__footer{gap:6px;padding:9px 10px;}
                .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn{min-height:34px;padding:7px 9px;font-size:11px;}
            }
            @media (prefers-reduced-motion:reduce){
                .kpe-scope .kpe-modal .kpe-param-preset,.kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn{will-change:auto;}
            }
            @media (prefers-color-scheme:dark){
                .kpe-scope .kpe-modal{box-shadow:0 28px 80px rgba(0,0,0,.42),0 4px 14px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.07);}
                .kpe-scope .kpe-modal::before{background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);}
                .kpe-scope .kpe-modal .kpe-modal-tab.is-active,.kpe-settings-intro__icon{box-shadow:inset 0 1px 0 rgba(255,255,255,.06);}
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-hint,
            .kpe-scope .kpe-modal .kpe-system-prompt__helper{color:#5b6472;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-body:not(.kpe-system-prompt){max-width:680px;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-input{
                background:#f3f5f8;
                border-color:#7c8491;
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-input::placeholder{color:#596575;opacity:1;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-input:focus{background:var(--kpe-surface);border-color:var(--kpe-accent);}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-presets{gap:4px;}
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-preset{
                position:relative;
                border-radius:8px;
                transition:transform 150ms cubic-bezier(0.16,1,0.3,1),background-color 140ms ease,border-color 140ms ease,color 140ms ease,box-shadow 140ms ease;
                will-change:transform;
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-preset.is-active,
            .kpe-scope .kpe-modal .kpe-param-preset[aria-pressed="true"]{
                color:var(--kpe-accent);
                background:var(--kpe-accent-soft);
                border-color:var(--kpe-accent);
                box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 0 0 2px rgba(77,107,254,.22),0 3px 8px rgba(77,107,254,.12);
                font-weight:650;
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-param-preset:focus-visible{
                outline:2px solid var(--kpe-accent);
                outline-offset:2px;
                box-shadow:var(--kpe-accent-ring);
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn{
                gap:8px;
                align-items:center;
                line-height:1.2;
            }
            /* audit-skip: intentional scoped selector */ .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn .kpe-ico{
                flex:0 0 14px;
                margin:0;
                vertical-align:middle;
            }
            @media (prefers-color-scheme:dark){
                .kpe-scope .kpe-modal .kpe-param-hint,
                .kpe-scope .kpe-modal .kpe-system-prompt__helper{color:#b8bfca;}
                .kpe-scope .kpe-modal .kpe-param-input{
                    background:#202226;
                    border-color:#707784;
                }
                .kpe-scope .kpe-modal .kpe-param-input::placeholder{color:#9099a8;}
                .kpe-scope .kpe-modal .kpe-param-preset.is-active,
                .kpe-scope .kpe-modal .kpe-param-preset[aria-pressed="true"]{
                    background:#303b61;
                    border-color:#8799ff;
                    color:#c3ccff;
                    box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 0 2px rgba(135,153,255,.24),0 3px 8px rgba(0,0,0,.2);
                }
            }
            @media (prefers-reduced-motion:reduce){
                .kpe-scope .kpe-modal .kpe-param-preset{will-change:auto;}
            }

            /* Provider accordion (aba Provedor) */
            .kpe-provider-group-title{
                margin:var(--kpe-space-3) 0 var(--kpe-space-1);
                padding:0 2px;
                color:var(--kpe-text-faint);
                font-size:11px;
                font-weight:600;
                line-height:1.4;
                text-transform:uppercase;
                letter-spacing:.02em;
            }
            .kpe-provider-group-title:first-child{margin-top:0;}
            .kpe-model-card{
                margin-bottom:var(--kpe-space-2);
                border:1px solid var(--kpe-border);
                border-radius:8px;
                background:var(--kpe-surface);
                transition:border-color var(--kpe-dur-fast) var(--kpe-ease-standard),background-color var(--kpe-dur-fast) var(--kpe-ease-standard);
            }
            .kpe-model-card.is-active{border-color:var(--kpe-accent-border);background:var(--kpe-accent-soft);}
            .kpe-model-header{
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:var(--kpe-space-2);
                width:100%;
                padding:10px 11px;
                border:0;
                border-radius:8px;
                color:var(--kpe-text);
                background:transparent;
                font:inherit;
                text-align:left;
                cursor:pointer;
            }
            .kpe-model-header:focus-visible{outline:2px solid var(--kpe-accent);outline-offset:2px;}
            /* audit-skip: intentional scoped selector */ .kpe-model-card.is-active .kpe-model-header{border-bottom:1px solid var(--kpe-border-soft);border-radius:8px 8px 0 0;}
            .kpe-model-info{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1 1 auto;}
            .kpe-model-info__name{color:var(--kpe-text);font-size:12px;font-weight:600;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .kpe-model-info__id{color:var(--kpe-text-muted);font:10.5px/1.4 var(--kpe-mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .kpe-model-header__meta{display:flex;align-items:center;gap:6px;flex:0 0 auto;}
            .kpe-model-badges{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:4px;}
            .kpe-model-badge{padding:2px 5px;border:1px solid var(--kpe-border-soft);border-radius:var(--kpe-radius-pill);color:var(--kpe-text-muted);background:var(--kpe-surface-2);font-size:9px;line-height:1.3;font-weight:600;white-space:nowrap;}
            .kpe-chevron{flex:0 0 auto;color:var(--kpe-text-faint);font-size:11px;line-height:1;transition:transform var(--kpe-dur-base) var(--kpe-ease-standard);transform:rotate(0deg);}
            /* audit-skip: intentional scoped selector */ .kpe-model-card.is-active .kpe-chevron{transform:rotate(180deg);}
            .kpe-model-expand{
                display:grid;
                grid-template-rows:0fr;
                transition:grid-template-rows var(--kpe-dur-base) var(--kpe-ease-standard);
            }
            /* audit-skip: intentional scoped selector */ .kpe-model-card.is-active .kpe-model-expand{grid-template-rows:1fr;}
            .kpe-model-expand__clip{overflow:hidden;min-height:0;}
            .kpe-model-details{
                display:grid;
                grid-template-columns:max-content minmax(0,1fr);
                gap:5px 12px;
                min-width:0;
                padding:10px 11px 11px;
                font-size:10.5px;
                line-height:1.4;
            }
            .kpe-model-details dt{margin:0;color:var(--kpe-text-muted);font-weight:600;}
            .kpe-model-details dd{min-width:0;margin:0;color:var(--kpe-text);overflow-wrap:anywhere;}
            .kpe-model-details__actions{grid-column:1 / -1;display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;}
            .kpe-model-details__actions .kpe-btn{min-height:35px;padding:7px 10px;font-size:11px;}
            .kpe-model-details__actions .kpe-btn:focus-visible{outline:2px solid var(--kpe-accent);outline-offset:2px;}
            .kpe-provider-accordion{display:flex;flex-direction:column;min-width:0;overflow:visible;}
            /* Painel de roteamento (principal + fallback) */
            .kpe-routing-panel{
                display:flex;
                align-items:center;
                flex-wrap:wrap;
                gap:var(--kpe-space-2);
                padding:10px 12px;
                border:1px solid var(--kpe-border);
                border-radius:var(--kpe-radius);
                background:var(--kpe-surface-2);
                font-size:var(--kpe-fs-sm);
                min-width:0;
            }
            .kpe-routing-step{display:flex;align-items:center;gap:6px;min-width:0;flex:0 1 auto;}
            .kpe-routing-label{
                display:inline-flex;
                align-items:center;
                padding:2px 7px;
                border-radius:var(--kpe-radius-pill);
                font-size:9.5px;
                font-weight:600;
                text-transform:uppercase;
                letter-spacing:.04em;
                white-space:nowrap;
            }
            .kpe-routing-label.is-primary{
                color:var(--kpe-accent);
                background:var(--kpe-accent-soft);
                border:1px solid var(--kpe-accent-border);
            }
            .kpe-routing-label.is-fallback{
                color:var(--kpe-warning);
                background:var(--kpe-warning-soft);
                border:1px solid color-mix(in srgb,var(--kpe-warning) 28%,var(--kpe-border));
            }
            .kpe-routing-value{color:var(--kpe-text);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px;}
            .kpe-routing-arrow{color:var(--kpe-text-faint);font-size:14px;flex-shrink:0;}
            .kpe-routing-none{color:var(--kpe-text-faint);font-style:italic;}
            .kpe-routing-clear{
                margin-left:auto;
                flex:0 0 auto;
                min-width:32px;
                height:32px;
                padding:0;
                border:1px solid var(--kpe-border);
                border-radius:var(--kpe-radius-sm);
                background:var(--kpe-surface);
                color:var(--kpe-text-muted);
                cursor:pointer;
                display:inline-flex;
                align-items:center;
                justify-content:center;
                transition:background var(--kpe-dur-fast),color var(--kpe-dur-fast),border-color var(--kpe-dur-fast);
            }
            .kpe-routing-clear:hover:not([disabled]){
                background:var(--kpe-error-soft);
                color:var(--kpe-error);
                border-color:var(--kpe-error);
            }
            .kpe-routing-clear[disabled]{opacity:.45;cursor:not-allowed;}
            .kpe-routing-clear .kpe-ico{width:14px;height:14px;}
            /* Badges semânticas de rota */
            .kpe-model-badge.is-primary{
                color:var(--kpe-accent);
                background:var(--kpe-accent-soft);
                border-color:var(--kpe-accent-border);
            }
            .kpe-model-badge.is-fallback{
                color:var(--kpe-warning);
                background:var(--kpe-warning-soft);
                border-color:color-mix(in srgb,var(--kpe-warning) 28%,var(--kpe-border));
            }
            @media (prefers-reduced-motion: reduce){
                .kpe-model-expand{transition:none;}
                .kpe-chevron{transition:none;}
            }
        `);
    }
