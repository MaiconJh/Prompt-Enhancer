import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.dirname(fileURLToPath(import.meta.url));
const mocksDir = path.join(root, '../mocks');
const screenshotsDir = path.join(root, '../screenshots');

async function renderScreenshots() {
    await mkdir(screenshotsDir, { recursive: true });

    const files = (await readdir(mocksDir))
        .filter(f => f.endsWith('.html'))
        .sort();

    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
    });

    for (const file of files) {
        const filePath = path.join(mocksDir, file);
        const page = await context.newPage();
        await page.goto(`file://${filePath}`);
        await page.waitForTimeout(500);

        const outName = file.replace('.html', '.png');
        const outPath = path.join(screenshotsDir, outName);
        await page.screenshot({ path: outPath, fullPage: true });
        await page.close();
        console.log(`✓ Screenshot: screenshots/${outName}`);
    }

    await browser.close();
    console.log(`\n${files.length} screenshot(s) gerado(s) em screenshots/`);
}

renderScreenshots().catch(console.error);
