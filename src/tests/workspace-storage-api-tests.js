import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../workspace/storage-adapter.js', import.meta.url), 'utf8');

test('expõe deleteProject na API pública do WorkspaceStorage', () => {
    const publicApi = source.match(/return\s*\{([\s\S]*?)\n\s*\};\s*\n\}\)\(\);/);
    assert.ok(publicApi, 'não foi possível localizar o objeto público do WorkspaceStorage');
    assert.match(publicApi[1], /^\s*deleteProject\s*,?\s*$/m);
    assert.match(source, /function deleteProject\(projectId\)/);
});


test('persiste pastas em object store versionado e expõe mutações atômicas', () => {
    assert.match(source, /const DB_VERSION = 2/);
    assert.match(source, /createObjectStore\('folders'/);
    const publicApi = source.match(/return\s*\{([\s\S]*?)\n\s*\};\s*\n\}\)\(\);/);
    assert.ok(publicApi);
    for (const method of ['listFolders', 'createProjectFolder', 'renameProjectFolder', 'deleteProjectFolder', 'setFileAccessMany']) {
        assert.ok(publicApi[1].includes(method), method + ' ausente da API pública');
    }
    assert.match(source, /transaction\(\['projects', 'files', 'folders'\], 'readwrite'\)/);
});
