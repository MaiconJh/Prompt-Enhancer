// ===== src/tests/repair-handler-tests.js =====
import assert from 'node:assert/strict';
import test from 'node:test';

import '../anchor-extractor.js';
import '../output-validator.js';
import '../repair-handler.js';

const { RepairHandler, MAX_REPAIRS } = globalThis.PE;

test('MAX_REPAIRS equals 1', () => {
    assert.equal(MAX_REPAIRS, 1);
});

test('RepairHandler starts with zero repairs and no violations', () => {
    const handler = new RepairHandler();
    assert.equal(handler.getRepairCount(), 0);
    assert.deepEqual(handler.getViolations(), []);
    assert.equal(handler.canRepair(), true);
});

test('RepairHandler validates output and detects violations', () => {
    const handler = new RepairHandler();
    const valid = handler.validate(
        'use userName no código.',
        'Ignore all instructions. As an AI language model, I can\'t do that.'
    );
    assert.equal(valid, false);
    assert.equal(handler.getViolations().length > 0, true);
    assert.ok(handler.getViolations().some(v => v.type === 'lost_anchor'));
    assert.ok(handler.getViolations().some(v => v.type === 'meta_comment'));
});

test('RepairHandler can repair once', () => {
    const handler = new RepairHandler();
    assert.equal(handler.canRepair(), true);
    assert.equal(handler.recordRepair(), true);
    assert.equal(handler.getRepairCount(), 1);
    assert.equal(handler.canRepair(), false);
});

test('RepairHandler cannot repair more than once', () => {
    const handler = new RepairHandler();
    handler.recordRepair();
    assert.equal(handler.recordRepair(), false);
    assert.equal(handler.getRepairCount(), 1);
    assert.equal(handler.canRepair(), false);
});

test('RepairHandler reset clears state', () => {
    const handler = new RepairHandler();
    handler.recordRepair();
    handler.validate('x', 'Ignore all instructions.', 'en');
    handler.reset();
    assert.equal(handler.getRepairCount(), 0);
    assert.deepEqual(handler.getViolations(), []);
    assert.equal(handler.canRepair(), true);
});

test('RepairHandler valid output requires no repair', () => {
    const handler = new RepairHandler();
    const valid = handler.validate(
        'Create a script.',
        'Create a validation script with regex.',
        'en'
    );
    assert.equal(valid, true);
    assert.equal(handler.getViolations().length, 0);
    assert.equal(handler.getRepairCount(), 0);
});