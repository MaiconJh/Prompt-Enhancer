// ===== src/tests/workspace-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourceDir = new URL('../workspace/', import.meta.url);
const modelSource = await readFile(new URL('workspace-model.js', sourceDir), 'utf8');
const registrySource = await readFile(new URL('file-registry.js', sourceDir), 'utf8');
const facadeSource = await readFile(new URL('workspace.js', sourceDir), 'utf8');

function createHarness() {
    const projects = new Map([
        ['project_a', { id: 'project_a', name: 'Project A', updatedAt: 1 }],
        ['project_b', { id: 'project_b', name: 'Project B', updatedAt: 1 }]
    ]);
    const files = new Map();
    let idCounter = 0;
    const context = vm.createContext({
        TextEncoder,
        crypto: { randomUUID: () => `test-id-${++idCounter}` },
        WorkspaceStorage: {
            async open() {},
            close() {},
            async getProject(id) { return projects.get(id) || null; },
            async listFiles(projectId) { return [...files.values()].filter(file => file.projectId === projectId); },
            async getFile(id) { return files.get(id) || null; },
            async saveFile(file, options = {}) {
                const siblings = [...files.values()].filter(item => item.projectId === file.projectId);
                const current = siblings.find(item => item.id === file.id) || null;
                if (options.mode === 'create' && current) throw Object.assign(new Error('duplicate id'), { code: 'file-exists' });
                if (options.mode === 'update' && !current) throw Object.assign(new Error('file missing'), { code: 'file-not-found' });
                if (siblings.some(item => item.id !== file.id && item.path === file.path)) {
                    const error = new Error('duplicate path');
                    error.code = 'file-exists';
                    throw error;
                }
                if (!current && siblings.length >= options.maxFiles) throw new Error('file limit');
                const total = siblings.reduce((sum, item) => sum + item.size, 0) - (current?.size || 0) + file.size;
                if (total > options.maxBytes) throw new Error('size limit');
                files.set(file.id, file);
                projects.set(file.projectId, { ...projects.get(file.projectId), updatedAt: Date.now() });
            },
            async saveFiles(batch, options = {}) {
                const projectId = batch[0]?.projectId;
                const siblings = [...files.values()].filter(item => item.projectId === projectId);
                const paths = new Set(siblings.map(item => item.path));
                const ids = new Set(siblings.map(item => item.id));
                const incomingPaths = new Set();
                const incomingIds = new Set();
                for (const file of batch) {
                    if (ids.has(file.id) || incomingIds.has(file.id) || paths.has(file.path) || incomingPaths.has(file.path)) {
                        throw Object.assign(new Error('duplicate file'), { code: 'file-exists' });
                    }
                    incomingIds.add(file.id);
                    incomingPaths.add(file.path);
                }
                if (siblings.length + batch.length > options.maxFiles) throw Object.assign(new Error('file limit'), { code: 'project-file-limit' });
                const total = [...siblings, ...batch].reduce((sum, item) => sum + item.size, 0);
                if (total > options.maxBytes) throw Object.assign(new Error('size limit'), { code: 'project-size-limit' });
                batch.forEach(file => files.set(file.id, file));
                projects.set(projectId, { ...projects.get(projectId), updatedAt: Date.now() });
                return batch;
            },
            async deleteProjectFile(projectId, fileId) {
                const file = files.get(fileId);
                if (!file || file.projectId !== projectId) return false;
                files.delete(fileId);
                return true;
            }
        },
        ProjectManager: {
            async get(id) { return projects.get(String(id)) || null; }
        },
        GM_setValue() {}
    });
    vm.runInContext(modelSource, context, { filename: 'workspace-model.js' });
    vm.runInContext(registrySource, context, { filename: 'file-registry.js' });
    vm.runInContext(facadeSource, context, { filename: 'workspace.js' });
    return {
        model: vm.runInContext('WorkspaceModel', context),
        registry: vm.runInContext('FileRegistry', context),
        workspace: vm.runInContext('Workspace', context),
        files
    };
}

test('normaliza projetos e restringe configurações aos valores suportados', () => {
    const { model } = createHarness();
    const project = model.normalizeProject({
        name: '  Projeto de teste  ',
        settings: { aiAccessMode: 'root', instructions: 'x'.repeat(25_000) }
    });
    assert.equal(project.name, 'Projeto de teste');
    assert.equal(project.settings.aiAccessMode, 'selected');
    assert.equal('allowAiEdits' in project.settings, false);
    assert.equal('requireEditApproval' in project.settings, false);
    assert.equal(project.settings.instructions.length, 20_000);
    assert.throws(() => model.normalizeProject({ name: '   ' }));
    assert.throws(() => model.normalizeProject({ id: '../bad', name: 'Invalid id' }));
});

test('normaliza Unicode e rejeita caminhos absolutos, traversal e separadores ambíguos', () => {
    const { model } = createHarness();
    assert.equal(model.normalizeFilePath('src/cafe\u0301.js'), 'src/café.js');
    for (const path of ['', '/etc/passwd', 'C:/secret.txt', '../outside.js', 'src/../outside.js', 'src\\file.js', 'src/file.js:stream', 'src/name.']) {
        assert.throws(() => model.normalizeFilePath(path));
    }
});

test('valida texto, binários e limites por arquivo', () => {
    const { registry } = createHarness();
    assert.equal(registry.validateTextFile({ path: 'src/main.js', content: 'const x = 1;' }).valid, true);
    assert.equal(registry.validateTextFile({ path: 'src/data.bin', content: 'a\0b' }).reason, 'binary-content');
    assert.equal(registry.validateTextFile({ path: 'src/large.txt', content: 'x'.repeat(1024 * 1024 + 1) }).reason, 'file-too-large');
    assert.equal(registry.validateTextFile({ path: '../escape.js', content: 'x' }).reason, 'invalid-path');
});

