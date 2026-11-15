// ===== src/tests/workspace-panel-layout-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('../workspace/workspace-panel-layout.js', import.meta.url), 'utf8');

function createHarness() {
    const dom = new JSDOM('<!doctype html><section id="root"></section>');
    const context = vm.createContext({
        document: dom.window.document,
        I18n: { t: key => key }
    });
    vm.runInContext(source, context);
    const layout = vm.runInContext('WorkspacePanelLayout', context);
    const root = dom.window.document.getElementById('root');
    return { dom, layout, root };
}

test('limita a largura do explorador e expõe seu valor acessível', () => {
    const { layout, root } = createHarness();
    const panel = layout.create({ root, initialWidth: 300 });
    assert.equal(panel.getWidth(), 300);
    assert.equal(root.style.getPropertyValue('--pe-workspace-explorer-width'), '300px');
    assert.equal(panel.splitter.getAttribute('aria-valuenow'), '300');
    assert.equal(panel.setWidth(999), 420);
    assert.equal(panel.setWidth(100), 180);
    panel.destroy();
});

test('redimensiona por teclado com limites e incremento previsível', () => {
    const { dom, layout, root } = createHarness();
    const panel = layout.create({ root });
    panel.splitter.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.equal(panel.getWidth(), 256);
    panel.splitter.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    assert.equal(panel.getWidth(), 180);
    panel.splitter.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    assert.equal(panel.getWidth(), 420);
    panel.destroy();
});

test('redimensiona por ponteiro e encerra a captura ao soltar', () => {
    const { dom, layout, root } = createHarness();
    const panel = layout.create({ root });
    panel.splitter.dispatchEvent(new dom.window.MouseEvent('pointerdown', { button: 0, clientX: 200, bubbles: true }));
    panel.splitter.dispatchEvent(new dom.window.MouseEvent('pointermove', { clientX: 260, bubbles: true }));
    assert.equal(panel.getWidth(), 300);
    panel.splitter.dispatchEvent(new dom.window.MouseEvent('pointerup', { bubbles: true }));
    panel.splitter.dispatchEvent(new dom.window.MouseEvent('pointermove', { clientX: 400, bubbles: true }));
    assert.equal(panel.getWidth(), 300);
    panel.destroy();
});
