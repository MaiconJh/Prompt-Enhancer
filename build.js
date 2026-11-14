import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderModuleMetadata, STRUCTURAL_FILES, validateManifest } from './manifest-schema.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(root, 'src');
const outputDir = path.join(root, 'dist');
const outputFile = path.join(outputDir, 'prompt-enhancer.user.js');

const dev = process.argv.includes('--dev') || process.env.PE_DEV === '1';
const minifyCss = process.argv.includes('--minify-css') || process.env.PE_MINIFY_CSS === '1';

let manifest;
try {
    manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
    validateManifest(manifest);
} catch (error) {
    throw new Error(`Não foi possível ler manifest.json válido: ${error.message}`);
}

const expectedFiles = [...STRUCTURAL_FILES, ...manifest.modules.map(({ file }) => file)].sort();
const actualFiles = (await readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
const missingFiles = expectedFiles.filter((name) => !actualFiles.includes(name));
const extraFiles = actualFiles.filter((name) => !expectedFiles.includes(name));
if (missingFiles.length || extraFiles.length) {
    const details = [
        missingFiles.length ? `ausentes: ${missingFiles.join(', ')}` : '',
        extraFiles.length ? `inesperados: ${extraFiles.join(', ')}` : ''
    ].filter(Boolean).join('; ');
    throw new Error(`Conteúdo de src/ não corresponde ao manifest.json (${details}).`);
}

async function readSource(name) {
    return readFile(path.join(sourceDir, name), 'utf8');
}

const banner = await readSource('banner.js');
const open = await readSource('open.js');
const modules = await Promise.all(manifest.modules.map(async (module) => {
    let source = await readSource(module.file);

    // Minifica o bloco CSS do styles.js (mantém o source legível no repo).
    // Ative com --minify-css ou PE_MINIFY_CSS=1 (ex.: build de produção).
    if (module.file === 'styles.js' && minifyCss) {
        const match = source.match(/const css = `([\s\S]*)`;/);
        if (match) {
            const minified = match[1]
                .replace(/\/\*[\s\S]*?\*\//g, '')          // remove comentários CSS
                .replace(/\s+/g, ' ')                      // colapsa whitespace
                .replace(/\s*([{}:;,>+~\[\]()])\s*/g, '$1') // remove espaço ao redor de tokens
                .replace(/;}/g, '}')                        // remove ; antes de }
                .trim();
            source = source.replace(match[1], minified);
        }
    }

    return `${renderModuleMetadata(module)}\n${source}`;
}));
const close = await readSource('close.js');
let bundle = `${banner}\n\n${open}\n${modules.join('\n\n')}\n${close}\n`;

await mkdir(outputDir, { recursive: true });

if (dev) {
    const timestamp = Date.now();
    bundle = bundle.replace(
        '// @run-at       document-idle',
        `// @updateURL   http://127.0.0.1:8787/prompt-enhancer.user.js\n// @downloadURL http://127.0.0.1:8787/prompt-enhancer.user.js\n// @run-at       document-idle`
    );
    bundle = bundle.replace(/^(\/\/ @version\s+)1\.0\.0(\s*)$/m, `$11.0.0-dev.${timestamp}$2`);
    bundle = `// pe-dev-build\n${bundle}`;
    console.log(`[build:dev] updateURL + version bump ${new Date().toISOString()}`);
}

if (minifyCss) {
    console.log('[build:css] minificação do styles.js ativada');
}

await writeFile(outputFile, bundle, 'utf8');

const bytes = Buffer.byteLength(bundle, 'utf8');
const lines = bundle.split('\n').length - (bundle.endsWith('\n') ? 1 : 0);
console.log('Build concluído: dist/prompt-enhancer.user.js');
console.log(`Módulos: ${manifest.modules.length}`);
console.log(`Tamanho: ${bytes} bytes`);
console.log(`Linhas: ${lines}`);
