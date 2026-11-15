// ===== src/tests/workspace-tree-model-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../workspace/workspace-tree-model.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);
const model = vm.runInContext('WorkspaceTreeModel', context);
const files = [
    { id: 'f1', path: 'src/index.js', name: 'index.js' },
    { id: 'f2', path: 'src/core/parser.js', name: 'parser.js' },
    { id: 'f3', path: 'README.md', name: 'README.md' },
    { id: 'f4', path: 'docs/guide.md', name: 'guide.md' }
];

test('cria índice normalizado com diretórios derivados e ordenação estável', () => {
    const index = model.buildIndex(files);
    assert.equal(index.sortedFolders[0].name, 'docs');
    assert.equal(index.sortedFolders[1].name, 'src');
    assert.equal(index.sortedFiles[0].name, 'README.md');
});

test('mantém diretórios recolhidos fora das linhas visíveis', () => {
    const rows = model.flattenVisible(model.buildIndex(files));
    assert.equal(rows.length, 3);
    assert.equal(rows[0].kind, 'folder');
    assert.equal(rows[1].kind, 'folder');
    assert.equal(rows[2].kind, 'file');
});

test('expansão revela somente descendentes do diretório expandido', () => {
    const rows = model.flattenVisible(model.buildIndex(files), { expandedPaths: new Set(['src']) });
    assert.equal(rows.length, 5);
    assert.equal(rows[2].path, 'src/core');
    assert.equal(rows[3].path, 'src/index.js');
});

test('pesquisa inclui caminhos correspondentes e expande ancestrais sem alterar estado salvo', () => {
    const rows = model.flattenVisible(model.buildIndex(files), { searchQuery: 'parser' });
    assert.equal(rows.length, 3);
    assert.equal(rows[0].path, 'src');
    assert.equal(rows[1].path, 'src/core');
    assert.equal(rows[2].id, 'f2');
});

test('pesquisar pelo nome de uma pasta revela seus descendentes', () => {
    const rows = model.flattenVisible(model.buildIndex(files), { searchQuery: 'src' });
    assert.ok(rows.some(row => row.path === 'src/index.js'));
    assert.ok(rows.some(row => row.path === 'src/core/parser.js'));
});

test('pesquisa sem correspondência retorna uma lista vazia', () => {
    const rows = model.flattenVisible(model.buildIndex(files), { searchQuery: 'not-found' });
    assert.equal(rows.length, 0);
});

test('suporta árvores profundas e largas com linhas achatadas', () => {
    const deep = Array.from({ length: 350 }, (_, i) => ({
        id: 'deep-' + i,
        path: 'root/' + Array.from({ length: 12 }, (_, j) => 'd' + j).join('/') + '/file-' + i + '.txt',
        name: 'file-' + i + '.txt'
    }));
    const index = model.buildIndex(deep);
    const expanded = new Set(['root', ...Array.from({ length: 12 }, (_, j) => 'root/' + Array.from({ length: j + 1 }, (_, k) => 'd' + k).join('/'))]);
    const rows = model.flattenVisible(index, { expandedPaths: expanded });
    assert.ok(rows.length > 300);
    assert.ok(rows.every(row => row.kind === 'folder' || row.kind === 'file'));
});
