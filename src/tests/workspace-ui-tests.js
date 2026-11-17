// ===== src/tests/workspace-ui-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../workspace/', import.meta.url);
const uiSource = await readFile(new URL('workspace-ui.js', root), 'utf8');
const mockUiSource = await readFile(new URL('workspace-mock-ui.js', root), 'utf8');
const markupMatch = mockUiSource.match(/const MARKUP = ("(?:\\.|[^"\\])*");/);
const mockMarkup = markupMatch ? JSON.parse(markupMatch[1]) : '';
const mockStylesSource = await readFile(new URL('workspace-mock-styles.js', root), 'utf8');
const settingsSource = await readFile(new URL('../settings-modal.js', import.meta.url), 'utf8');
const explorerSource = await readFile(new URL('workspace-explorer-view.js', root), 'utf8');
const controllerSource = await readFile(new URL('workspace-controller.js', root), 'utf8');
const resolverSource = await readFile(new URL('context-resolver.js', root), 'utf8');
const manifest = JSON.parse(await readFile(new URL('../../manifest.json', import.meta.url), 'utf8'));

test('WorkspaceUI preserva o contrato público e delega ao workspace mock-backed', () => {
    assert.doesNotThrow(() => new Function(uiSource));
    assert.match(uiSource, /WorkspaceMockUI\.render\(container, options\)/);
    const module = manifest.modules.find(item => item.file === 'workspace/workspace-ui.js');
    assert.ok(module);
    assert.ok(module.interfaces.provides.includes('WorkspaceUI'));
    assert.ok(module.interfaces.consumes.includes('WorkspaceMockUI'));
});

test('implementa as três áreas do mock e mantém o Inspector contextual fora da Activity Bar', () => {
    assert.doesNotThrow(() => new Function(mockUiSource));
    for (const view of ['files', 'ai', 'settings']) {
        assert.ok(mockMarkup.includes('data-view-panel="' + view + '"'), view);
        assert.ok(mockMarkup.includes('data-view="' + view + '"'), view);
    }
    assert.ok(mockMarkup.includes('data-inspector'));
    assert.match(mockUiSource, /toggleInspector/);
    assert.ok(!mockMarkup.includes('data-view="inspector"'));
    assert.match(mockUiSource, /is-explorer-collapsed/);
    assert.match(mockUiSource, /is-focus-mode/);
    assert.match(mockUiSource, /is-page-view/);
    assert.match(mockUiSource, /has-inspector/);
});

test('stylesheet é portado do mock e permanece isolado do shell externo', () => {
    assert.doesNotThrow(() => new Function(mockStylesSource));
    assert.match(mockStylesSource, /\.pe-workspace-host/);
    assert.match(mockStylesSource, /\.pe-workspace-host \[hidden\]/);
    assert.match(mockStylesSource, /pe-workspace-mock-styles/);
    assert.match(mockStylesSource, /\.pe-workspace-host \.pe-activity-bar/);
    assert.match(mockStylesSource, /\.pe-workspace-host \.pe-inspector/);
    assert.doesNotMatch(mockStylesSource, /\.pe-workspace-host \.pe-modal-backdrop/);
});

