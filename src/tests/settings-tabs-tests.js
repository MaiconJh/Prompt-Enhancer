// ===== src/tests/settings-tabs-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const settings = await readFile(new URL('../settings-modal.js', import.meta.url), 'utf8');
const i18n = await readFile(new URL('../i18n.js', import.meta.url), 'utf8');

test('separa as quatro responsabilidades da antiga aba Context & Language', () => {
    for (const key of ['workspace', 'manualContext', 'response', 'interface']) {
        assert.match(settings, new RegExp("key: '" + key + "'"));
        assert.match(settings, new RegExp("activeTab === '" + key + "'"));
        assert.match(settings, new RegExp('function render' + (key === 'manualContext' ? 'ManualContext' : key[0].toUpperCase() + key.slice(1)) + '\\('));
    }
    assert.doesNotMatch(settings, /function renderContext\\(/);
});

test('mantém compatibilidade com a chave legada context', () => {
    assert.match(settings, /initialTab === 'context' \\? 'manualContext' : initialTab/);
});

test('preserva seleção e criação de projetos na aba Workspace', () => {
    const start = settings.indexOf('function renderWorkspace()');
    const end = settings.indexOf('function renderManualContext()', start);
    const view = settings.slice(start, end);
    assert.match(view, /Workspace\\.projects\\.list\\(\\)/);
    assert.match(view, /Workspace\\.projects\\.create\\(\\{ name \\}\\)/);
    assert.match(view, /Workspace\\.setActiveProjectId\\(/);
});

test('mantém o gerenciador ProjectContext separado do Workspace', () => {
    const start = settings.indexOf('function renderManualContext()');
    const end = settings.indexOf('function renderInterface()', start);
    const view = settings.slice(start, end);
    assert.match(view, /ProjectContext\\.list\\(\\)/);
    assert.match(view, /actionbar\\?\\.contextBtn/);
});

test('mantém as alterações de resposta ligadas ao dirty state correto', () => {
    const start = settings.indexOf('function renderResponse()');
    const end = settings.indexOf('function renderSystemPrompt()', start);
    const view = settings.slice(start, end);
    assert.match(view, /syncFooter\\('response'\\)/);
    assert.match(view, /renderFooter\\('response', computeDirty\\('response'\\)/);
    assert.match(settings, /if \\(tab === 'response'\\)/);
});

test('fornece labels, títulos e descrições nos dois idiomas', () => {
    for (const key of ['workspace', 'manualContext', 'response', 'interface']) {
        for (const field of ['label', 'title', 'desc']) {
            const matches = i18n.match(new RegExp('"sm\\.tab\\.' + key + '\\.' + field + '"\\s*:', 'g')) || [];
            assert.equal(matches.length, 2, key + '.' + field + ' deve existir em PT-BR e EN');
        }
    }
});
