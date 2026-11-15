// ===== src/tests/workspace-ui-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const uiSource = await readFile(new URL('../workspace/workspace-ui.js', import.meta.url), 'utf8');
const settingsSource = await readFile(new URL('../settings-modal.js', import.meta.url), 'utf8');
const explorerSource = await readFile(new URL('../workspace/workspace-explorer-view.js', import.meta.url), 'utf8');
const controllerSource = await readFile(new URL('../workspace/workspace-controller.js', import.meta.url), 'utf8');
const manifest = JSON.parse(await readFile(new URL('../../manifest.json', import.meta.url), 'utf8'));
const i18n = await readFile(new URL('../i18n.js', import.meta.url), 'utf8');

test('Workspace UI possui sintaxe válida e é registrado como módulo de produção', () => {
    assert.doesNotThrow(() => new Function(uiSource));
    const module = manifest.modules.find(item => item.file === 'workspace/workspace-ui.js');
    assert.ok(module);
    assert.ok(module.interfaces.provides.includes('WorkspaceUI'));
    assert.ok(module.interfaces.consumes.includes('Workspace'));
    assert.ok(module.interfaces.consumes.includes('Atoms'));
    for (const dependency of ['WorkspaceController', 'WorkspaceExplorerView', 'WorkspaceEditorView', 'WorkspaceInspectorView', 'WorkspacePanelLayout']) {
        assert.ok(module.interfaces.consumes.includes(dependency), dependency + ' deve estar declarado no manifest');
    }
});

test('Workspace UI mantém Overview e Files como navegação principal e move detalhes para o inspector', () => {
    for (const [view, variable] of [
        ['overview', 'overviewView'],
        ['files', 'filesView']
    ]) assert.ok(uiSource.includes(variable + ".dataset.viewPanel = '" + view + "'"));
    assert.match(uiSource, /function setActiveView\(key\)/);
    assert.match(uiSource, /aria-selected/);
    assert.ok(uiSource.includes('WorkspaceInspectorView.create'));
    assert.ok(uiSource.includes('sections: [accessView, projectSettings]'));
    assert.match(uiSource, /function updateOverview\(\)/);
    assert.doesNotMatch(uiSource, /workspaceLayout\.hidden/);
});

test('aba Workspace monta o gerenciador dedicado', () => {
    assert.match(settingsSource, /function renderWorkspace\(\)\s*\{\s*WorkspaceUI\.render\(bodyEl\);/);
    const settingsModule = manifest.modules.find(item => item.file === 'settings-modal.js');
    assert.ok(settingsModule.interfaces.consumes.includes('WorkspaceUI'));
});

test('UI usa somente a fachada pública Workspace para operações de dados', () => {
    assert.doesNotMatch(uiSource, /WorkspaceStorage|ProjectManager|FileRegistry|indexedDB/);
    for (const api of [
        'Workspace.projects.list()',
        'Workspace.projects.get(',
        'Workspace.projects.create(',
        'Workspace.projects.update(',
        'Workspace.projects.remove(',
        'Workspace.files.list(',
        'Workspace.files.get(',
        'Workspace.files.create(',
        'Workspace.files.update(',
        'Workspace.files.setAccess(',
        'Workspace.files.remove('
    ]) assert.ok(uiSource.includes(api), 'API pública ausente: ' + api);
});

test('UI mantém proteção de rascunhos e confirma operações destrutivas', () => {
    assert.ok(uiSource.includes('function fileDirty()'));
    assert.ok(uiSource.includes('function projectDirty()'));
    assert.ok(uiSource.includes('function confirmLeave()'));
    assert.ok(uiSource.includes('ws.project.deleteMessage'));
    assert.ok(uiSource.includes('ws.files.deleteMessage'));
    assert.ok(uiSource.includes('ws.dirty.discard'));
    assert.ok(uiSource.includes('ws.dirty.cancel'));
});

test('importação limita conteúdo a texto UTF-8 e valida caminhos e limites no Workspace', () => {
    assert.ok(uiSource.includes('WorkspaceController.importFiles('));
    assert.ok(controllerSource.includes("new TextDecoder('utf-8', { fatal: true })"));
    assert.ok(controllerSource.includes('Workspace.files.validate({ path, content })'));
    assert.ok(controllerSource.includes('incoming.size > MAX_FILE_BYTES'));
    assert.ok(controllerSource.includes('ws.errors.textOnly'));
});

test('permissão visual reflete o modo efetivo do projeto', () => {
    assert.ok(explorerSource.includes("mode === 'all' || (mode === 'selected' && row.file.aiAccess === 'allowed')"));
    assert.ok(uiSource.includes('ws.access.overriddenNone'));
    assert.ok(uiSource.includes('ws.access.overriddenAll'));
    assert.ok(uiSource.includes("effectiveMode !== 'selected'"));
});

test('novas mensagens do Workspace existem em PT-BR e EN', () => {
    const keys = [...new Set([...uiSource.matchAll(/I18n\.t\('([^']+)'/g)].map(match => match[1]))];
    for (const key of keys.filter(value => value.startsWith('ws.'))) {
        assert.equal(i18n.split('"' + key + '":').length - 1, 2, key + ' deve existir nos dois idiomas');
    }
    for (const key of [
        'ws.navigation.label', 'ws.nav.overview', 'ws.nav.files', 'ws.nav.access', 'ws.nav.settings',
        'ws.overview.title', 'ws.overview.files', 'ws.overview.storage', 'ws.overview.aiAccess',
        'ws.overview.noProject', 'ws.overview.noDescription', 'ws.access.description', 'ws.access.noFile'
    ]) {
        assert.equal(i18n.split('"' + key + '":').length - 1, 2, key + ' deve existir nos dois idiomas');
    }
    for (const key of ['ws.project.name', 'ws.project.description', 'ws.access.projectMode', 'ws.project.instructions', 'ws.editor.path', 'ws.access.filePermission']) {
        assert.equal(i18n.split('"' + key + '":').length - 1, 2, key + ' deve existir nos dois idiomas');
    }
});
