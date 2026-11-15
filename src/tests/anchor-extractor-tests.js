// ===== src/tests/anchor-extractor-tests.js =====
import assert from 'node:assert/strict';
import test from 'node:test';

import '../anchor-extractor.js';

const { extractAnchors, normalizeAnchor, compareAnchors, ANCHOR_CATEGORIES } = globalThis.PE;

test('ANCHOR_CATEGORIES contains the 5 expected categories', () => {
    assert.deepEqual(ANCHOR_CATEGORIES, ['camelCase', 'snake_case', 'url', 'placeholder', 'code']);
});

test('extractAnchors extracts camelCase', () => {
    const anchors = extractAnchors('use userName e userAge no codigo');
    const camel = anchors.filter(a => a.category === 'camelCase');
    assert.ok(camel.some(a => a.text === 'userName'));
    assert.ok(camel.some(a => a.text === 'userAge'));
});

test('extractAnchors extracts snake_case', () => {
    const anchors = extractAnchors('defina max_tokens e user_name no config');
    const snake = anchors.filter(a => a.category === 'snake_case');
    assert.ok(snake.some(a => a.text === 'max_tokens'));
    assert.ok(snake.some(a => a.text === 'user_name'));
});

test('extractAnchors extracts URLs', () => {
    const anchors = extractAnchors('acesse https://api.example.com/v1/users agora');
    const urls = anchors.filter(a => a.category === 'url');
    assert.ok(urls.some(a => a.text === 'https://api.example.com/v1/users'));
});

test('extractAnchors extracts placeholders', () => {
    const anchors = extractAnchors('substitua {user_id} e [nome] e ${apiKey}');
    const placeholders = anchors.filter(a => a.category === 'placeholder');
    assert.ok(placeholders.some(a => a.text === '{user_id}'));
    assert.ok(placeholders.some(a => a.text === '[nome]'));
    assert.ok(placeholders.some(a => a.text === '${apiKey}'));
});

test('extractAnchors extracts generic code identifiers', () => {
    const anchors = extractAnchors('chame UserService e MAX_RETRIES no codigo');
    const code = anchors.filter(a => a.category === 'code');
    assert.ok(code.some(a => a.text === 'UserService'));
    assert.ok(code.some(a => a.text === 'MAX_RETRIES'));
});

test('extractAnchors discards tokens smaller than 2 characters', () => {
    const anchors = extractAnchors('a b x y z');
    assert.equal(anchors.length, 0);
});

test('normalizeAnchor keeps original text (no lowercasing)', () => {
    const anchor = { text: 'UserName', category: 'camelCase', start: 0, end: 8 };
    assert.equal(normalizeAnchor(anchor), 'UserName');

    const anchor2 = { text: 'user_name', category: 'snake_case', start: 0, end: 9 };
    assert.equal(normalizeAnchor(anchor2), 'user_name');
});

test('compareAnchors identifies preserved anchors (exact match)', () => {
    const original = extractAnchors('use userName e max_tokens');
    const enhanced = extractAnchors('Refatore userName e max_tokens para melhorar');
    const result = compareAnchors(original, enhanced);
    assert.equal(result.preserved.length, 2);
    assert.equal(result.lost.length, 0);
});

test('compareAnchors identifies lost anchors (case difference)', () => {
    const original = extractAnchors('use userName');
    const enhanced = extractAnchors('use username');
    const result = compareAnchors(original, enhanced);
    assert.equal(result.preserved.length, 0);
    assert.equal(result.lost.length, 1);
    assert.equal(result.lost[0].text, 'userName');
});

test('compareAnchors identifies lost anchors (different identifier)', () => {
    const original = extractAnchors('chame processPayment');
    const enhanced = extractAnchors('chame obterDados');
    const result = compareAnchors(original, enhanced);
    assert.equal(result.preserved.length, 0);
    assert.equal(result.lost.length, 1);
});

test('compareAnchors does not false positive for missing anchors', () => {
    const original = extractAnchors('texto simples sem ancoras');
    const enhanced = extractAnchors('outro texto qualquer');
    const result = compareAnchors(original, enhanced);
    assert.equal(result.preserved.length, 0);
    assert.equal(result.lost.length, 0);
});

test('extractAnchors does NOT flag sentence-start capitalized words as anchors', () => {
    const anchors = extractAnchors('Melhore a suíte de testes. Não altere código de produção. Mantenha os testes verdes.');
    // Nenhuma âncora de código deve ser detectada em palavras capitalizadas no início de frase
    const codeAnchors = anchors.filter(a => a.category === 'code');
    assert.equal(codeAnchors.length, 0, 'Palavras capitalizadas no início de frase não são âncoras de código');
});

test('extractAnchors handles empty text', () => {
    const anchors = extractAnchors('');
    assert.equal(anchors.length, 0);
});

test('extractAnchors does not break with only delimiters', () => {
    const anchors = extractAnchors('   ,.;:!?  ');
    assert.equal(anchors.length, 0);
});