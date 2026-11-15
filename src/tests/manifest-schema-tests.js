import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidModulePath, validateManifest } from '../../manifest-schema.js';

function entry(file) {
    return { file, description: 'Test module.', interfaces: { provides: ['Example'], consumes: [] }, interactions: ['Used by tests.'] };
}

test('accepts safe nested source module paths', () => {
    assert.equal(isValidModulePath('workspace/files/file-registry.js'), true);
    assert.doesNotThrow(() => validateManifest({ modules: [entry('workspace/files/file-registry.js')] }));
});

test('rejects absolute paths, traversal, backslashes, tests and structural files', () => {
    for (const path of ['/workspace/a.js', '../outside.js', 'workspace/../outside.js', 'workspace\\file.js', 'tests/example.js', 'banner.js']) {
        assert.equal(isValidModulePath(path), false, path);
        assert.throws(() => validateManifest({ modules: [entry(path)] }));
    }
});

test('rejects duplicate nested module paths', () => {
    assert.throws(() => validateManifest({ modules: [entry('workspace/core.js'), entry('workspace/core.js')] }), /duplicados/);
});
