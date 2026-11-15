import { readFile, readdir } from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mocksDir = path.join(root, 'mocks');
const screenshotsDir = path.join(root, 'screenshots');

async function validate() {
    const htmlFiles = (await readdir(mocksDir)).filter(f => f.endsWith('.html')).sort();
    const pngFiles = (await readdir(screenshotsDir)).filter(f => f.endsWith('.png')).sort();

    console.log(`HTMLs: ${htmlFiles.length}`);
    console.log(`PNGs:  ${pngFiles.length}`);

    let ok = true;
    for (const html of htmlFiles) {
        const base = html.replace('.html', '');
        const png = `${base}.png`;
        const content = await readFile(path.join(mocksDir, html), 'utf8');

        const hasModal = content.includes('pe-modal-backdrop');
        const hasPanel = content.includes('pe-panel');
        const hasCss = content.includes('--pe-surface');
        const hasOverride = content.includes('MOCK OVERRIDES');
        const hasBody = content.length > 1000;

        const pngMatch = pngFiles.includes(png);

        const status = hasModal && hasPanel && hasCss && hasOverride && hasBody && pngMatch ? 'OK' : 'FALHA';
        if (status === 'FALHA') ok = false;

        console.log(`\n${html}`);
        console.log(`  Screenshot: ${pngMatch ? '✓' : '✗'} ${png}`);
        console.log(`  Modal: ${hasModal ? '✓' : '✗'}`);
        console.log(`  Panel: ${hasPanel ? '✓' : '✗'}`);
        console.log(`  CSS resolvido: ${hasCss ? '✓' : '✗'}`);
        console.log(`  Overrides: ${hasOverride ? '✓' : '✗'}`);
        console.log(`  Conteúdo substancial: ${hasBody ? '✓' : '✗'} (${content.length} bytes)`);
    }

    console.log(`\n${ok ? 'TODOS CONSISTENTES' : 'HÁ INCONSISTÊNCIAS'}`);
    process.exit(ok ? 0 : 1);
}

validate().catch(console.error);
