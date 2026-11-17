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
    assert.ok(container.querySelector('[data-row-index="130"]'));
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
    let folder = container.querySelector('[data-row-path="src"]');
    folder.click();
    assert.equal(container.querySelectorAll('[data-row-kind="folder"]').length, 2);
    assert.equal(container.querySelectorAll('[data-row-kind="file"]').length, 1);
    folder = container.querySelector('[data-row-path="src"]');
    folder.click();
    assert.equal(container.querySelectorAll('[data-row-kind="folder"]').length, 1);
    assert.equal(container.querySelectorAll('[data-row-kind="file"]').length, 0);
    view.destroy(container);
});


test('árvore expõe estado vazio e estado sem resultados de busca', () => {
    const { view, container } = createHarness();
    view.render(container, { files: [] });
    assert.equal(container.querySelector('[role="treeitem"]'), null);
    assert.equal(container.querySelector('.pe-workspace__empty').textContent, 'ws.files.empty');

    view.render(container, { files: [{ id: 'a', name: 'alpha.js', path: 'src/alpha.js' }], searchQuery: 'missing' });
    assert.equal(container.querySelector('[role="treeitem"]'), null);
    assert.equal(container.querySelector('.pe-workspace__empty').textContent, 'ws.files.noMatches');
    view.destroy(container);
});

test('árvore oferece navegação por setas, expansão, recolhimento, ativação e limites', () => {
    const { dom, view, container } = createHarness();
    const files = [
        { id: 'a', name: 'alpha.js', path: 'src/alpha.js', aiAccess: 'allowed' },
        { id: 'b', name: 'beta.js', path: 'src/lib/beta.js', aiAccess: 'denied' }
    ];
    const selected = [];
    view.render(container, { files, onSelect: id => selected.push(id) });
    const folder = container.querySelector('[data-row-path="src"]');
    assert.equal(folder.getAttribute('role'), 'treeitem');
    assert.equal(folder.getAttribute('aria-expanded'), 'false');
    folder.focus();
    folder.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.equal(container.querySelector('[data-row-path="src"]').getAttribute('aria-expanded'), 'true');
    assert.ok(container.querySelector('[data-file-id="a"]'));
    const file = container.querySelector('[data-file-id="a"]');
    file.focus();
    file.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert.deepEqual(selected, ['a']);
    file.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    assert.equal(dom.window.document.activeElement.dataset.rowPath, 'src');
    container.querySelector('[data-row-path="src"]').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    assert.equal(container.querySelector('[data-row-path="src"]').getAttribute('aria-expanded'), 'false');
    view.destroy(container);
});


test('inspeção, foco, seleção e exclusão são callbacks distintos', () => {
    const { view, container } = createHarness();
    const events = [];
    view.render(container, {
        files: [{ id: 'a', name: 'alpha.js', path: 'src/alpha.js' }],
        expandedPaths: new Set(['src']),
        onFocus: row => events.push('focus:' + row.id),
        onInspect: row => events.push('inspect:' + row.id),
        onSelect: id => events.push('select:' + id),
        onDelete: row => events.push('delete:' + row.id)
    });
    const file = container.querySelector('[data-file-id="a"]');
    file.click();
    assert.deepEqual(events.slice(0, 3), ['focus:a', 'inspect:a', 'select:a']);
    container.querySelector('[data-file-id="a"] .pe-icon-btn--delete').click();
    assert.equal(events.at(-1), 'delete:a');
    view.destroy(container);
});

test('renomeação inline aceita texto, Enter e Escape sem executar seleção', () => {
    const { dom, view, container } = createHarness();
    const events = [];
    const files = [{ id: 'a', name: 'alpha.js', path: 'src/alpha.js' }];
    view.render(container, {
        files,
        expandedPaths: new Set(['src']),
        onStartRename: row => events.push('start:' + row.id),
        onRenameInput: value => events.push('input:' + value),
        onCommitRename: () => events.push('commit'),
        onCancelRename: () => events.push('cancel')
    });
    container.querySelector('[data-file-id="a"] .pe-file-name').dispatchEvent(new dom.window.MouseEvent('dblclick', { bubbles: true }));
    assert.deepEqual(events, ['start:a']);
    view.render(container, { files, expandedPaths: new Set(['src']), editingNodeId: 'a', renameValue: 'renamed.js',
        onRenameInput: value => events.push('input:' + value),
        onCommitRename: () => events.push('commit'),
        onCancelRename: () => events.push('cancel')
    });
    const input = container.querySelector('.pe-tree-input');
    input.value = 'renamed.js';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.ok(events.includes('input:renamed.js'));
    assert.ok(events.includes('cancel'));
    view.destroy(container);
});
