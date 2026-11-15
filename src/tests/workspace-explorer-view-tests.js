// ===== src/tests/workspace-explorer-view-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const modelSource = await readFile(new URL('../workspace/workspace-tree-model.js', import.meta.url), 'utf8');
const viewSource = await readFile(new URL('../workspace/workspace-explorer-view.js', import.meta.url), 'utf8');

function createHarness() {
    const dom = new JSDOM('<!doctype html><div id="tree"></div>');
    const context = vm.createContext({
        document: dom.window.document,
        I18n: { t: key => key }
    });
    vm.runInContext(modelSource, context);
    vm.runInContext(viewSource, context);
    const view = vm.runInContext('WorkspaceExplorerView', context);
    const container = dom.window.document.getElementById('tree');
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 120 });
    return { dom, view, container };
}

test('virtualiza linhas visíveis acima do limite e mantém apenas a janela no DOM', () => {
    const { dom, view, container } = createHarness();
    const files = Array.from({ length: 350 }, (_, index) => ({
        id: 'file-' + index,
        name: 'file-' + index + '.txt',
        path: 'file-' + index + '.txt',
        aiAccess: 'denied'
    }));

    view.render(container, { files });
    assert.equal(container.dataset.virtualized, 'true');
    assert.ok(container.querySelectorAll('[data-row-index]').length <= 20);
    assert.ok(container.querySelector('[data-row-index="0"]'));

    container.scrollTop = 3000;
    container.dispatchEvent(new dom.window.Event('scroll'));
    assert.ok(container.querySelector('[data-row-index="92"]'));
    assert.equal(container.querySelector('[data-row-index="0"]'), null);
    assert.ok(container.querySelector('.pe-workspace__tree-spacer'));
    view.destroy(container);
});

test('navegação por teclado rola até itens fora da janela virtualizada', () => {
    const { dom, view, container } = createHarness();
    const files = Array.from({ length: 350 }, (_, index) => ({
        id: 'file-' + index,
        name: 'file-' + index + '.txt',
        path: 'file-' + index + '.txt',
        aiAccess: 'denied'
    }));

    view.render(container, { files });
    const first = container.querySelector('[data-row-index="0"]');
    first.focus();
    first.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    assert.ok(container.querySelector('[data-row-index="349"]'));
    assert.equal(dom.window.document.activeElement.dataset.rowIndex, '349');
    view.destroy(container);
});

test('recolher pasta remove descendentes sem descartar os arquivos do índice', () => {
    const { dom, view, container } = createHarness();
    const files = [
        { id: 'a', name: 'a.js', path: 'src/a.js', aiAccess: 'denied' },
        { id: 'b', name: 'b.js', path: 'src/lib/b.js', aiAccess: 'denied' }
    ];
    view.render(container, { files });
    const folder = container.querySelector('[data-row-kind="folder"]');
    folder.click();
    assert.equal(container.querySelectorAll('[data-row-kind="folder"]').length, 1);
    assert.equal(container.querySelectorAll('[data-row-kind="file"]').length, 0);
    view.destroy(container);
});
