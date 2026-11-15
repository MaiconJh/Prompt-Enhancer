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
    assert.ok(view.includes('WorkspaceUI.render(bodyEl)'));
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
    assert.ok(settings.includes("panel.classList.toggle('is-workspace-expanded', activeTab === 'workspace')"));
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