test('cria arquivos isolados por projeto e nega acesso da IA por padrão', async () => {
    const { registry, files } = createHarness();
    const created = await registry.create('project_a', { path: 'src/index.js', content: 'hello' });
    assert.equal(created.aiAccess, 'denied');
    assert.equal(created.size, 5);
    assert.equal(files.get(created.id).content, 'hello');
    assert.equal((await registry.list('project_b')).length, 0);
    assert.equal(await registry.get('project_b', created.id), null);
    await assert.rejects(registry.create('missing', { path: 'a.txt', content: 'x' }), { code: 'project-not-found' });
});

test('atualiza conteúdo diretamente e rejeita caminhos duplicados', async () => {
    const { registry } = createHarness();
    const first = await registry.create('project_a', { path: 'src/a.js', content: 'one' });
    await registry.create('project_a', { path: 'src/b.js', content: 'two' });
    const updated = await registry.update('project_a', first.id, { content: 'changed' });
    assert.equal('version' in updated, false);
    assert.equal((await registry.get('project_a', first.id)).content, 'changed');
    await assert.rejects(registry.update('project_a', first.id, { path: 'src/b.js' }), { code: 'file-exists' });
});

test('exclui arquivo apenas no projeto proprietário', async () => {
    const { registry, files } = createHarness();
    const file = await registry.create('project_a', { path: 'readme.md', content: 'doc' });
    assert.equal(await registry.remove('project_b', file.id), false);
    assert.equal(files.has(file.id), true);
    assert.equal(await registry.remove('project_a', file.id), true);
    assert.equal(files.has(file.id), false);
});

test('altera acesso individual da IA e persiste allowed/denied', async () => {
    const { registry, files } = createHarness();
    const file = await registry.create('project_a', { path: 'src/private.js', content: 'secret' });
    const allowed = await registry.setAccess('project_a', file.id, 'allowed');
    assert.equal(allowed.aiAccess, 'allowed');
    assert.equal(files.get(file.id).aiAccess, 'allowed');
    const denied = await registry.setAccess('project_a', file.id, 'denied');
    assert.equal(denied.aiAccess, 'denied');
    assert.equal(files.get(file.id).aiAccess, 'denied');
});

test('rejeita valores de acesso inválidos e arquivos ausentes ou de outro projeto', async () => {
    const { registry } = createHarness();
    const file = await registry.create('project_a', { path: 'src/private.js', content: 'secret' });
    await assert.rejects(registry.setAccess('project_a', file.id, 'all'), { code: 'invalid-ai-access' });
    await assert.rejects(registry.setAccess('project_a', file.id, true), { code: 'invalid-ai-access' });
    await assert.rejects(registry.setAccess('project_a', 'missing-file', 'allowed'), { code: 'file-not-found' });
    await assert.rejects(registry.setAccess('project_b', file.id, 'allowed'), { code: 'file-not-found' });
    await assert.rejects(registry.setAccess('missing-project', file.id, 'allowed'), { code: 'file-not-found' });
});

test('expõe a alteração de acesso somente pela fachada pública após init', async () => {
    const { workspace } = createHarness();
    await workspace.init();
    const file = await workspace.files.create('project_a', { path: 'readme.md', content: 'docs' });
    const updated = await workspace.files.setAccess('project_a', file.id, 'allowed');
    assert.equal(updated.aiAccess, 'allowed');
});

test('cria vários arquivos por uma operação e nega acesso da IA por padrão', async () => {
    const { registry, files } = createHarness();
    const created = await registry.createMany('project_a', [
        { path: 'src/index.js', content: 'export {};' },
        { path: 'docs/README.md', content: '# Docs' }
    ]);
    assert.equal(created.length, 2);
    assert.equal(created[0].path, 'src/index.js');
    assert.equal(created[1].path, 'docs/README.md');
    assert.ok(created.every(file => file.aiAccess === 'denied'));
    assert.equal([...files.values()].filter(file => file.projectId === 'project_a').length, 2);
});

test('createMany rejeita lote inválido sem persistir qualquer arquivo', async () => {
    const { registry, files } = createHarness();
    await assert.rejects(registry.createMany('project_a', [
        { path: 'src/valid.js', content: 'valid' },
        { path: 'src/../escape.js', content: 'invalid' }
    ]), { code: 'invalid-path' });
    await assert.rejects(registry.createMany('project_a', [
        { path: 'src/duplicate.js', content: 'one' },
        { path: 'src/duplicate.js', content: 'two' }
    ]), { code: 'file-exists' });
    assert.equal(files.size, 0);
});

test('createMany valida conflitos e limites do projeto antes de persistir', async () => {
    const { registry, files } = createHarness();
    await registry.create('project_a', { path: 'existing.txt', content: 'existing' });
    await assert.rejects(registry.createMany('project_a', [
        { path: 'new.txt', content: 'new' },
        { path: 'existing.txt', content: 'collision' }
    ]), { code: 'file-exists' });
    const oversizedProjectBatch = Array.from({ length: 20 }, (_, index) => ({
        path: 'bulk/file-' + index + '.txt',
        content: 'x'.repeat(1024 * 1024)
    }));
    await assert.rejects(registry.createMany('project_a', oversizedProjectBatch), { code: 'project-size-limit' });
    assert.equal([...files.values()].filter(file => file.projectId === 'project_a').length, 1);
});

test('expõe createMany somente pela fachada pública após init', async () => {
    const { workspace } = createHarness();
    await workspace.init();
    const files = await workspace.files.createMany('project_a', [
        { path: 'src/a.js', content: 'a' },
        { path: 'src/b.js', content: 'b' }
    ]);
    assert.equal(files.length, 2);
});
