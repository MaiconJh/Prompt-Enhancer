// ===== src/tests/workspace-editor-view-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../workspace/workspace-editor-view.js', import.meta.url), 'utf8');
const manifest = JSON.parse(await readFile(new URL('../../manifest.json', import.meta.url), 'utf8'));

test('editor view é um módulo independente e não acessa a persistência', () => {
    assert.doesNotThrow(() => new Function(source));
    assert.match(source, /function create\(/);
    assert.match(source, /onSave/);
    assert.match(source, /onDelete/);
    assert.doesNotMatch(source, /WorkspaceStorage|ProjectManager|FileRegistry|indexedDB/);
    const module = manifest.modules.find(item => item.file === 'workspace/workspace-editor-view.js');
    assert.ok(module);
    assert.ok(module.interfaces.provides.includes('WorkspaceEditorView'));
});
