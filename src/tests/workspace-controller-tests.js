// ===== src/tests/workspace-controller-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../workspace/workspace-controller.js', import.meta.url), 'utf8');

function createHarness() {
    const calls = [];
    const context = vm.createContext({
        TextDecoder,
        I18n: { t: key => key },
        Workspace: {
            files: {
                createMany: async (projectId, files) => {
                    calls.push({ projectId, files });
                    return files.map((file, index) => ({ id: String(index), ...file }));
                },
                validate: ({ path, content }) => ({
                    valid: !path.includes('..') && !content.includes('\0'),
                    path,
                    message: 'invalid-file'
                })
            }
        }
    });
    vm.runInContext(source, context);
    return { controller: vm.runInContext('WorkspaceController', context), calls };
}

test('parsePaths normaliza linhas vazias e espaços sem alterar o caminho', () => {
    const { controller } = createHarness();
    assert.deepEqual(Array.from(controller.parsePaths(' src/a.js \r\n\n docs/readme.md ')), ['src/a.js', 'docs/readme.md']);
});

test('cria vários arquivos em uma única chamada atômica', async () => {
    const { controller, calls } = createHarness();
    const result = await controller.createFiles('project-a', 'src/a.js\ndocs/readme.md');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].projectId, 'project-a');
    assert.deepEqual(calls[0].files.map(file => file.path), ['src/a.js', 'docs/readme.md']);
    assert.equal(result.length, 2);
});

test('cria pasta somente junto com seus arquivos iniciais', async () => {
    const { controller, calls } = createHarness();
    await controller.createFolder('project-a', 'src/components/', 'Button.jsx\nforms/Input.jsx');
    assert.deepEqual(calls[0].files.map(file => file.path), [
        'src/components/Button.jsx',
        'src/components/forms/Input.jsx'
    ]);
});

test('importa caminhos relativos e delega o lote inteiro a createMany', async () => {
    const { controller, calls } = createHarness();
    const makeFile = (name, path, text, type = 'text/plain') => ({
        name, webkitRelativePath: path, type, size: new TextEncoder().encode(text).length,
        arrayBuffer: async () => new TextEncoder().encode(text).buffer
    });
    await controller.importFiles('project-a', [
        makeFile('index.js', 'sample/src/index.js', 'export {};', 'text/javascript'),
        makeFile('README.md', 'sample/README.md', '# Docs')
    ]);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].files.map(file => file.path), ['sample/src/index.js', 'sample/README.md']);
});

test('rejeita MIME binário, UTF-8 inválido e caminho inválido antes de persistir', async () => {
    const { controller, calls } = createHarness();
    const binary = { name: 'image.png', type: 'image/png', size: 3, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
    await assert.rejects(controller.importFiles('project-a', [binary]), /ws.errors.textOnly/);
    const invalidUtf8 = { name: 'bad.txt', type: 'text/plain', size: 2, arrayBuffer: async () => new Uint8Array([0xc3, 0x28]).buffer };
    await assert.rejects(controller.importFiles('project-a', [invalidUtf8]), /ws.errors.textOnly/);
    const invalidPath = { name: 'bad.txt', type: 'text/plain', size: 1, arrayBuffer: async () => new TextEncoder().encode('x').buffer };
    invalidPath.webkitRelativePath = '../bad.txt';
    await assert.rejects(controller.importFiles('project-a', [invalidPath]), /invalid-file/);
    assert.equal(calls.length, 0);
});

test('rejeita arquivos maiores que o limite antes da leitura', async () => {
    const { controller, calls } = createHarness();
    const oversized = { name: 'large.txt', type: 'text/plain', size: 1024 * 1024 + 1, arrayBuffer: async () => { throw new Error('should-not-read'); } };
    await assert.rejects(controller.importFiles('project-a', [oversized]), /ws.errors.fileTooLarge/);
    assert.equal(calls.length, 0);
});
