// ===== src/tests/workspace-ui-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../workspace/', import.meta.url);
const uiSource = await readFile(new URL('workspace-ui.js', root), 'utf8');
const markupMatch = uiSource.match(/const MARKUP = ("(?:\\.|[^"\\])*");/);
const markup = markupMatch ? JSON.parse(markupMatch[1]) : '';
const stylesSource = await readFile(new URL('workspace-styles.js', root), 'utf8');
const settingsSource = await readFile(new URL('../settings-modal.js', import.meta.url), 'utf8');
const explorerSource = await readFile(new URL('workspace-explorer-view.js', root), 'utf8');
const controllerSource = await readFile(new URL('workspace-controller.js', root), 'utf8');
const resolverSource = await readFile(new URL('context-resolver.js', root), 'utf8');
const manifest = JSON.parse(await readFile(new URL('../../manifest.json', import.meta.url), 'utf8'));

test('WorkspaceUI implementa o workspace e preserva o contrato público', () => {
    assert.doesNotThrow(() => new Function(uiSource));
    assert.match(uiSource, /const WorkspaceUI = /);
    assert.match(uiSource, /function render\(container,\s*options\s*=\s*\{\}\)/);
    const module = manifest.modules.find(item => item.file === 'workspace/workspace-ui.js');
    assert.ok(module);
    assert.ok(module.interfaces.provides.includes('WorkspaceUI'));
    assert.ok(module.interfaces.consumes.includes('WorkspaceStyles'));
});

test('implementa as três áreas do workspace e mantém o Inspector contextual fora da Activity Bar', () => {
    assert.doesNotThrow(() => new Function(uiSource));
    for (const view of ['files', 'ai', 'settings']) {
        assert.ok(markup.includes('data-view-panel="' + view + '"'), view);
        assert.ok(markup.includes('data-view="' + view + '"'), view);
    }
    assert.ok(markup.includes('data-inspector'));
    assert.match(uiSource, /toggleInspector/);
    assert.ok(!markup.includes('data-view="inspector"'));
    assert.match(uiSource, /is-explorer-collapsed/);
    assert.match(uiSource, /is-focus-mode/);
    assert.match(uiSource, /is-page-view/);
    assert.match(uiSource, /has-inspector/);
});

test('stylesheet permanece isolado do shell externo', () => {
    assert.doesNotThrow(() => new Function(stylesSource));
    assert.match(stylesSource, /\.pe-workspace-host/);
    assert.match(stylesSource, /\.pe-workspace-host \[hidden\]/);
    assert.match(stylesSource, /pe-workspace-styles/);
    assert.match(stylesSource, /\.pe-workspace-host \.pe-activity-bar/);
    assert.match(stylesSource, /\.pe-workspace-host \.pe-inspector/);
    assert.doesNotMatch(stylesSource, /\.pe-workspace-host \.pe-modal-backdrop/);
});

test('cabeçalho do Workspace reutiliza o botão X e o ícone compartilhado do modal', () => {
    assert.doesNotMatch(markup, /data-action="close-workspace"|class="pe-panel__close"/);
    assert.match(uiSource, /closeBtn\.className\s*=\s*'pe-panel__close'/);
    assert.match(uiSource, /closeBtn\.setAttribute\('aria-label',\s*I18n\.t\('sm\.footer\.closeAria'\)\)/);
    assert.match(uiSource, /closeBtn\.appendChild\(Atoms\.icon\('x'\)\)/);
    assert.match(uiSource, /closeBtn\.addEventListener\('click',\s*\(\)\s*=>options\.onClose\?\.\(\)\)/);
    assert.doesNotMatch(uiSource, /Theme\.cycle|updateThemeIcon|data-action="theme"/);
    assert.match(settingsSource, /onClose:\s*close/);
    const module = manifest.modules.find(item => item.file === 'workspace/workspace-ui.js');
    assert.ok(module.interfaces.consumes.includes('Atoms'));
    assert.ok(module.interfaces.consumes.includes('I18n'));
});

