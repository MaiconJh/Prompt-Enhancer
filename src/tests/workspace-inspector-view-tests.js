// ===== src/tests/workspace-inspector-view-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../workspace/workspace-inspector-view.js', import.meta.url), 'utf8');
const manifest = JSON.parse(await readFile(new URL('../../manifest.json', import.meta.url), 'utf8'));

test('inspector é um módulo de apresentação que recebe seções e não acessa persistência', () => {
    assert.doesNotThrow(() => new Function(source));
    assert.match(source, /function create\(/);
    assert.match(source, /setOpen\(open\)/);
    assert.doesNotMatch(source, /WorkspaceStorage|ProjectManager|FileRegistry|indexedDB/);
    const module = manifest.modules.find(item => item.file === 'workspace/workspace-inspector-view.js');
    assert.ok(module);
    assert.ok(module.interfaces.provides.includes('WorkspaceInspectorView'));
});
