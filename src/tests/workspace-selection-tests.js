// ===== src/tests/workspace-selection-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../workspace/workspace.js', import.meta.url), 'utf8');

function createHarness() {
    const projects = new Map([
        ['project_a', { id: 'project_a', name: 'Project A' }],
        ['project_b', { id: 'project_b', name: 'Project B' }]
    ]);
    const values = new Map();
    let openCount = 0;
    const context = vm.createContext({
        WorkspaceStorage: {
            async open() { openCount++; },
            close() {}
        },
        ProjectManager: {
            async get(id) { return projects.get(String(id)) || null; },
            async list() { return [...projects.values()]; },
            async create(input) {
                const project = { id: 'project_new', ...input };
                projects.set(project.id, project);
                return project;
            },
            async update() {},
            async remove() {}
        },
        FileRegistry: { list() {}, get() {}, create() {}, update() {}, remove() {}, validateTextFile() {} },
        GM_getValue(key, fallback) { return values.has(key) ? values.get(key) : fallback; },
        GM_setValue(key, value) { values.set(key, value); }
    });
    vm.runInContext(source, context, { filename: 'workspace.js' });
    return { workspace: vm.runInContext('Workspace', context), values, getOpenCount: () => openCount };
}

test('inicializa uma única vez mesmo com chamadas concorrentes', async () => {
    const { workspace, getOpenCount } = createHarness();
    await Promise.all([workspace.init(), workspace.init(), workspace.init()]);
    assert.equal(getOpenCount(), 1);
    await workspace.init();
    assert.equal(getOpenCount(), 1);
});

test('persiste a seleção ativa e permite limpar a seleção', async () => {
    const { workspace, values } = createHarness();
    await workspace.init();
    assert.equal(workspace.getActiveProjectId(), null);
    await workspace.setActiveProjectId('project_a');
    assert.equal(workspace.getActiveProjectId(), 'project_a');
    assert.equal(values.get('pe_workspace_active_project'), 'project_a');
    await workspace.setActiveProjectId(null);
    assert.equal(workspace.getActiveProjectId(), null);
});

test('não permite selecionar um projeto inexistente', async () => {
    const { workspace } = createHarness();
    await workspace.init();
    await assert.rejects(workspace.setActiveProjectId('missing'), /não existe mais/);
    assert.equal(workspace.getActiveProjectId(), null);
});

test('exige inicialização antes de alterar a seleção', async () => {
    const { workspace } = createHarness();
    await assert.rejects(workspace.setActiveProjectId('project_a'), /não foi inicializado/);
});