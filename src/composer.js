// ===== src/composer.js =====
    const Composer = (() => {
        const mounted = new WeakSet();
        function findComposer(input) {
            // DEPRECADO: delega ao adaptador genérico (F2-T2). Mantido para compatibilidade.
            const adapter = (typeof SiteAdapterRegistry !== 'undefined')
                ? SiteAdapterRegistry.getAdapter({ hostname: (location.hostname || '').toLowerCase(), href: location.href, pathname: location.pathname || '' })
                : null;
            if (adapter && typeof adapter.findMountPoint === 'function') return adapter.findMountPoint(input);
            // Fallback inline (mesma heurística do default do adaptador)
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
        }
        function findAnchor(composer, input) {
            let anchor = input;
            while (anchor.parentElement && anchor.parentElement !== composer) anchor = anchor.parentElement;
            return anchor.parentElement === composer ? anchor : null;
        }
        function mount(input, handlers) {
            const composer = findComposer(input);
            if (!composer || mounted.has(composer)) return null;
            const root = document.createElement('div');
            root.className = 'pe-mount pe-scope';
            root.setAttribute('data-pe-owner', Utils.uid());
            const bar = Molecules.actionBar(handlers);
            root.appendChild(bar.root);
            Utils.shieldFromHost(root);
            const anchor = findAnchor(composer, input);
            if (anchor) composer.insertBefore(root, anchor);
            else composer.insertBefore(root, composer.firstChild);
            mounted.add(composer);
            Anim.barIn(root);
            return {
                mount: root, actionbar: bar, composer,
                destroy(afterRemoved) { mounted.delete(composer); try { bar.destroy?.(); } catch (_) {} Anim.barOut(root, afterRemoved); }
            };
        }
        return { find: findComposer, mount, isMounted: (c) => mounted.has(c) };
    })();