test('modal continua responsável pela navegação Projects Main → Workspace no mesmo shell', () => {
    assert.match(settingsSource, /function renderWorkspace\(\)\s*\{[\s\S]*ProjectsMain\.render\(bodyEl/);
    assert.match(settingsSource, /WorkspaceUI\.render\(bodyEl,\s*\{\s*projectId,/);
    const module = manifest.modules.find(item => item.file === 'settings-modal.js');
    assert.ok(module.interfaces.consumes.includes('WorkspaceUI'));
});

test('UI usa as fachadas públicas para projetos, arquivos, pastas e permissões', () => {
    assert.doesNotMatch(uiSource, /WorkspaceStorage|ProjectManager|FileRegistry|indexedDB/);
    for (const api of [
        'Workspace.projects.get(', 'Workspace.projects.update(',
        'Workspace.files.list(', 'Workspace.files.get(', 'Workspace.files.create(',
        'Workspace.files.update(', 'Workspace.files.remove(', 'Workspace.files.setAccessMany(',
        'Workspace.folders.list(', 'Workspace.folders.create(', 'Workspace.folders.rename(',
        'Workspace.folders.remove('
    ]) assert.ok(uiSource.includes(api), 'API pública ausente: ' + api);
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
    assert.ok(markup.includes('data-search'));
});

test('arquivos e pastas usam operações reais, inclusive diretórios vazios e importação no destino selecionado', () => {
    assert.match(uiSource, /Workspace\.folders\.create/);
    assert.match(uiSource, /Workspace\.folders\.rename/);
    assert.match(uiSource, /Workspace\.folders\.remove/);
    assert.match(controllerSource, /Workspace\.folders\.create/);
    assert.match(controllerSource, /resolveTargetPath/);
    assert.match(controllerSource, /Workspace\.files\.createMany/);
    assert.match(controllerSource, /new TextDecoder\('utf-8', \{ fatal: true \}\)/);
    assert.match(controllerSource, /Workspace\.files\.validate\(\{ path, content \}\)/);
    assert.match(controllerSource, /incoming\.size > MAX_FILE_BYTES/);
});

test('Acesso à IA usa catálogo e credenciais reais, sem provedores ou chaves demonstrativas fixas', () => {
    assert.match(uiSource, /ProviderRegistry\.hydrate\(\)/);
    assert.match(uiSource, /ProviderRegistry\.groupByProvider\(\)/);
    assert.match(uiSource, /ProviderManager\.pin\(entry\)/);
    assert.match(uiSource, /ProviderManager\.update\(active\?\.id,\s*\{apiKey:/);
    assert.ok(markup.includes('password'));
    assert.match(uiSource, /Workspace\.files\.setAccessMany/);
    assert.match(uiSource, /aiProviderModelId/);
    assert.doesNotMatch(uiSource, /AIzaSyExample|sk-proj-example|Anthropic Claude 3/);
});

test('configurações do projeto persistem defaultView, instruções e JSON validado', () => {
    assert.match(uiSource, /defaultView/);
    assert.match(uiSource, /WorkspaceModel\.normalizeConfig/);
    assert.match(uiSource, /configText/);
    assert.match(uiSource, /Workspace\.projects\.update/);
    assert.match(resolverSource, /matchesAnyPattern\(file\.path, patterns\)/);
    assert.match(resolverSource, /configuredBudget/);
});

test('proteção de alterações pendentes cobre arquivos, Acesso à IA e Configurações', () => {
    assert.match(uiSource, /const hasPending=/);
    assert.match(uiSource, /function canLeave\(\)/);
    assert.match(uiSource, /function saveAndContinue\(\)/);
    assert.match(uiSource, /function discardAndContinue\(\)/);
    assert.match(uiSource, /function confirmDelete\(\)/);
    assert.match(uiSource, /function saveFile\(id\)/);
    assert.match(uiSource, /function discardFile\(id\)/);
});

test('Status Bar, Inspector e feedback refletem estado real do Workspace', () => {
    for (const marker of ['data-status-files', 'data-status-size', 'data-status-selection', 'data-status-pending']) {
        assert.ok(markup.includes(marker), marker);
    }
    assert.match(uiSource, /effective\(node\.id\)/);
    assert.match(uiSource, /nodeSize\(node\)/);
    assert.match(uiSource, /function toast\(/);
    assert.match(uiSource, /function updateStatus\(/);
});

test('workspace e módulos de domínio estão registrados na ordem de dependência', () => {
    const files = manifest.modules.map(item => item.file);
    const index = file => files.indexOf(file);
    assert.ok(index('workspace/folder-registry.js') < index('workspace/workspace.js'));
    assert.ok(index('workspace/workspace-styles.js') < index('workspace/workspace-ui.js'));
    const ui = manifest.modules.find(item => item.file === 'workspace/workspace-ui.js');
    for (const dependency of ['WorkspaceStyles', 'Workspace', 'WorkspaceController', 'WorkspaceExplorerView', 'ProviderRegistry', 'ProviderManager']) {
        assert.ok(ui.interfaces.consumes.includes(dependency), dependency);
    }
});



test('rodapé compartilhado coordena salvar/descartar e preserva pendências em falhas', () => {
    assert.match(settingsSource, /function renderWorkspaceFooter\(state = null\)/);
    assert.match(settingsSource, /function renderWorkspaceFooter\(state = null\)\s*\{\s*footerEl\.hidden = false;/);
    assert.match(settingsSource, /session\.savePending\?\.\(\)/);
    assert.match(settingsSource, /session\.discardPending\?\.\(\)/);
    assert.match(settingsSource, /if \(state\?\.hasPending\)/);
    assert.match(uiSource, /async function savePendingChanges\(\)/);
    assert.match(uiSource, /if\(!fileOk\|\|!aiOk\|\|!settingsOk\)/);
    assert.match(uiSource, /function discardPendingChanges\(\)/);
    assert.match(uiSource, /Não foi possível concluir o salvamento/);
});

test('callbacks do Workspace não atualizam o rodapé de outro projeto ou sessão', () => {
    assert.match(settingsSource, /let workspaceOpenSequence = 0/);
    assert.match(settingsSource, /openSequence !== workspaceOpenSequence/);
    assert.match(settingsSource, /activeWorkspaceId === projectId && workspaceSessions\.get\(projectId\) === session/);
    assert.match(settingsSource, /workspaceOpenSequence\+\+/);
});

test('mantém sessões ao retornar à Projects Main e libera recursos ao encerrar o modal', () => {
    assert.match(settingsSource, /workspaceSessions\.get\(activeWorkspaceId\)/);
    assert.match(settingsSource, /bodyEl\.replaceChildren\(activeSession\.root\)/);
    assert.match(settingsSource, /session\.destroy\?\.\(\)/);
    assert.match(settingsSource, /workspaceSessions\.clear\(\)/);
});
