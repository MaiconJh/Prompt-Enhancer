import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(root, 'src');
const outputDir = path.join(root, 'dist');
const outputFile = path.join(outputDir, 'prompt-enhancer.user.js');

async function readSource(name) {
    return readFile(path.join(sourceDir, name), 'utf8');
}

const numberedModules = (await readdir(sourceDir))
    .filter((name) => /^\d{2}-.+\.js$/.test(name) && name !== '00-banner.js')
    .sort();

if (numberedModules.length === 0) {
    throw new Error('Nenhum módulo numerado encontrado em src/.');
}

const banner = await readSource('00-banner.js');
const open = await readSource('open.js');
const modules = await Promise.all(numberedModules.map(readSource));
const close = await readSource('close.js');
const bundle = `${banner}\n\n${open}\n${modules.join('\n\n')}\n${close}\n`;

await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, bundle, 'utf8');

const bytes = Buffer.byteLength(bundle, 'utf8');
const lines = bundle.split('\n').length - (bundle.endsWith('\n') ? 1 : 0);
console.log(`Build concluído: dist/prompt-enhancer.user.js`);
console.log(`Módulos: ${numberedModules.length}`);
console.log(`Tamanho: ${bytes} bytes`);
console.log(`Linhas: ${lines}`);
