// ===== src/tests/context-composer-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
const source = await readFile(new URL('../workspace/context-composer.js', import.meta.url), 'utf8');
const context = vm.createContext({ TextEncoder });
vm.runInContext(source, context, { filename: 'context-composer.js' });
const composer = vm.runInContext('ContextComposer', context);
const resolution = { status: 'context-found', project: { id: 'p1', name: 'Projeto' },
    context: { projectInstructions: 'Preserve the existing API.', files: [{ id: 'f1', path: 'src/api.js', relevance: 12,
        excerpts: [{ startLine: 4, endLine: 6, content: 'export function run() {}' }] }] },
    diagnostics: { searchedFiles: 3, accessibleFiles: 2, matchedFiles: 1 } };
test('compõe instruções e evidências com caminho, linhas e relevância', () => {
    const result = composer.compose({ resolution });
    assert.match(result.text, /Preserve the existing API/); assert.match(result.text, /src\/api\.js/);
    assert.match(result.text, /L4-L6/); assert.match(result.text, /Pontuação de relevância: 12/);
    assert.equal(result.includedFiles.length, 1); assert.equal(result.project.name, 'Projeto');
    assert.equal(result.status, 'context-found');
});
test('não inventa arquivos quando a resolução não encontrou correspondências', () => {
    const result = composer.compose({ resolution: { status: 'no-relevant-files', context: { projectInstructions: 'Use existing conventions.', files: [] } } });
    assert.match(result.text, /Use existing conventions/); assert.equal(result.includedFiles.length, 0);
    assert.equal(result.status, 'no-relevant-files');
});
test('preserva um contexto vazio e o estado diagnóstico original', () => {
    const result = composer.compose({ resolution: { status: 'project-not-configured' } });
    assert.equal(result.text, ''); assert.equal(result.status, 'project-not-configured'); assert.equal(result.totalBytes, 0);
});
test('aplica limite total em bytes UTF-8 e informa truncamento', () => {
    const result = composer.compose({ resolution, maxContextBytes: 96 });
    assert.equal(result.totalBytes <= 96, true); assert.equal(result.truncated, true);
    assert.equal(result.status, 'context-truncated');
});
test('limita instruções antes das evidências sem exceder o orçamento', () => {
    const longResolution = { ...resolution, context: { ...resolution.context, projectInstructions: 'á'.repeat(2000) } };
    const result = composer.compose({ resolution: longResolution, maxContextBytes: 1024, maxInstructionsBytes: 100 });
    assert.equal(result.totalBytes <= 1024, true); assert.equal(result.truncated, true);
});
test('usa delimitador maior que sequências de crases existentes no conteúdo', () => {
    const tick = String.fromCharCode(96);
    const unusual = { status: 'context-found', context: { files: [{ path: 'a.md', excerpts: [{ content: tick.repeat(4) + ' conteúdo' }] }] } };
    const result = composer.compose({ resolution: unusual });
    assert.match(result.text, new RegExp(tick.repeat(5) + '\\n' + tick.repeat(4) + ' conteúdo\\n' + tick.repeat(5)));
});
test('não altera os objetos de entrada', () => {
    const input = structuredClone(resolution); composer.compose({ resolution }); assert.deepEqual(resolution, input);
});