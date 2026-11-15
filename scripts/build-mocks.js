import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(root, '../src');
const outputDir = path.join(root, '../mocks');

const lean = process.argv.includes('--lean');
const tabArg = process.argv.find(arg => arg.startsWith('--tab='));
const allInOne = process.argv.includes('--all-in-one');
const tabsToGenerate = tabArg ? [tabArg.split('=')[1]] : ['params', 'context', 'systemPrompt', 'history', 'provider'];

const cssOverrides = `
/* MOCK OVERRIDES — apenas desativa motion; o layout vem do próprio CSS do sistema */
* { transition: none !important; animation: none !important; }
html, body { overflow: hidden !important; height: 100%; margin: 0; width: 100%; }
body { display: flex; align-items: center; justify-content: center; background: #000; }
.pe-modal-backdrop { align-items: center; justify-content: center; }
`;

const leanCss = `
/* MOCK LEAN - estrutura mínima, sem tokens do theme */
body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; }
.pe-scope { box-sizing: border-box; }
`;

async function generateMocks() {
    await mkdir(outputDir, { recursive: true });

    const manifestText = await readFile(path.join(root, '../manifest.json'), 'utf8');
    const manifest = JSON.parse(manifestText);

    const banner = await readFile(path.join(sourceDir, 'banner.js'), 'utf8');
    const open = await readFile(path.join(sourceDir, 'open.js'), 'utf8');
    const close = await readFile(path.join(sourceDir, 'close.js'), 'utf8');

    const modulesCode = [];
    for (const mod of manifest.modules) {
        modulesCode.push(await readFile(path.join(sourceDir, mod.file), 'utf8'));
    }

    const bundleStr = `
${open}
${modulesCode.join('\n\n')}

// Exposição para o mock builder (dentro do escopo do IIFE)
window.__PE_Molecules = Molecules;
window.__PE_ProviderRegistry = ProviderRegistry;
window.__PE_ProviderManager = ProviderManager;
window.__PE_injectStyles = injectStyles;

${close}
`;

    const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
        runScripts: "outside-only",
        url: "https://chat.deepseek.com/",
        pretendToBeVisual: true
    });
    const { window } = dom;

    // API mocks
    window.GM_getValue = (k, d) => d;
    window.GM_setValue = () => {};
    window.GM_deleteValue = () => {};
    window.GM_addStyle = (css) => { const s = window.document.createElement('style'); s.textContent = css; window.document.head.appendChild(s); return s; };
    window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.requestAnimationFrame = (cb) => cb();
    window.cancelAnimationFrame = () => {};

    window.navigator.clipboard = { writeText: async () => {} };

    // GSAP mock
    window.gsap = {
        fromTo: (el, from, to) => { if (to && to.onComplete) to.onComplete(); },
        to: (el, to) => { if (to && to.onComplete) to.onComplete(); },
        set: () => {},
        from: () => {}
    };

    // Layout shims for virtual list
    Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', { get() { return 100; }, configurable: true });
    Object.defineProperty(window.HTMLElement.prototype, 'clientHeight', { get() { return 600; }, configurable: true });
    Object.defineProperty(window.HTMLElement.prototype, 'scrollTop', { get() { return 0; }, set() {}, configurable: true });

    try {
        window.eval(banner + '\n' + bundleStr);
    } catch (e) {
        console.error('Erro ao executar bundle no JSDOM:', e);
        process.exit(1);
    }

    // Resolve CSS apenas no modo completo (não-lean).
    let resolvedCss = '';
    if (!lean) {
        try {
            window.__PE_injectStyles();
            const styleEl = window.document.getElementById('pe-core-styles');
            if (styleEl && styleEl.textContent) {
                resolvedCss = styleEl.textContent;
            }
        } catch (e) {
            console.warn('Não foi possível resolver o CSS via injectStyles():', e.message);
        }
    }

    const finalCss = lean ? leanCss : (resolvedCss + '\n' + cssOverrides);

    // Mock provider data — use the real STATIC_CATALOG instead of a reduced hardcoded list
    // so the mock matches the actual catalog rendered by ProviderRegistry.getCached().
    const catalog = window.__PE_ProviderRegistry.getCached();
    if (Array.isArray(catalog) && catalog.length) {
        const gemini = catalog.find((m) => m.providerId === 'gemini');
        const kilo = catalog.find((m) => m.providerId === 'kilo');
        if (gemini) {
            window.__PE_ProviderManager.getPinned = () => ({ id: gemini.id, label: gemini.label, modelId: gemini.modelId });
        }
        if (kilo) {
            window.__PE_ProviderManager.getFallback = () => ({ id: kilo.id, name: kilo.providerLabel, model: kilo.modelId });
        }
    }
    window.__PE_ProviderManager.getActive = () => {
        const catalog = window.__PE_ProviderRegistry.getCached();
        return Array.isArray(catalog) && catalog.length ? catalog[0] : null;
    };

    const renderSection = async (tab) => {
        window.document.body.innerHTML = '';
        try {
            window.__PE_Molecules.settingsModal({ initialTab: tab });
        } catch (err) {
            console.error(`Erro ao renderizar a aba ${tab}:`, err);
            return null;
        }
        await new Promise(r => setTimeout(r, 50));
        return window.document.body.innerHTML;
    };

    const buildHtml = (title, bodyHtml) => `<!DOCTYPE html>
<html lang="pt-BR" data-pe-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
${finalCss}
    </style>
</head>
<body>
    ${bodyHtml}
</body>
</html>`;

    const suffix = lean ? '-lean' : '';

    if (allInOne && !tabArg) {
        // Um único arquivo com todas as seções empilhadas.
        const sections = [];
        for (const tab of tabsToGenerate) {
            const html = await renderSection(tab);
            if (html) {
                sections.push(`<section id="pe-mock-${tab}" data-tab="${tab}">${html}</section>`);
            }
        }
        const bodyHtml = sections.join('\n');
        const outFile = path.join(outputDir, `mock-settings${suffix}.html`);
        await writeFile(outFile, buildHtml(`Mock - Todas as seções${lean ? ' (lean)' : ''}`, bodyHtml), 'utf8');
        console.log(`✓ Gerado: mocks/mock-settings${suffix}.html (${sections.length} seções)`);
    } else {
        // Um arquivo por seção (comportamento padrão do build:mocks).
        for (const tab of tabsToGenerate) {
            const html = await renderSection(tab);
            if (!html) continue;
            const outFile = path.join(outputDir, `mock-settings-${tab}${suffix}.html`);
            await writeFile(outFile, buildHtml(`Mock - ${tab}${lean ? ' (lean)' : ''}`, html), 'utf8');
            console.log(`✓ Gerado: mocks/mock-settings-${tab}${suffix}.html`);
        }
    }
}

generateMocks().catch(console.error);
