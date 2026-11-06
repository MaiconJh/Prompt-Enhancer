// ===== src/11-stream-parser-anim.js =====
    const StreamParser = (() => {
        function create() {
            let buffer = '', doneEmitted = false;
            function feed(delta) {
                if (!delta) return [];
                buffer += delta;
                const events = [];
                let idx;
                while ((idx = buffer.indexOf('\n\n')) !== -1) {
                    const chunk = buffer.slice(0, idx);
                    buffer = buffer.slice(idx + 2);
                    for (const line of chunk.split('\n')) {
                        const t = line.trim();
                        if (!t || !t.startsWith('data:')) continue;
                        const data = t.slice(5).trim();
                        if (data === '[DONE]') { if (!doneEmitted) { events.push({ type: 'done' }); doneEmitted = true; } continue; }
                        let parsed;
                        try { parsed = JSON.parse(data); } catch (_) { continue; }
                        const choice = parsed?.choices?.[0];
                        if (parsed?.usage) events.push({ type: 'usage', usage: parsed.usage });
                        if (!choice) continue;
                        const deltaObj = choice.delta;
                        if (deltaObj && typeof deltaObj.content === 'string' && deltaObj.content.length) events.push({ type: 'token', text: deltaObj.content });
                        if (choice.finish_reason) events.push({ type: 'finish', reason: choice.finish_reason });
                    }
                }
                return events;
            }
            return { feed };
        }
        return { create };
    })();

    const Anim = (() => {
        const hasGsap = typeof window.gsap !== 'undefined';
        const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const dur = (d) => reduced() ? 0.001 : d;
        const enabled = () => hasGsap && !reduced();
        if (hasGsap && window.gsap.ticker) window.gsap.ticker.lagSmoothing(200, 33);
        const fadeIn = (el, opts = {}) => { if (!el) return Promise.resolve(); if (!enabled()) { el.style.opacity = '1'; return Promise.resolve(); } return new Promise(r => window.gsap.fromTo(el, { autoAlpha: 0, y: opts.y ?? 8 }, { autoAlpha: 1, y: 0, duration: dur(opts.duration ?? DUR.base), ease: opts.ease ?? EASE.enter, onComplete: r })); };
        const panelIn = (el, opts = {}) => { if (!el) return Promise.resolve(); if (!enabled()) { el.style.opacity = '1'; return Promise.resolve(); } return new Promise(r => window.gsap.fromTo(el, { autoAlpha: 0, y: opts.y ?? 6 }, { autoAlpha: 1, y: 0, duration: dur(opts.duration ?? DUR.base), ease: opts.ease ?? EASE.enter, onComplete: r })); };
        const panelOut = (el, opts = {}) => { if (!el) return Promise.resolve(); if (!enabled()) { el.style.opacity = '0'; return Promise.resolve(); } return new Promise(r => window.gsap.to(el, { autoAlpha: 0, y: opts.y ?? 4, duration: dur(opts.duration ?? DUR.fast), ease: opts.ease ?? EASE.exit, onComplete: r })); };
        const shake = (el) => { if (!el || !enabled()) return; window.gsap.fromTo(el, { x: -2 }, { x: 2, duration: 0.06, yoyo: true, repeat: 5, ease: 'power1.inOut', onComplete: () => window.gsap.set(el, { x: 0 }) }); };
        const staggerIn = (parent, step = 0.04) => { if (!parent || !enabled()) return Promise.resolve(); const kids = Array.from(parent.children); return new Promise(r => window.gsap.fromTo(kids, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power2.out', stagger: dur(step), onComplete: r })); };
        const typewriter = (el, opts = {}) => { if (!el) return Promise.resolve(); if (!enabled()) { el.style.clipPath = 'none'; return Promise.resolve(); } return new Promise(r => window.gsap.fromTo(el, { clipPath: 'inset(0 100% 0 0)', opacity: 1 }, { clipPath: 'inset(0 0% 0 0)', duration: dur(opts.duration ?? 0.85), ease: 'power2.inOut', onComplete: r })); };
        const toastIn = (el) => { if (!el || !enabled()) { if (el) el.style.opacity = '1'; return; } window.gsap.fromTo(el, { autoAlpha: 0, y: 16, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: dur(DUR.base), ease: EASE.spring }); };
        const toastOut = (el, done) => { if (!el) { done?.(); return; } if (!enabled()) { el.remove(); done?.(); return; } window.gsap.to(el, { autoAlpha: 0, y: 12, duration: dur(DUR.fast), ease: EASE.exit, onComplete: () => { el.remove(); done?.(); } }); };
        const barIn = (el) => { if (!el || !enabled()) return; window.gsap.fromTo(el, { autoAlpha: 0, y: -6, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: dur(DUR.slow), ease: EASE.enter }); };
        const barOut = (el, done) => { if (!el) { done?.(); return; } if (!enabled()) { el.remove(); done?.(); return; } window.gsap.to(el, { autoAlpha: 0, y: -6, scale: 0.985, duration: dur(DUR.fast), ease: EASE.exit, onComplete: () => { el.remove(); done?.(); } }); };
        const hoverIn = (el) => { if (el && enabled()) window.gsap.to(el, { y: -1, duration: 0.15, ease: 'power2.out', overwrite: 'auto' }); };
        const hoverOut = (el) => { if (el && enabled()) window.gsap.to(el, { y: 0, duration: 0.15, ease: 'power2.out', overwrite: 'auto' }); };
        const press = (el) => { if (!el || !enabled()) return; window.gsap.fromTo(el, { scale: 1 }, { scale: 0.97, duration: 0.08, ease: 'power2.out', onComplete: () => window.gsap.to(el, { scale: 1, duration: 0.14, ease: EASE.spring }) }); };
        const pulseSuccess = (el) => { if (!el || !enabled()) return; window.gsap.fromTo(el, { boxShadow: '0 0 0 0 rgba(16,163,127,.45)' }, { boxShadow: '0 0 0 12px rgba(16,163,127,0)', duration: 0.7, ease: 'power2.out' }); };
        const pulseSuccessClass = (el) => { if (!el) return; el.classList.add('is-new'); setTimeout(() => el.classList.remove('is-new'), 800); };
        return { enabled, reduced, hasGsap, fadeIn, panelIn, panelOut, shake, staggerIn, typewriter, toastIn, toastOut, barIn, barOut, hoverIn, hoverOut, press, pulseSuccess, pulseSuccessClass };
    })();

