// ===== src/tests/settings-tabs-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const settings = await readFile(new URL('../settings-modal.js', import.meta.url), 'utf8');
const i18n = await readFile(new URL('../i18n.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../styles.js', import.meta.url), 'utf8');

test('separa as quatro responsabilidades da antiga aba Context & Language', () => {
    const renderers = {
        workspace: 'renderWorkspace',
        manualContext: 'renderManualContext',
        response: 'renderResponse',
        interface: 'renderInterface'
    };
    for (const [key, renderer] of Object.entries(renderers)) {
        assert.ok(settings.includes("key: '" + key + "'"));
        assert.ok(settings.includes("activeTab === '" + key + "'"));
        assert.ok(settings.includes('function ' + renderer + '()'));
    }
    assert.equal(settings.includes('function renderContext()'), false);
});

test('mantém compatibilidade com a chave legada context', () => {
    assert.ok(settings.includes("initialTab === 'context' ? 'manualContext' : initialTab"));
});

test('aba Workspace delega o gerenciamento à view dedicada', () => {
    const start = settings.indexOf('function renderWorkspace()');
    const end = settings.indexOf('function renderManualContext()', start);
    const view = settings.slice(start, end);
    assert.ok(view.includes('ProjectsMain.render(bodyEl'));
    assert.ok(settings.includes('WorkspaceUI.render(bodyEl, {'));
    assert.equal(view.includes('Workspace.projects.create('), false);
});

test('mantém o gerenciador ProjectContext separado do Workspace', () => {
    const start = settings.indexOf('function renderManualContext()');
    const end = settings.indexOf('function renderInterface()', start);
    const view = settings.slice(start, end);
    assert.ok(view.includes('ProjectContext.list()'));
    assert.ok(view.includes('actionbar?.contextBtn'));
});

test('mantém as alterações de resposta ligadas ao dirty state correto', () => {
    const start = settings.indexOf('function renderResponse()');
    const end = settings.indexOf('function renderSystemPrompt()', start);
    const view = settings.slice(start, end);
    assert.ok(view.includes("syncFooter('response')"));
    assert.ok(view.includes("renderFooter('response', computeDirty('response')"));
    assert.ok(settings.includes("if (tab === 'response')"));
});

test('mantém o fechamento principal no cabeçalho e oculta o rodapé sem alterações pendentes', () => {
    const footerStart = settings.indexOf('function renderFooter(tab, dirty, saving)');
    const footerEnd = settings.indexOf('function render()', footerStart);
    const footer = settings.slice(footerStart, footerEnd);
    assert.ok(footer.includes('footerEl.hidden = !editing || !dirty'));
    assert.equal(footer.includes('sm.footer.close'), false);
    assert.ok(settings.includes("closeBtn.addEventListener('click', close)"));
});

test('fornece labels, títulos e descrições nos dois idiomas', () => {
    for (const key of ['workspace', 'manualContext', 'response', 'interface']) {
        for (const field of ['label', 'title', 'desc']) {
            const translationKey = '"sm.tab.' + key + '.' + field + '":';
            assert.equal(i18n.split(translationKey).length - 1, 2, key + '.' + field + ' deve existir em PT-BR e EN');
        }
    }
});


test('usa navegação horizontal compacta com label somente na aba ativa', () => {
    assert.ok(settings.includes("b.title = t.label"));
    assert.ok(settings.includes("panel.classList.toggle('is-projects-main', workspaceRoute)"));
    assert.ok(settings.includes("panel.classList.toggle('is-workspace-expanded', workspaceRoute && activeWorkspaceId !== null)"));
    assert.ok(settings.includes("b.classList.toggle('is-active', selected)"));
    assert.ok(styles.includes('.pe-modal-layout {'));
    assert.ok(styles.includes('flex-direction: column;'));
    assert.ok(styles.includes('flex: 0 0 44px;'));
    assert.ok(styles.includes('.pe-scope .pe-modal .pe-modal-tab.is-active .pe-modal-tab__label'));
});

test('expande o modal no Workspace e preserva dimensões compactas nas demais seções', () => {
    assert.ok(styles.includes('width: min(920px, 100%);'));
    assert.ok(styles.includes('width: min(1280px, calc(100vw - 48px));'));
    assert.ok(styles.includes('.pe-scope .pe-modal.is-workspace-expanded'));
    assert.ok(styles.includes('width: 100%;\n                height: calc(100dvh - 20px);'));
    assert.ok(styles.includes('transition: width 300ms'));
});

test('mantém a transição de largura e altura entre Configurações e Workspace', () => {
    const modalStart = styles.indexOf('.pe-scope .pe-modal {');
    const workspaceStart = styles.indexOf('.pe-scope .pe-modal.is-workspace-expanded {', modalStart);
    const modalCss = styles.slice(modalStart, workspaceStart);
    assert.match(modalCss, /width:\s*min\(920px,\s*100%\)/);
    assert.match(modalCss, /height:\s*min\(760px,/);
    assert.match(modalCss, /transition:[^;]*width\s+300ms/);
    assert.match(modalCss, /transition:[^;]*height\s+300ms/);
    assert.match(modalCss, /transition:[^;]*max-height\s+300ms/);

    const workspaceEnd = styles.indexOf('.pe-scope .pe-modal.is-workspace-expanded .pe-panel__body', workspaceStart);
    const workspaceCss = styles.slice(workspaceStart, workspaceEnd);
    assert.match(workspaceCss, /width:\s*min\(1280px,/);
    assert.match(workspaceCss, /height:\s*min\(900px,/);
});

test('mantém a expansão limitada ao viewport em telas menores e respeita movimento reduzido', () => {
    const mobileStart = styles.indexOf('@media (max-width: 768px)');
    const mobileEnd = styles.indexOf('@media (max-width: 520px)', mobileStart);
    const mobileCss = styles.slice(mobileStart, mobileEnd);
    assert.match(mobileCss, /\.pe-scope \.pe-modal\.is-workspace-expanded\s*\{[^}]*width:\s*100%/s);
    assert.match(mobileCss, /height:\s*calc\(100dvh\s*-\s*20px\)/);

    const reducedMotion = styles.slice(styles.indexOf('@media (prefers-reduced-motion: reduce)'));
    assert.match(reducedMotion, /transition-duration:\s*0\.01ms\s*!important/);
    assert.match(reducedMotion, /animation-duration:\s*0\.01ms\s*!important/);
});
