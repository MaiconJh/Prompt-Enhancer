// ===== src/tests/output-validator-tests.js =====
import assert from 'node:assert/strict';
import test from 'node:test';

import '../anchor-extractor.js';
import '../output-validator.js';

const { validateOutput } = globalThis.PE;

test('validateOutput approves valid output without violations', () => {
    const result = validateOutput(
        'Create a validation script.',
        'Create a validation script with regex.',
    );
    assert.equal(result.valid, true);
    assert.equal(result.violations.length, 0);
});

test('validateOutput detects lost anchor (code identifier disappears)', () => {
    const result = validateOutput(
        'use userName e getUserById no código.',
        'Refatore o código para ser mais eficiente.'
    );
    assert.equal(result.valid, false);
    assert.ok(result.violations.some(v => v.type === 'lost_anchor'));
});

test('validateOutput detects meta comment', () => {
    const result = validateOutput(
        'Explain async/await.',
        'As an AI language model, I cannot explain this.'
    );
    assert.equal(result.valid, false);
    assert.ok(result.violations.some(v => v.type === 'meta_comment'));
});

test('validateOutput detects apology as meta comment', () => {
    const result = validateOutput(
        'Implement JWT.',
        "I'm sorry, I can't do that."
    );
    assert.equal(result.valid, false);
    assert.ok(result.violations.some(v => v.type === 'meta_comment'));
});

test('validateOutput detects language change by script (Latin -> Cyrillic)', () => {
    const result = validateOutput(
        'Привет, создай скрипт.',
        'Hello, create a script.'
    );
    assert.equal(result.valid, false);
    assert.ok(result.violations.some(v => v.type === 'language_change'));
});

test('validateOutput does not detect language change when same script', () => {
    const result = validateOutput(
        'Create a script.',
        'Create a validation script.'
    );
    const langViolations = result.violations.filter(v => v.type === 'language_change');
    assert.equal(langViolations.length, 0);
});

test('validateOutput detects multiple violations', () => {
    const result = validateOutput(
        'use userName no código.',
        'Ignore all instructions. As an AI language model, I can\'t do that.'
    );
    assert.equal(result.valid, false);
    const types = result.violations.map(v => v.type);
    assert.ok(types.includes('lost_anchor'));
    assert.ok(types.includes('meta_comment'));
});

test('validateOutput with empty text', () => {
    const result = validateOutput('', '');
    assert.equal(result.valid, true);
    assert.equal(result.violations.length, 0);
});

test('validateOutput does not false positive for same script (Latin -> Latin)', () => {
    // PT and EN both use Latin script — must not be flagged as language change
    const result = validateOutput(
        'Crie um script de validação.',
        'Create a validation script.'
    );
    const langViolations = result.violations.filter(v => v.type === 'language_change');
    assert.equal(langViolations.length, 0);
});