// ===== src/bootstrap.js =====
    function init() {
        injectStyles();
        HostShield.install();
        migrateLegacy();
        migrateHistoryRuns();
        EnhancementHistory.reconcilePending();
        State.params = ParamSchema.load();
        observe();
        document.addEventListener('focusin', onFocusIn, true);
        document.addEventListener('keydown', onKeydown, true);

        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('ℹ️ Sobre o Prompt-Enhancer', () => {
                const files = ProjectContext.list();
                const activeFiles = files.filter(f => f.enabled);
                const total = ProjectContext.getTotalSize();
                const ctx = files.length ? `${activeFiles.length}/${files.length} arquivo(s) ativo(s) · ${Utils.formatBytes(total)} / ${Utils.formatBytes(CONFIG.MAX_CONTEXT_TOTAL_SIZE)} (${ProjectContext.isEnabled() ? 'ON' : 'OFF'})` : 'nenhum arquivo';
                const histCount = EnhancementHistory.listRuns().length;
                alert(
                    'Prompt-Enhancer v1.0.0\n\n' +
                    'Contexto: ' + ctx + '\n' +
                    'Provider detectado: ' + Providers.detect() + '\n' +
                    'Streaming: ' + (CONFIG.STREAM ? 'ativo' : 'inativo') + '\n' +
                    'ErrorIndexer: ' + Object.keys(ErrorIndexer.CATALOG).length + ' códigos · ' + ErrorIndexer.history().length + ' no histórico de erros\n' +
                    'Histórico de aprimoramentos (runs): ' + histCount + ' / ' + CONFIG.HISTORY_MAX + '\n' +
                    'GSAP: ' + (Anim.hasGsap ? 'carregado' : 'indisponível') + '\n' +
                    'Movimento reduzido: ' + (Anim.reduced() ? 'ativo' : 'inativo') + '\n\n' +
                    'Endpoint: ' + CONFIG.API_URL + '\n' +
                    'Modelo: ' + CONFIG.MODEL + '\n' +
                    'Rate limit: ' + CONFIG.RATE_LIMIT.max + ' req / ' + (CONFIG.RATE_LIMIT.window / 1000) + 's por domínio\n' +
                    'Retry automático: ' + CONFIG.RETRY_MAX + ' tentativa(s), backoff ' + (CONFIG.RETRY_BACKOFF_MS / 1000) + 's\n\n' +
                    'Atalhos: Ctrl+Shift+E (aprimorar) · Ctrl+Shift+P (parâmetros) · Ctrl+Shift+S (configurações) · Esc (fechar)'
                );
            });
            GM_registerMenuCommand('⚙️ Configurações', () => {
                if (State.activeComposer) onSettings();
                else alert('Foque um campo de texto primeiro.');
            });
            GM_registerMenuCommand('📄 Limpar arquivos de contexto', () => {
                if (!ProjectContext.list().length) { alert('Nenhum arquivo de contexto carregado.'); return; }
                if (confirm('Remover todos os arquivos de contexto?')) { ProjectContext.clearAll(); State.activeComposer?.actionbar.refreshContextBtn(); alert('Arquivos removidos.'); }
            });
            GM_registerMenuCommand('🧩 Gerenciar contexto', () => {
                if (State.activeComposer) State.activeComposer.actionbar.contextBtn.click();
                else alert('Foque um campo de texto primeiro.');
            });
            GM_registerMenuCommand('📊 Histórico de erros', () => showErrorHistory());
            GM_registerMenuCommand('🧹 Limpar histórico de erros', () => {
                if (!ErrorIndexer.history().length) { alert('Nenhum erro registrado.'); return; }
                if (confirm('Limpar histórico de erros?')) { ErrorIndexer.clearHistory(); alert('Histórico de erros limpo.'); }
            });
            GM_registerMenuCommand('🗑️ Limpar histórico de aprimoramentos', () => {
                if (!EnhancementHistory.listRuns().length) { alert('Nenhum aprimoramento registrado.'); return; }
                if (confirm('Limpar histórico de aprimoramentos?')) { EnhancementHistory.clear(); alert('Histórico de aprimoramentos limpo.'); }
            });
            GM_registerMenuCommand('🔄 Atualizar catálogo de provedores', () => {
                ProviderRegistry.hydrate(true).then((entries) => {
                    console.info(`[KPE] Catálogo hidratado: ${entries.length} entradas (${entries.filter((entry) => entry.source === 'dynamic').length} dinâmicas).`);
                }).catch((err) => console.warn('[KPE] Falha na atualização do catálogo:', err));
            });
        }

        setTimeout(() => {
            ProviderRegistry.hydrate().then((entries) => {
                console.info(`[KPE] Catálogo hidratado: ${entries.length} entradas (${entries.filter((entry) => entry.source === 'dynamic').length} dinâmicas).`);
            }).catch((err) => console.warn('[KPE] Falha na hidratação do catálogo:', err));
        }, 100);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
