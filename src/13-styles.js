// ===== src/13-styles.js =====
    function injectStyles() {
        GM_addStyle(`
            :where(.kpe-scope){
                --kpe-surface:#ffffff;--kpe-surface-2:#f5f6f8;--kpe-surface-3:#ebecef;--kpe-surface-code:#fbfcfd;
                --kpe-text:#1a1a1a;--kpe-text-muted:#6b7280;--kpe-text-faint:#9ca3af;
                --kpe-border:#e5e6e9;--kpe-border-strong:#d1d3d9;--kpe-border-soft:#e8eaee;
                --kpe-success:#10a37f;--kpe-error:#d1453b;--kpe-warning:#946200;--kpe-accent:#4d6bfe;--kpe-accent-soft:#f0f2ff;--kpe-accent-border:#dde3ff;
                --kpe-radius-sm:6px;--kpe-radius:10px;--kpe-radius-lg:14px;
                --kpe-gap-1:4px;--kpe-gap-2:6px;--kpe-gap-3:8px;
                --kpe-shadow-panel:0 12px 32px rgba(16,18,24,.14),0 2px 8px rgba(16,18,24,.08);
                --kpe-shadow-popover:0 12px 32px rgba(16,18,24,.14),0 2px 8px rgba(16,18,24,.08);
                --kpe-focus-ring:0 0 0 3px rgba(107,114,128,.15);--kpe-accent-ring:0 0 0 3px rgba(77,107,254,.10);
                --kpe-font:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Helvetica Neue",Arial,sans-serif;
                --kpe-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
                --kpe-dur-micro:120ms;--kpe-dur-fast:180ms;--kpe-dur-base:260ms;--kpe-dur-slow:260ms;
                --kpe-ease-out:cubic-bezier(0.05,0.7,0.1,1);--kpe-ease-emph:cubic-bezier(0.2,0,0,1);--kpe-ease-spring:cubic-bezier(0.34,1.56,0.64,1);
            }
            @media (prefers-color-scheme: dark){:where(.kpe-scope){
                --kpe-surface:#1c1d21;--kpe-surface-2:#26282d;--kpe-surface-3:#32353b;--kpe-surface-code:#202226;
                --kpe-text:#eceef2;--kpe-text-muted:#9ba1ad;--kpe-text-faint:#6b7280;
                --kpe-border:#2c2e34;--kpe-border-strong:#3b3e45;--kpe-border-soft:#2c2e34;
                --kpe-shadow-panel:0 14px 36px rgba(0,0,0,.55),0 2px 8px rgba(0,0,0,.35);
                --kpe-shadow-popover:0 14px 36px rgba(0,0,0,.55),0 2px 8px rgba(0,0,0,.35);
                --kpe-focus-ring:0 0 0 3px rgba(200,200,200,.12);
                --kpe-accent-soft:#1f2540;--kpe-accent-border:#2f3a5f;--kpe-warning:#e4b954;
            }}
            @media (prefers-reduced-motion: reduce){.kpe-scope *,.kpe-scope *::before,.kpe-scope *::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;}}
            /* v4.5.2 — universal box-sizing on all .kpe-scope descendants to prevent content-box overflow */
            :where(.kpe-scope) *,:where(.kpe-scope) *::before,:where(.kpe-scope) *::after{box-sizing:border-box;}
        `);
        GM_addStyle(`
            .kpe-scope .kpe-ico{width:14px;height:14px;flex-shrink:0;display:inline-block;vertical-align:middle;}
            .kpe-mount{display:block;width:100%;position:relative;font-family:var(--kpe-font);box-sizing:border-box;margin-bottom:var(--kpe-gap-2);}
            .kpe-mount *,.kpe-mount *::before,.kpe-mount *::after{box-sizing:border-box;}
            .kpe-actionbar{display:flex;align-items:center;gap:var(--kpe-gap-2);padding:var(--kpe-gap-2) var(--kpe-gap-3);background:transparent;border-bottom:1px solid var(--kpe-border);font-family:var(--kpe-font);font-size:12px;line-height:1;min-height:34px;flex-wrap:wrap;}
            .kpe-btn{position:relative;display:inline-flex;align-items:center;gap:var(--kpe-gap-2);padding:6px 10px;font:inherit;font-weight:500;color:var(--kpe-text-muted);background:transparent;border:1px solid transparent;border-radius:var(--kpe-radius-sm);cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;isolation:isolate;transition:background-color var(--kpe-dur-fast) ease,color var(--kpe-dur-fast) ease,border-color var(--kpe-dur-fast) ease;will-change:transform;}
            .kpe-btn:hover:not([disabled]){color:var(--kpe-text);background:var(--kpe-surface-2);}
            .kpe-btn:focus-visible{outline:none;border-color:var(--kpe-border-strong);background:var(--kpe-surface-2);box-shadow:var(--kpe-focus-ring);}
            .kpe-btn[disabled]{opacity:.5;cursor:not-allowed;}
            .kpe-btn .kpe-ico{width:14px;height:14px;flex-shrink:0;display:inline-block;}
            .kpe-btn .kpe-label{display:inline-block;}
            .kpe-btn--primary{color:var(--kpe-text);background:transparent;border-color:var(--kpe-border-strong);}
            .kpe-btn--primary:hover:not([disabled]){color:var(--kpe-text);background:var(--kpe-surface-2);border-color:var(--kpe-border-strong);}
            .kpe-btn--outline{color:var(--kpe-text);background:transparent;border-color:transparent;}
            .kpe-btn--outline:hover:not([disabled]){background:var(--kpe-surface-2);color:var(--kpe-text);border-color:var(--kpe-border);}
            .kpe-btn--agents .kpe-status-dot{width:6px;height:6px;border-radius:50%;background:var(--kpe-text-faint);flex-shrink:0;margin-left:2px;transition:background var(--kpe-dur-base) ease,box-shadow var(--kpe-dur-base) ease;}
            .kpe-btn--agents.is-loaded{color:var(--kpe-accent);border-color:var(--kpe-accent-border);background:var(--kpe-accent-soft);}
            .kpe-btn--agents.is-loaded:hover{background:var(--kpe-accent-soft);border-color:var(--kpe-accent);color:var(--kpe-accent);}
            .kpe-btn--agents.is-loaded .kpe-ico{color:var(--kpe-accent);}
            .kpe-btn--agents.is-loaded .kpe-status-dot{background:var(--kpe-accent);box-shadow:0 0 0 2px rgba(77,107,254,.2);}
            .kpe-btn.is-loading{pointer-events:none;}
            .kpe-btn.is-loading .kpe-ico,.kpe-btn.is-loading .kpe-label{opacity:.55;}
            .kpe-btn.is-loading::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent 20%,rgba(127,127,127,0.10) 45%,rgba(127,127,127,0.18) 50%,rgba(127,127,127,0.10) 55%,transparent 80%);background-size:220% 100%;animation:kpe-shimmer 1.3s linear infinite;pointer-events:none;border-radius:inherit;}
            @keyframes kpe-shimmer{from{background-position:140% 0;}to{background-position:-40% 0;}}
            .kpe-spin{animation:kpe-rotate 0.9s linear infinite;}
            @keyframes kpe-rotate{to{transform:rotate(360deg);}}
            .kpe-agents-popover{position:fixed;top:0;left:0;width:320px;background:var(--kpe-surface);border:1px solid var(--kpe-border-strong);border-radius:var(--kpe-radius-lg);box-shadow:var(--kpe-shadow-popover);opacity:0;transform:translateY(6px) scale(.98);transform-origin:bottom left;pointer-events:none;transition:opacity var(--kpe-dur-fast) ease,transform var(--kpe-dur-base) cubic-bezier(.34,1.4,.64,1);z-index:2147483646;overflow:hidden;font-family:var(--kpe-font);font-size:12px;color:var(--kpe-text);}
            .kpe-agents-popover.is-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}
            .kpe-pop-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--kpe-border-soft);}
            .kpe-pop-head-title{flex:1 1 auto;display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--kpe-text);min-width:0;}
            .kpe-pop-head-title .kpe-ico{width:14px;height:14px;color:var(--kpe-accent);flex-shrink:0;}
            .kpe-pop-close{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:5px;color:var(--kpe-text-faint);cursor:pointer;padding:0;flex-shrink:0;}
            .kpe-pop-close:hover{background:var(--kpe-surface-2);color:var(--kpe-text);}
            .kpe-pop-close svg{width:12px;height:12px;}
            .kpe-pop-body{padding:10px 12px;}
            .kpe-pop-empty{display:flex;flex-direction:column;gap:8px;}
            .kpe-pop-empty-title{font-size:12px;font-weight:500;color:var(--kpe-text-muted);text-align:center;line-height:1.5;}
            .kpe-pop-empty-hint{font-size:10.5px;color:var(--kpe-text-faint);text-align:center;line-height:1.5;}
            .kpe-pop-empty-hint code{font-family:var(--kpe-mono);font-size:10px;background:var(--kpe-surface-2);padding:1px 4px;border-radius:3px;}
            .kpe-pop-divider{height:1px;background:var(--kpe-border-soft);margin:2px 0;}
            .kpe-pop-action{display:flex;align-items:center;gap:9px;width:100%;padding:9px 11px;font-family:inherit;font-size:12px;font-weight:500;color:var(--kpe-text);background:var(--kpe-surface-code);border:1px solid var(--kpe-border);border-radius:8px;cursor:pointer;text-align:left;}
            .kpe-pop-action:hover{background:var(--kpe-accent-soft);border-color:var(--kpe-accent-border);}
            .kpe-pop-action .kpe-ico{width:14px;height:14px;color:var(--kpe-accent);flex-shrink:0;}
            .kpe-pop-action-body{flex:1 1 auto;display:flex;flex-direction:column;gap:1px;min-width:0;}
            .kpe-pop-action-title{font-weight:500;color:var(--kpe-text);line-height:1.3;}
            .kpe-pop-action-hint{font-size:10.5px;color:var(--kpe-text-faint);font-weight:400;line-height:1.3;}
            .kpe-pop-paste{display:flex;flex-direction:column;gap:8px;}
            .kpe-pop-paste-textarea{width:100%;padding:9px 11px;font-family:var(--kpe-mono);font-size:11px;line-height:1.55;color:var(--kpe-text);background:var(--kpe-surface);border:1px solid var(--kpe-border);border-radius:8px;outline:none;resize:vertical;min-height:100px;box-sizing:border-box;min-width:0;max-width:100%;}
            .kpe-pop-paste-actions{display:flex;gap:6px;}
            .kpe-pop-paste-actions button{flex:1;padding:6px 10px;font-family:inherit;font-size:11.5px;font-weight:500;border-radius:7px;cursor:pointer;border:1px solid var(--kpe-border);background:var(--kpe-surface);color:var(--kpe-text-muted);}
            .kpe-pop-paste-actions button:hover{background:var(--kpe-surface-2);color:var(--kpe-text);}
            .kpe-pop-paste-actions button.primary{background:var(--kpe-accent);border-color:var(--kpe-accent);color:#fff;}
            .kpe-pop-paste-actions button[disabled]{opacity:.5;cursor:not-allowed;}
            .kpe-pop-toggle{display:flex;align-items:center;gap:8px;padding:6px 2px;cursor:pointer;user-select:none;}
            .kpe-pop-toggle input{display:none;}
            .kpe-pop-toggle-switch{width:28px;height:16px;flex-shrink:0;background:var(--kpe-border-strong);border-radius:999px;position:relative;transition:background var(--kpe-dur-base) ease;}
            .kpe-pop-toggle-switch::after{content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform var(--kpe-dur-base) cubic-bezier(.34,1.56,.64,1);}
            .kpe-pop-toggle input:checked + .kpe-pop-toggle-switch{background:var(--kpe-accent);}
            .kpe-pop-toggle input:checked + .kpe-pop-toggle-switch::after{transform:translateX(12px);}
            .kpe-pop-toggle-label{flex:1 1 auto;font-size:11.5px;color:var(--kpe-text-muted);line-height:1.3;}
            .kpe-pop-toggle-label strong{font-weight:600;color:var(--kpe-text);}
            .kpe-pop-foot{display:flex;gap:6px;padding:8px 12px;background:var(--kpe-surface-code);border-top:1px solid var(--kpe-border-soft);}
            .kpe-pop-foot-btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:6px 10px;font-family:inherit;font-size:11.5px;font-weight:500;border-radius:7px;cursor:pointer;border:1px solid var(--kpe-border);background:var(--kpe-surface);color:var(--kpe-text-muted);}
            .kpe-pop-foot-btn:hover{background:var(--kpe-surface-2);color:var(--kpe-text);}
            .kpe-pop-foot-btn.danger{color:var(--kpe-error);border-color:#f0d4d2;}
            .kpe-pop-foot-btn.danger:hover{background:rgba(209,69,59,.08);border-color:var(--kpe-error);color:var(--kpe-error);}
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
            .kpe-prompt-base.is-expanded .kpe-prompt-base__chevron{transform:rotate(90deg);}
            .kpe-prompt-base__content{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--kpe-dur-base) var(--kpe-ease-emph);}
            .kpe-prompt-base.is-expanded .kpe-prompt-base__content{grid-template-rows:1fr;}
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
            .kpe-q-item.is-answered .kpe-q-num{background:var(--kpe-text-muted);color:var(--kpe-surface);border-color:var(--kpe-text-muted);}
            .kpe-q-item.is-answered .kpe-q-num span{display:none;}
            .kpe-q-item.is-answered .kpe-q-num svg{display:block;animation:kpe-draw-check var(--kpe-dur-slow) var(--kpe-ease-out) forwards;}
            @keyframes kpe-draw-check{to{stroke-dashoffset:0;}}
            .kpe-q-header-main{flex:1;min-width:0;}
            .kpe-q-text{font-size:13px;font-weight:500;color:var(--kpe-text);line-height:1.45;}
            .kpe-q-hint{display:block;font-size:11px;font-weight:500;color:var(--kpe-text-faint);margin-top:3px;max-height:30px;}
            .kpe-q-hint--code{display:inline-flex !important;align-items:center;gap:5px;margin-top:4px;padding:2px 8px 2px 6px;background:var(--kpe-accent-soft);border:1px solid var(--kpe-accent-border);border-radius:6px;color:var(--kpe-accent);font-size:10.5px;font-weight:500;max-height:24px;width:fit-content;}
            .kpe-q-hint--code svg{width:10px;height:10px;flex-shrink:0;}
            .kpe-q-summary{display:block;font-size:12px;color:var(--kpe-text-muted);margin-top:4px;line-height:1.4;opacity:0;max-height:0;overflow:hidden;transition:opacity var(--kpe-dur-base) var(--kpe-ease-out),max-height var(--kpe-dur-base) var(--kpe-ease-out);}
            .kpe-q-summary__value{color:var(--kpe-text);font-weight:600;}
            .kpe-q-item.is-answered:not(.is-open) .kpe-q-hint{opacity:0;max-height:0;overflow:hidden;}
            .kpe-q-item.is-answered:not(.is-open) .kpe-q-summary{opacity:1;max-height:60px;}
            .kpe-q-chevron{flex-shrink:0;width:16px;height:16px;color:var(--kpe-text-faint);margin-top:3px;transition:transform var(--kpe-dur-base) var(--kpe-ease-emph);}
            .kpe-q-item.is-open .kpe-q-chevron{transform:rotate(180deg);color:var(--kpe-text-muted);}
            .kpe-q-content{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--kpe-dur-base) var(--kpe-ease-emph);}
            .kpe-q-item.is-open .kpe-q-content{grid-template-rows:1fr;}
            .kpe-q-content > div{overflow:hidden;min-height:0;}
            .kpe-q-content-inner{padding:0 14px 12px 46px;min-width:0;}
            .kpe-options-group{display:flex;flex-direction:column;gap:1px;min-width:0;}
            .kpe-option{display:flex;align-items:center;gap:9px;padding:8px 10px;font-size:12.5px;color:var(--kpe-text);background:transparent;border:none;border-left:2px solid transparent;border-radius:0 6px 6px 0;cursor:pointer;user-select:none;}
            .kpe-option:hover{background:var(--kpe-surface-2);}
            .kpe-option.is-checked{background:var(--kpe-surface-3);border-left-color:var(--kpe-text-muted);}
            .kpe-radio,.kpe-checkbox{width:14px;height:14px;flex-shrink:0;position:relative;}
            .kpe-radio{border-radius:50%;border:1.5px solid var(--kpe-border-strong);}
            .kpe-checkbox{border-radius:4px;border:1.5px solid var(--kpe-border-strong);}
            .kpe-option.is-checked .kpe-radio{border-color:var(--kpe-text-muted);}
            .kpe-option.is-checked .kpe-radio::after{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--kpe-text-muted);}
            .kpe-option.is-checked .kpe-checkbox{border-color:var(--kpe-text-muted);background:var(--kpe-text-muted);}
            .kpe-option.is-checked .kpe-checkbox::after{content:'';position:absolute;left:3.5px;top:1px;width:5px;height:8px;border:solid var(--kpe-surface);border-width:0 2px 2px 0;transform:rotate(45deg);}
            .kpe-options-divider{display:flex;align-items:center;gap:8px;padding:8px 10px 6px;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--kpe-text-faint);}
            .kpe-options-divider::before,.kpe-options-divider::after{content:'';flex:1;height:1px;background:var(--kpe-border);}
            .kpe-free-text{display:flex;flex-direction:column;gap:0;padding:0;min-width:0;}
            .kpe-free-text__row{display:flex;align-items:center;gap:9px;padding:8px 10px;border-left:2px solid transparent;border-radius:0 6px 6px 0;cursor:pointer;user-select:none;font-size:12.5px;color:var(--kpe-text);}
            .kpe-free-text__row:hover{background:var(--kpe-surface-2);}
            .kpe-free-text.is-active .kpe-free-text__row{background:var(--kpe-surface-3);border-left-color:var(--kpe-text-muted);}
            .kpe-free-text.is-active .kpe-radio::after{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--kpe-text-muted);}
            .kpe-free-text.is-active .kpe-checkbox{border-color:var(--kpe-text-muted);background:var(--kpe-text-muted);}
            .kpe-free-text.is-active .kpe-checkbox::after{content:'';position:absolute;left:3.5px;top:1px;width:5px;height:8px;border:solid var(--kpe-surface);border-width:0 2px 2px 0;transform:rotate(45deg);}
            .kpe-free-text__label{font-weight:500;}
            .kpe-free-text__input-wrap{max-height:0;overflow:hidden;transition:max-height var(--kpe-dur-base) var(--kpe-ease-emph);}
            .kpe-free-text.is-active .kpe-free-text__input-wrap{max-height:200px;}
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
            .kpe-panel-loading{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:5;padding:16px;background:color-mix(in srgb,var(--kpe-surface) 94%,transparent);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);border-radius:inherit;overflow:hidden;--kpe-loader-accent:#7C9CFF;--kpe-loader-glow:rgba(124,156,255,.4);}
            .kpe-panel-loading.is-active{display:flex;}
            .kpe-panel-loading__card{position:relative;width:100%;max-width:380px;border-radius:22px;padding:12px 16px;background:radial-gradient(120% 160% at 20% -10%,color-mix(in srgb,var(--kpe-loader-accent) 8%,transparent) 0%,transparent 55%),radial-gradient(120% 160% at 100% 110%,rgba(255,255,255,.02) 0%,transparent 50%),var(--kpe-surface);border:1px solid var(--kpe-border);box-shadow:0 24px 56px -8px rgba(0,0,0,.7),0 8px 16px -4px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.05);overflow:hidden;isolation:isolate;transition:background 600ms var(--kpe-ease-emph);min-width:0;}
            @media (prefers-color-scheme: light){.kpe-panel-loading__card{background:radial-gradient(120% 160% at 20% -10%,color-mix(in srgb,var(--kpe-loader-accent) 8%,transparent) 0%,transparent 55%),radial-gradient(120% 160% at 100% 110%,rgba(0,0,0,.02) 0%,transparent 50%),var(--kpe-surface);box-shadow:0 24px 56px -8px rgba(16,18,24,.18),0 8px 16px -4px rgba(16,18,24,.08),inset 0 1px 0 rgba(255,255,255,.9);}}
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
            .kpe-debug__log-line.is-warn .kpe-debug__log-ev{color:#F5B94C;}
            .kpe-debug__log-line.is-err .kpe-debug__log-ev{color:var(--kpe-error);}
            .kpe-debug__log-line.is-ok .kpe-debug__log-ev{color:var(--kpe-success);}
            .kpe-panel-loading[data-state="connecting"]{--kpe-loader-accent:#7C9CFF;--kpe-loader-glow:rgba(124,156,255,.4);}
            .kpe-panel-loading[data-state="waiting"]{--kpe-loader-accent:#9BA1AD;--kpe-loader-glow:rgba(155,161,173,.3);}
            .kpe-panel-loading[data-state="streaming"]{--kpe-loader-accent:#4D8BFF;--kpe-loader-glow:rgba(77,139,255,.5);}
            .kpe-panel-loading[data-state="finalizing"]{--kpe-loader-accent:#10A37F;--kpe-loader-glow:rgba(16,163,127,.45);}
            .kpe-panel-loading[data-state="retrying"]{--kpe-loader-accent:#F5B94C;--kpe-loader-glow:rgba(245,185,76,.45);}
            .kpe-panel-loading.is-float{position:relative;inset:auto;display:flex;align-items:stretch;justify-content:flex-start;padding:0;background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;border-radius:0;overflow:visible;}
            .kpe-panel-loading.is-float .kpe-panel-loading__card{min-width:0;max-width:400px;flex:1 1 auto;}
            .kpe-float-wrap{position:fixed;bottom:24px;right:24px;z-index:2147483645;max-width:400px;font-family:var(--kpe-font);}
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
            .kpe-pop-list{max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;margin-top:8px;}
            .kpe-pop-item{display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--kpe-surface-code);border:1px solid var(--kpe-border);border-radius:7px;font-size:11.5px;min-width:0;}
            .kpe-pop-item__checkbox{display:inline-flex;align-items:center;cursor:pointer;flex-shrink:0;}
            .kpe-pop-item__checkbox input{display:none;}
            .kpe-pop-item__checkbox input:not(:checked) + .kpe-checkbox{background:transparent;border-color:var(--kpe-border-strong);}
            .kpe-pop-item__checkbox input:not(:checked) + .kpe-checkbox::after{display:none;}
            .kpe-pop-item__meta{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;}
            .kpe-pop-item__name{font-weight:500;color:var(--kpe-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .kpe-pop-item__size{font-size:10.5px;color:var(--kpe-text-faint);font-variant-numeric:tabular-nums;}
            .kpe-pop-item__remove{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:5px;color:var(--kpe-text-faint);cursor:pointer;padding:0;flex-shrink:0;}
            .kpe-pop-item__remove:hover{background:var(--kpe-surface-2);color:var(--kpe-error);}
            .kpe-pop-item__remove svg{width:12px;height:12px;}
            .kpe-pop-total{margin-top:10px;padding:8px 10px;background:var(--kpe-surface-2);border-radius:7px;font-size:11px;color:var(--kpe-text-muted);font-variant-numeric:tabular-nums;text-align:center;}
            .kpe-pop-total.is-over{color:var(--kpe-error);border:1px solid var(--kpe-error);}
            .kpe-pop-paste-name{width:100%;padding:8px 10px;font-family:var(--kpe-mono);font-size:11.5px;color:var(--kpe-text);background:var(--kpe-surface);border:1px solid var(--kpe-border);border-radius:7px;outline:none;box-sizing:border-box;min-width:0;max-width:100%;}
            .kpe-toast{position:fixed;right:18px;bottom:18px;z-index:2147483647;max-width:360px;padding:11px 15px;font-family:var(--kpe-font);font-size:13px;font-weight:500;color:var(--kpe-text);background:var(--kpe-surface);border:1px solid var(--kpe-border-strong);border-left:3px solid var(--kpe-text-muted);border-radius:var(--kpe-radius);box-shadow:var(--kpe-shadow-panel);word-break:break-word;pointer-events:none;}
            .kpe-toast.is-error{border-left-color:var(--kpe-error);}
            .kpe-toast.is-success{border-left-color:var(--kpe-success);}
            .kpe-toast.has-action,.kpe-toast.has-details{pointer-events:auto;}
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
            .kpe-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2147483644;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;opacity:0;transition:opacity var(--kpe-dur-base) ease;}
            .kpe-modal-backdrop.is-open{opacity:1;}
            /* Fixed outer dimensions prevent tab content from resizing the dialog. */
            .kpe-modal{position:relative;box-sizing:border-box;width:min(760px,100%);height:min(680px,calc(100vh - 32px));height:min(680px,calc(100dvh - 32px));max-width:100%;max-height:min(680px,calc(100vh - 32px));max-height:min(680px,calc(100dvh - 32px));min-height:0;margin:0;opacity:1;transform:scale(0.96);transition:transform var(--kpe-dur-base) var(--kpe-ease-spring);min-width:0;}
            .kpe-modal-backdrop.is-open .kpe-modal{transform:scale(1);}
            /* Scroll only the active tab content; keep header, tabs and footer fixed. */
            .kpe-scope .kpe-modal .kpe-panel__body{flex:1 1 0;min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;}
            .kpe-modal-tabs{display:flex;gap:2px;padding:0 12px;border-bottom:1px solid var(--kpe-border);flex:0 0 auto;overflow-x:auto;scrollbar-width:none;}
            .kpe-modal-tabs::-webkit-scrollbar{display:none;}
            .kpe-modal-tab{padding:10px 14px;font-family:inherit;font-size:12.5px;font-weight:500;color:var(--kpe-text-muted);background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;margin-bottom:-1px;transition:color var(--kpe-dur-fast) ease,border-color var(--kpe-dur-fast) ease;white-space:nowrap;}
            .kpe-modal-tab:hover{color:var(--kpe-text);}
            .kpe-modal-tab.is-active{color:var(--kpe-accent);border-bottom-color:var(--kpe-accent);}
            .kpe-settings-errors{margin-bottom:10px;}
            /* History */
            .kpe-history-item{border:1px solid var(--kpe-border);border-radius:var(--kpe-radius);margin-bottom:8px;background:var(--kpe-surface);overflow:hidden;min-width:0;}
            .kpe-history-item:last-child{margin-bottom:0;}
            .kpe-history-item__header{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;background:transparent;border:none;font-family:inherit;text-align:left;cursor:pointer;min-width:0;}
            .kpe-history-item__header:hover{background:var(--kpe-surface-2);}
            .kpe-history-item__status{flex-shrink:0;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-size:11px;font-weight:700;background:var(--kpe-surface-2);}
            .kpe-history-item__status.is-success{color:var(--kpe-success);}
            .kpe-history-item__status.is-error{color:var(--kpe-error);}
            .kpe-history-item__status.is-aborted{color:#b45309;}
            .kpe-history-item__main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px;}
            .kpe-history-item__preview{font-size:12.5px;color:var(--kpe-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
            .kpe-history-item__meta{font-size:10.5px;color:var(--kpe-text-faint);font-variant-numeric:tabular-nums;display:flex;flex-wrap:wrap;gap:4px;align-items:center;}
            .kpe-history-item__chevron{width:14px;height:14px;flex-shrink:0;color:var(--kpe-text-faint);transition:transform var(--kpe-dur-base) var(--kpe-ease-emph);}
            .kpe-history-item.is-expanded .kpe-history-item__chevron{transform:rotate(180deg);}
            .kpe-history-item__details{display:none;padding:10px 12px;border-top:1px solid var(--kpe-border);background:var(--kpe-surface-code);min-width:0;}
            .kpe-history-item.is-expanded .kpe-history-item__details{display:block;}
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
            .kpe-history-call.is-expanded .kpe-history-call__chevron{transform:rotate(180deg);}
            .kpe-history-call__details{display:none;padding:8px 10px;border-top:1px solid var(--kpe-border);background:var(--kpe-surface-code);min-width:0;}
            .kpe-history-call.is-expanded .kpe-history-call__details{display:block;}
            .kpe-context-info{padding:12px 14px;background:var(--kpe-surface-2);border:1px solid var(--kpe-border);border-radius:var(--kpe-radius);margin-bottom:14px;}
            .kpe-context-info__title{font-size:12.5px;font-weight:600;color:var(--kpe-text);margin-bottom:4px;}
            .kpe-context-info__text{font-size:12px;color:var(--kpe-text-muted);font-variant-numeric:tabular-nums;margin-bottom:6px;}
            .kpe-context-info__hint{font-size:11px;color:var(--kpe-text-faint);line-height:1.4;margin-bottom:10px;}
            .kpe-context-manage{padding:6px 12px;font-family:inherit;font-size:11.5px;font-weight:500;color:var(--kpe-accent);background:var(--kpe-accent-soft);border:1px solid var(--kpe-accent-border);border-radius:7px;cursor:pointer;}
            .kpe-context-manage:hover{background:var(--kpe-accent);color:#fff;border-color:var(--kpe-accent);}
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
            .kpe-scope .kpe-system-prompt__textarea{display:block;width:100%;min-height:230px;padding:12px 13px;font-family:var(--kpe-mono);font-size:12px;line-height:1.6;tab-size:2;background:var(--kpe-surface-code);border-color:var(--kpe-border-strong);resize:vertical;}
            .kpe-scope .kpe-system-prompt__textarea:focus{border-color:var(--kpe-accent);box-shadow:var(--kpe-accent-ring);}
            .kpe-scope .kpe-system-prompt__textarea[aria-invalid="true"]{border-color:var(--kpe-error);}
            .kpe-scope .kpe-system-prompt__meta{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-top:8px;min-width:0;}
            .kpe-scope .kpe-system-prompt__count{flex:0 0 auto;font-size:10.5px;font-variant-numeric:tabular-nums;color:var(--kpe-text-faint);}
            .kpe-scope .kpe-system-prompt__feedback{flex:1 1 auto;min-width:0;text-align:right;font-size:11px;line-height:1.45;color:var(--kpe-text-muted);overflow-wrap:anywhere;}
            .kpe-scope .kpe-system-prompt__feedback.is-error{color:var(--kpe-error);font-weight:600;}
            .kpe-scope .kpe-system-prompt__feedback.is-warning{color:var(--kpe-warning);}
            .kpe-scope .kpe-system-prompt__feedback.is-valid{color:var(--kpe-success);}
            .kpe-scope .kpe-system-prompt__editor-controls{display:flex;justify-content:flex-end;margin-top:12px;padding-top:10px;border-top:1px solid var(--kpe-border-soft);}
            .kpe-scope .kpe-system-prompt__preset-fields{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;}
            .kpe-scope .kpe-system-prompt__field{display:flex;flex-direction:column;align-items:stretch;min-width:0;}
            .kpe-scope .kpe-system-prompt__select,.kpe-scope .kpe-system-prompt__name{width:100%;max-width:none;min-height:36px;font-family:var(--kpe-font);font-size:12px;}
            .kpe-scope .kpe-system-prompt__helper{margin:5px 0 0;font-size:10.5px;line-height:1.4;color:var(--kpe-text-faint);}
            .kpe-scope .kpe-system-prompt__preset-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;padding-top:12px;border-top:1px solid var(--kpe-border-soft);}
            .kpe-scope .kpe-system-prompt__preset-actions .kpe-btn{min-height:32px;padding:6px 9px;font-size:11.5px;}
            .kpe-scope .kpe-system-prompt__preset-actions .kpe-btn[disabled]{opacity:.42;cursor:not-allowed;}
            .kpe-scope .kpe-system-prompt__default{border:1px solid var(--kpe-border);border-radius:var(--kpe-radius);background:var(--kpe-surface-2);overflow:hidden;}
            .kpe-scope .kpe-system-prompt__default summary{padding:11px 13px;font-size:11.5px;font-weight:600;color:var(--kpe-text-muted);cursor:pointer;list-style-position:inside;}
            .kpe-scope .kpe-system-prompt__default summary:hover{color:var(--kpe-text);}
            .kpe-scope .kpe-system-prompt__default[open] summary{border-bottom:1px solid var(--kpe-border);}
            .kpe-scope .kpe-system-prompt__default .kpe-system-prompt__helper{margin:12px 13px 8px;}
            .kpe-scope .kpe-system-prompt__default-textarea{display:block;width:calc(100% - 26px);max-width:none;min-height:120px;margin:0 13px 13px;padding:10px 11px;font-family:var(--kpe-mono);font-size:11px;line-height:1.55;background:var(--kpe-surface-code);color:var(--kpe-text-muted);resize:vertical;}
            .kpe-scope .kpe-system-prompt__default-textarea:focus{border-color:var(--kpe-border-strong);box-shadow:var(--kpe-focus-ring);}
            .kpe-scope .kpe-system-prompt__default-textarea:read-only{cursor:text;}
            @media (max-width:600px){
                .kpe-modal-backdrop{padding:12px;}
                .kpe-modal{width:100%;height:min(680px,calc(100vh - 24px));height:min(680px,calc(100dvh - 24px));max-height:min(680px,calc(100vh - 24px));max-height:min(680px,calc(100dvh - 24px));}
            }
            .kpe-scope .kpe-modal .kpe-panel__footer{justify-content:flex-end;gap:8px;}
            .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn:first-child{margin-right:auto;}
            .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn--primary{color:#fff;background:var(--kpe-accent);border-color:var(--kpe-accent);}
            .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn--primary:hover:not([disabled]){color:#fff;background:#3d5ce6;border-color:#3d5ce6;}
            .kpe-scope .kpe-modal .kpe-panel__footer .kpe-btn--primary .kpe-ico{color:inherit;}
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
    }

