// ===== src/tests/context-resolver-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../workspace/context-resolver.js', import.meta.url), 'utf8');

function createHarness({ accessMode = 'selected', files = [], initialized = true, project = null } = {}) {
    const projectData = project || {
        id: 'project_a',
        name: 'Project A',
        updatedAt: 10,
        settings: { aiAccessMode: accessMode, instructions: 'Use the existing architecture.' }
    };
    const context = vm.createContext({
        TextEncoder,
        Workspace: {
            isInitialized: () => initialized,
            projects: { async get(id) { return id === projectData.id ? projectData : null; } },
            files: {
                async list(id) { return files.filter(file => file.projectId === id).map(({ content, ...metadata }) => metadata); },
                async get(id, fileId) { return files.find(file => file.projectId === id && file.id === fileId) || null; }
            }
        }
    });
    vm.runInContext(source, context, { filename: 'context-resolver.js' });
    return vm.runInContext('ContextResolver', context);
}

const sampleFiles = [
    {
        id: 'file_url', projectId: 'project_a', path: 'src/validators/url-validator.js',
        name: 'url-validator.js', aiAccess: 'allowed',
        content: [
            'export function validateUrl(input) {',
            '  if (typeof input !== "string") return false;',
            '  const parsed = new URL(input);',
            '  return parsed.protocol === "https:";',
            '}'
        ].join('\n')
    },
    {
        id: 'file_ui', projectId: 'project_a', path: 'src/ui/button.js',
        name: 'button.js', aiAccess: 'allowed',
        content: 'export function renderButton() { return document.createElement("button"); }'
    },
    {
        id: 'file_secret', projectId: 'project_a', path: 'secrets/config.js',
        name: 'config.js', aiAccess: 'denied',
        content: 'validateUrl secretToken privateKey'
    }
];

test('retorna estado explícito quando Workspace não está inicializado', async () => {
    const resolver = createHarness({ initialized: false });
    assert.equal((await resolver.resolve({ projectId: 'project_a', query: 'validar URL' })).status, 'workspace-not-initialized');
});

test('distingue projeto não configurado, inexistente e consulta inválida', async () => {
    const resolver = createHarness();
    assert.equal((await resolver.resolve({ query: 'validar URL' })).status, 'project-not-configured');
    assert.equal((await resolver.resolve({ projectId: 'missing', query: 'validar URL' })).status, 'project-not-found');
    assert.equal((await resolver.resolve({ projectId: 'project_a', query: 'de e para' })).status, 'invalid-query');
});

test('respeita aiAccess selected e retorna trechos com linhas e evidências', async () => {
    const resolver = createHarness({ files: sampleFiles });
    const result = await resolver.resolve({ projectId: 'project_a', query: 'validar URL' });
    assert.equal(result.status, 'context-found');
    assert.equal(result.context.files.length, 1);
    assert.equal(result.context.files[0].path, 'src/validators/url-validator.js');
    assert.equal(result.context.files[0].excerpts[0].startLine, 1);
    assert.equal(result.context.files[0].relevance > 0, true);
    assert.equal(result.context.projectInstructions, 'Use the existing architecture.');
    assert.equal(result.diagnostics.accessibleFiles, 2);
    assert.equal(result.context.files.some(file => file.path === 'secrets/config.js'), false);
});

test('modo all permite leitura de arquivos sem autorização individual', async () => {
    const resolver = createHarness({ accessMode: 'all', files: sampleFiles });
    const result = await resolver.resolve({ projectId: 'project_a', query: 'privateKey' });
    assert.equal(result.status, 'context-found');
    assert.equal(result.context.files[0].path, 'secrets/config.js');
});

test('modo none e modo selected sem arquivos autorizados não expõem conteúdo', async () => {
    const denied = createHarness({ accessMode: 'none', files: sampleFiles });
    assert.equal((await denied.resolve({ projectId: 'project_a', query: 'validateUrl' })).status, 'project-no-access');

    const selected = createHarness({ files: sampleFiles.map(file => ({ ...file, aiAccess: 'denied' })) });
    assert.equal((await selected.resolve({ projectId: 'project_a', query: 'validateUrl' })).status, 'no-readable-files');
});

test('retorna no-relevant-files quando não há correspondência suficiente', async () => {
    const resolver = createHarness({ files: sampleFiles });
    const result = await resolver.resolve({ projectId: 'project_a', query: 'render a spaceship' });
    assert.equal(result.status, 'no-relevant-files');
    assert.equal(result.diagnostics.matchedFiles, 0);
});

test('respeita limites de arquivos e bytes e marca truncamento', async () => {
    const files = sampleFiles.slice(0, 2);
    const resolver = createHarness({ accessMode: 'all', files });
    const result = await resolver.resolve({
        projectId: 'project_a',
        query: 'function',
        maxFiles: 1,
        maxContextBytes: 24
    });
    assert.equal(result.context.files.length <= 1, true);
    assert.equal(result.status === 'context-truncated' || result.context.totalBytes <= 24, true);
    assert.equal(result.context.totalBytes <= 24, true);
});

test('normaliza acentos e identifica tokens técnicos', () => {
    const resolver = createHarness();
    assert.deepEqual(Array.from(resolver.tokenize('Validação de URL validateUrl')), ['validacao', 'url', 'validateurl']);
});
