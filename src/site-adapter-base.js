// ===== src/site-adapter-base.js =====
// Contract: SiteAdapter — base de adaptadores de site com defaults seguros.
// Shape decidido em F0-T2: id, name, matches, findInput, findMountPoint, insertText, wrapContext, isValid.
// Default insertText delega Utils.applyText (lazy, para ordem de carga dos módulos).
const SiteAdapter = {
  create(spec) {
    if (!spec || typeof spec !== 'object') throw new Error('SiteAdapter.create: spec inválido');
    if (typeof spec.id !== 'string' || !spec.id) throw new Error('SiteAdapter.create: id obrigatório');
    if (typeof spec.name !== 'string' || !spec.name) throw new Error('SiteAdapter.create: name obrigatório');
    if (typeof spec.matches !== 'function') throw new Error('SiteAdapter.create: matches obrigatório');

    const adapter = {
      id: spec.id,
      name: spec.name,
      matches: spec.matches,
      findInput: typeof spec.findInput === 'function' ? spec.findInput : SiteAdapter.defaults.findInput,
      findMountPoint: typeof spec.findMountPoint === 'function' ? spec.findMountPoint : SiteAdapter.defaults.findMountPoint,
      insertText: typeof spec.insertText === 'function' ? spec.insertText : SiteAdapter.defaults.insertText,
      wrapContext: typeof spec.wrapContext === 'function' ? spec.wrapContext : SiteAdapter.defaults.wrapContext,
      isValid: typeof spec.isValid === 'function' ? spec.isValid : SiteAdapter.defaults.isValid,
      toString() { return `SiteAdapter(${this.id})`; }
    };
    return Object.freeze(adapter);
  },

defaults: {
        findInput(root = (typeof document !== 'undefined' ? document : null)) {
            if (!root) return null;
            const active = root.activeElement;
            if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT' || active.isContentEditable)) return active;
            if (root.querySelector) {
                return root.querySelector('textarea, input[type="text"], input[type="search"], [contenteditable="true"]') || null;
            }
            return null;
        },
        // Heurística genérica de montagem encapsulada no adaptador default (F2-T2).
        // Equivalente ao antigo Composer.findComposer — sem decisão específica de plataforma.
        findMountPoint(input) {
            if (!input) return null;
            let node = input;
            for (let i = 0; i < 6 && node; i++) {
                const style = getComputedStyle(node);
                const isColumn = style.display.includes('flex') && style.flexDirection === 'column';
                const isBlock = style.display === 'block' || style.display === 'flow-root';
                const isBody = node === document.body;
                if (!isBody && (isColumn || isBlock)) {
                    const hint = ((node.getAttribute('data-testid') || '') + ' ' + (typeof node.className === 'string' ? node.className : ''));
                    if (/composer|input|prompt|chat|editor/i.test(hint) || i >= 2) return node;
                }
                node = node.parentElement;
            }
            return input.parentElement || null;
        },
        insertText(input, text) {
            if (typeof Utils !== 'undefined' && typeof Utils.applyText === 'function') {
                Utils.applyText(input, text);
                return true;
            }
            return false;
        },
        wrapContext(body) {
            const b = body == null ? '' : String(body);
            return `--- Instruções do projeto ---\n${b}\n--- Fim das instruções do projeto ---`;
        },
        isValid(context) {
            return context && typeof context === 'object' && context.adapter != null;
        }
    }
};