test('modal continua responsável pela navegação Projects Main → Workspace no mesmo shell', () => {
    assert.match(settingsSource, /function renderWorkspace\(\)\s*\{[\s\S]*ProjectsMain\.render\(bodyEl/);
    assert.match(settingsSource, /WorkspaceUI\.render\(bodyEl,\s*\{\s*projectId,/);
    const module = manifest.modules.find(item => item.file === 'settings-modal.js');
    assert.ok(module.interfaces.consumes.includes('WorkspaceUI'));
});

test('UI usa as fachadas públicas para projetos, arquivos, pastas e permissões', () => {
    assert.doesNotMatch(mockUiSource, /WorkspaceStorage|ProjectManager|FileRegistry|indexedDB/);
    for (const api of [
        'Workspace.projects.get(', 'Workspace.projects.update(',
        'Workspace.files.list(', 'Workspace.files.get(', 'Workspace.files.create(',
        'Workspace.files.update(', 'Workspace.files.remove(', 'Workspace.files.setAccessMany(',
        'Workspace.folders.list(', 'Workspace.folders.create(', 'Workspace.folders.rename(',
        'Workspace.folders.remove('
    ]) assert.ok(mockUiSource.includes(api), 'API pública ausente: ' + api);
});

test('Explorer implementa busca, hierarquia, virtualização, teclado e renomeação inline', () => {
    assert.match(explorerSource, /WorkspaceTreeModel\.buildIndex\(state\.files, state\.folders\)/);
    assert.match(explorerSource, /VIRTUALIZATION_THRESHOLD/);
    assert.match(explorerSource, /OVERSCAN/);
    assert.match(explorerSource, /ArrowDown/);
    assert.match(explorerSource, /ArrowUp/);
    assert.match(explorerSource, /ArrowRight/);
    assert.match(explorerSource, /ArrowLeft/);
    assert.match(explorerSource, /onStartRename/);
    assert.match(explorerSource, /onCommitRename/);
    assert.match(explorerSource, /onDelete/);
    assert.ok(mockMarkup.includes('data-search'));
});

test('arquivos e pastas usam operações reais, inclusive diretórios vazios e importação no destino selecionado', () => {
    assert.match(mockUiSource, /Workspace\.folders\.create/);
    assert.match(mockUiSource, /Workspace\.folders\.rename/);
    assert.match(mockUiSource, /Workspace\.folders\.remove/);
    assert.match(controllerSource, /Workspace\.folders\.create/);
    assert.match(controllerSource, /resolveTargetPath/);
    assert.match(controllerSource, /Workspace\.files\.createMany/);
    assert.match(controllerSource, /new TextDecoder\('utf-8', \{ fatal: true \}\)/);
    assert.match(controllerSource, /Workspace\.files\.validate\(\{ path, content \}\)/);
    assert.match(controllerSource, /incoming\.size > MAX_FILE_BYTES/);
});

test('Acesso à IA usa catálogo e credenciais reais, sem provedores ou chaves demonstrativas fixas', () => {
    assert.match(mockUiSource, /ProviderRegistry\.hydrate\(\)/);
    assert.match(mockUiSource, /ProviderRegistry\.groupByProvider\(\)/);
    assert.match(mockUiSource, /ProviderManager\.pin\(entry\)/);
    assert.match(mockUiSource, /ProviderManager\.update\(active\?\.id,\s*\{apiKey:/);
    assert.ok(mockMarkup.includes('password'));
    assert.match(mockUiSource, /Workspace\.files\.setAccessMany/);
    assert.match(mockUiSource, /aiProviderModelId/);
    assert.doesNotMatch(mockUiSource, /AIzaSyExample|sk-proj-example|Anthropic Claude 3/);
});

test('configurações do projeto persistem defaultView, instruções e JSON validado', () => {
    assert.match(mockUiSource, /defaultView/);
    assert.match(mockUiSource, /WorkspaceModel\.normalizeConfig/);
    assert.match(mockUiSource, /configText/);
    assert.match(mockUiSource, /Workspace\.projects\.update/);
    assert.match(resolverSource, /matchesAnyPattern\(file\.path, patterns\)/);
    assert.match(resolverSource, /configuredBudget/);
});

test('proteção de alterações pendentes cobre arquivos, Acesso à IA e Configurações', () => {
    assert.match(mockUiSource, /const hasPending=/);
    assert.match(mockUiSource, /function canLeave\(\)/);
    assert.match(mockUiSource, /function saveAndContinue\(\)/);
    assert.match(mockUiSource, /function discardAndContinue\(\)/);
    assert.match(mockUiSource, /function confirmDelete\(\)/);
    assert.match(mockUiSource, /function saveFile\(id\)/);
    assert.match(mockUiSource, /function discardFile\(id\)/);
});

test('Status Bar, Inspector e feedback refletem estado real do Workspace', () => {
    for (const marker of ['data-status-files', 'data-status-size', 'data-status-selection', 'data-status-pending']) {
        assert.ok(mockMarkup.includes(marker), marker);
    }
    assert.match(mockUiSource, /effective\(node\.id\)/);
    assert.match(mockUiSource, /nodeSize\(node\)/);
    assert.match(mockUiSource, /function toast\(/);
    assert.match(mockUiSource, /function updateStatus\(/);
});

test('mock e módulos de domínio estão registrados na ordem de dependência', () => {
    const files = manifest.modules.map(item => item.file);
    const index = file => files.indexOf(file);
    assert.ok(index('workspace/folder-registry.js') < index('workspace/workspace.js'));
    assert.ok(index('workspace/workspace-mock-styles.js') < index('workspace/workspace-mock-ui.js'));
    assert.ok(index('workspace/workspace-mock-ui.js') < index('workspace/workspace-ui.js'));
    const mock = manifest.modules.find(item => item.file === 'workspace/workspace-mock-ui.js');
    for (const dependency of ['WorkspaceMockStyles', 'Workspace', 'WorkspaceController', 'WorkspaceExplorerView', 'ProviderRegistry', 'ProviderManager']) {
        assert.ok(mock.interfaces.consumes.includes(dependency), dependency);
    }
});


test('mantém sessões ao retornar à Projects Main e libera recursos ao encerrar o modal', () => {
    assert.match(settingsSource, /workspaceSessions\.get\(activeWorkspaceId\)/);
    assert.match(settingsSource, /bodyEl\.replaceChildren\(activeSession\.root\)/);
    assert.match(settingsSource, /session\.destroy\?\.\(\)/);
    assert.match(settingsSource, /workspaceSessions\.clear\(\)/);
});
