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


test('salvamento de arquivo e lote verifica colisões com o domínio de pastas', () => {
    const saveFile = source.slice(source.indexOf('function saveFile('), source.indexOf('function saveFiles('));
    const saveFiles = source.slice(source.indexOf('function saveFiles('), source.indexOf('function deleteProject('));
    assert.match(saveFile, /transaction\(\['projects', 'files', 'folders'\], 'readwrite'\)/);
    assert.match(saveFile, /projectFolders\.some\(folder => folder\.path === file\.path\)/);
    assert.match(saveFile, /item\.path\.startsWith\(file\.path \+ '\/'\)/);
    assert.match(saveFiles, /transaction\(\['projects', 'files', 'folders'\], 'readwrite'\)/);
    assert.match(saveFiles, /projectFolders\.some\(folder => folder\.path === file\.path\)/);
});
