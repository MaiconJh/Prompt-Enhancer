// ===== src/tests/theme-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourceDir = new URL('../', import.meta.url);
const themeSource = await readFile(new URL('theme.js', sourceDir), 'utf8');

function createHarness(initial = {}, prefersDark = false) {
    const values = new Map(Object.entries(initial));
    const attrs = new Map();
    const events = [];
    const context = vm.createContext({
        GM_getValue: (k, f) => values.has(k) ? values.get(k) : f,
        GM_setValue: (k, v) => values.set(k, v),
        CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
        document: {
            documentElement: {
                setAttribute: (k, v) => attrs.set(k, v),
                removeAttribute: (k) => attrs.delete(k)
            }
        },
        window: {
            dispatchEvent: (e) => events.push(e),
            matchMedia: () => ({ matches: prefersDark })
        }
    });
    vm.runInContext(themeSource, context, { filename: 'src/theme.js' });
    return {
        Theme: vm.runInContext('Theme', context),
        values,
        attrs,
        events
    };
}

test('padrão é auto e não escreve atributo no <html>', () => {
    const { Theme, attrs } = createHarness();
    Theme.apply();
    assert.equal(Theme.get(), 'auto');
    assert.equal(attrs.has('data-pe-theme'), false);
});

test('dark e light forçados aplicam o atributo; auto o remove', () => {
    const { Theme, attrs, values } = createHarness();
    Theme.set('dark');
    assert.equal(attrs.get('data-pe-theme'), 'dark');
    assert.equal(values.get('pe_theme'), 'dark');
    Theme.set('light');
    assert.equal(attrs.has('data-pe-theme'), false);
    assert.equal(values.get('pe_theme'), 'light');
    Theme.set('auto');
    assert.equal(attrs.has('data-pe-theme'), false);
});

test('valor inválido armazenado cai para auto', () => {
    const { Theme } = createHarness({ pe_theme: 'sepia' });
    assert.equal(Theme.get(), 'auto');
});

test('cycle percorre auto → light → dark → auto e emite evento', () => {
    const { Theme, events } = createHarness();
    assert.deepEqual([Theme.cycle(), Theme.cycle(), Theme.cycle()], ['light', 'dark', 'auto']);
    assert.equal(events.length, 3);
    assert.equal(events[0].type, 'pe:theme-changed');
});

test('resolved() usa o sistema quando auto', () => {
    const { Theme } = createHarness({}, true);
    assert.equal(Theme.resolved(), 'dark');
    Theme.set('light');
    assert.equal(Theme.resolved(), 'light');
});
