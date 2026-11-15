// ===== src/tests/i18n-parity-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourceDir = new URL('../', import.meta.url);
const i18nSource = await readFile(new URL('i18n.js', sourceDir), 'utf8');

const context = vm.createContext({});
vm.runInContext(
    `(function(){${i18nSource}\nreturn DICTS;})()`,
    context,
    { filename: 'src/i18n.js' }
);
const DICTS = context.DICTS || {};

test('paridade i18n: en e pt-BR têm as mesmas chaves', () => {
    const enKeys = Object.keys(DICTS.en || {}).sort();
    const ptKeys = Object.keys(DICTS['pt-BR'] || {}).sort();
    assert.deepEqual(enKeys, ptKeys, `Chaves ausentes em pt-BR: ${enKeys.filter(k => !ptKeys.includes(k)).join(', ')}; chaves extras em pt-BR: ${ptKeys.filter(k => !enKeys.includes(k)).join(', ')}`);
});

test('paridade i18n: nenhuma chave vazia em en ou pt-BR', () => {
    for (const lang of ['en', 'pt-BR']) {
        const dict = DICTS[lang] || {};
        for (const [key, value] of Object.entries(dict)) {
            assert.ok(value && String(value).trim().length > 0, `Chave vazia em ${lang}: ${key}`);
        }
    }
});
