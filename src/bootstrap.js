// ===== src/bootstrap.js =====
    function init() {
        Workspace.init().catch(error => console.error('[PE Workspace] Falha ao inicializar:', error));
        Theme.apply();
        injectStyles();
        HostShield.install();
        migrateLegacy();
        migrateHistoryRuns();
        EnhancementHistory.reconcilePending();
        State.params = ParamSchema.load();
        observe();
        document.addEventListener('focusin', onFocusIn, true);
        document.addEventListener('keydown', onKeydown, true);

        // Re-aplica o tema após um atraso para permitir que o site defina seu próprio tema primeiro.
        setTimeout(() => Theme.apply(), 150);

        // Observa mudanças no tema do site host (classe/atributo dark/light) e re-aplica.
        let disconnectThemeObserver = null;
        try {
            disconnectThemeObserver = Theme.observe(() => Theme.apply());
        } catch (_) {}

        let menuIds = [];
        function registerMenus() {
            if (typeof GM_registerMenuCommand !== 'function') return;
            if (Array.isArray(menuIds) && typeof GM_unregisterMenuCommand === 'function') {
                menuIds.forEach((id) => { try { GM_unregisterMenuCommand(id); } catch (e) {} });
                menuIds = [];
            }
            const reg = (label, cb) => {
                const id = GM_registerMenuCommand(label, cb);
                if (id != null) menuIds.push(id);
                return id;
            };
            reg(I18n.t('bs.menu.about'), () => {
                const files = ProjectContext.list();
                const activeFiles = files.filter(f => f.enabled);
                const total = ProjectContext.getTotalSize();
                const ctx = files.length ? `${activeFiles.length}/${files.length} ${I18n.t('bs.about.activeFiles')} · ${Utils.formatBytes(total)} / ${Utils.formatBytes(CONFIG.MAX_CONTEXT_TOTAL_SIZE)} (${ProjectContext.isEnabled() ? 'ON' : 'OFF'})` : I18n.t('bs.about.noFiles');
                const histCount = EnhancementHistory.listRuns().length;
                const codes = Object.keys(ErrorIndexer.CATALOG).length;
                const n = ErrorIndexer.history().length;
                alert(
                    'Prompt-Enhancer v1.0.1\n\n' +
                    I18n.t('bs.about.contextLabel') + ctx + '\n' +
                    I18n.t('bs.about.detectedProvider') + Providers.detect() + '\n' +
                    I18n.t('bs.about.streaming') + (CONFIG.STREAM ? I18n.t('bs.about.streamActive') : I18n.t('bs.about.streamInactive')) + '\n' +
                    I18n.t('bs.about.errorIndexer', { codes, n }) + '\n' +
                    I18n.t('bs.about.enhancementHistory') + histCount + ' / ' + CONFIG.HISTORY_MAX + '\n' +
                    'GSAP: ' + (Anim.hasGsap ? I18n.t('bs.about.gsapLoaded') : I18n.t('bs.about.gsapUnavailable')) + '\n' +
                    I18n.t('bs.about.reducedMotion') + (Anim.reduced() ? I18n.t('bs.about.streamActive') : I18n.t('bs.about.streamInactive')) + '\n\n' +
                    I18n.t('bs.about.endpoint') + CONFIG.API_URL + '\n' +
                    I18n.t('bs.about.model') + CONFIG.MODEL + '\n' +
                    I18n.t('bs.about.rateLimit') + CONFIG.RATE_LIMIT.max + ' req / ' + (CONFIG.RATE_LIMIT.window / 1000) + 's' + I18n.t('bs.about.perDomain') + '\n' +
                    I18n.t('bs.about.automaticRetry') + CONFIG.RETRY_MAX + I18n.t('bs.about.attemptsBackoff') + (CONFIG.RETRY_BACKOFF_MS / 1000) + 's\n\n' +
                    I18n.t('bs.about.shortcuts')
                );
            });
            reg(I18n.t('bs.menu.settings'), () => {
                if (State.activeComposer) onSettings();
                else alert(I18n.t('bs.focusFirst'));
            });
            reg(I18n.t('bs.menu.clearContext'), () => {
                if (!ProjectContext.list().length) { alert(I18n.t('bs.noContextFiles')); return; }
                if (confirm(I18n.t('bs.confirmRemoveContext'))) { ProjectContext.clearAll(); State.activeComposer?.actionbar.refreshContextBtn(); alert(I18n.t('bs.filesRemoved')); }
            });
            reg(I18n.t('bs.menu.manageContext'), () => {
                if (State.activeComposer) State.activeComposer.actionbar.contextBtn.click();
                else alert(I18n.t('bs.focusFirst'));
            });
            reg(I18n.t('bs.menu.errorHistory'), () => showErrorHistory());
            reg(I18n.t('bs.menu.clearErrors'), () => {
                if (!ErrorIndexer.history().length) { alert(I18n.t('bs.noErrors')); return; }
                if (confirm(I18n.t('bs.confirmClearErrors'))) { ErrorIndexer.clearHistory(); alert(I18n.t('bs.errorHistoryCleared')); }
            });
            reg(I18n.t('bs.menu.clearEnh'), () => {
                if (!EnhancementHistory.listRuns().length) { alert(I18n.t('bs.noEnhancements')); return; }
                if (confirm(I18n.t('bs.confirmClearEnh'))) { EnhancementHistory.clear(); alert(I18n.t('bs.enhHistoryCleared')); }
            });
            reg('Resetar todos os dados (pe_*)', () => {
                if (!confirm(I18n.t('bs.resetAllData.confirm'))) return;
                let cleared = 0;
                try {
                    if (typeof GM_listValues === 'function') {
                        const keys = GM_listValues();
                        for (const key of keys) {
                            if (String(key).startsWith('pe_')) { try { GM_deleteValue(key); cleared++; } catch (_) {} }
                        }
                    }
                } catch (_) {}
                try {
                    const lsKeys = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        if (k) lsKeys.push(k);
                    }
                    lsKeys.filter(k => String(k).startsWith('pe_')).forEach(k => {
                        try { localStorage.removeItem(k); cleared++; } catch (_) {}
                    });
                } catch (_) {}
                try { EnhancementHistory.clear(); } catch (_) {}
                alert(`Dados locais limpos (${cleared} chaves). Recarregando…`);
                location.reload();
            });
            reg(I18n.t('bs.menu.lang'), () => {
                const current = I18n.getLanguage();
                const next = current === 'en' ? 'pt-BR' : 'en';
                I18n.setLanguage(next);
                alert(I18n.t('bs.langChanged'));
            });
            reg(I18n.t('bs.menu.theme'), () => {
                const next = Theme.cycle();
                Molecules.toast(I18n.t('bs.themeChanged', { mode: I18n.t(`param.theme.opt.${next}`) }), 'info');
            });
            reg(I18n.t('bs.menu.refreshCatalog'), () => {
                ProviderRegistry.hydrate(true).then((entries) => {
                    console.info(`[PE] Catálogo hidratado: ${entries.length} entradas (${entries.filter((entry) => entry.source === 'dynamic').length} dinâmicas).`);
                }).catch((err) => console.warn('[PE] Falha na atualização do catálogo:', err));
            });
        }
        if (typeof GM_registerMenuCommand === 'function') {
            registerMenus();
            if (typeof GM_unregisterMenuCommand !== 'function') {
                console.warn('[PE] GM_unregisterMenuCommand unavailable; menus registered once.');
            }
            window.addEventListener('pe:i18n-changed', () => {
                if (typeof GM_unregisterMenuCommand === 'function') registerMenus();
            });
        }

        setTimeout(() => {
            ProviderRegistry.hydrate().then((entries) => {
                console.info(`[PE] Catálogo hidratado: ${entries.length} entradas (${entries.filter((entry) => entry.source === 'dynamic').length} dinâmicas).`);
            }).catch((err) => console.warn('[PE] Falha na hidratação do catálogo:', err));
        }, 100);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
