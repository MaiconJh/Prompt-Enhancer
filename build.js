import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(root, 'src');
const outputDir = path.join(root, 'dist');
const outputFile = path.join(outputDir, 'prompt-enhancer.user.js');
const structuralFiles = ['banner.js', 'open.js', 'close.js'];

function validateManifest(manifest) {
    if (!Array.isArray(manifest) || manifest.length === 0 || !manifest.every((name) => typeof name === 'string')) {
        throw new Error('manifest.json deve conter um array não vazio de strings.');
    }
    if (new Set(manifest).size !== manifest.length) {
        throw new Error('manifest.json contém nomes de módulos duplicados.');
    }
    if (manifest.some((name) => !name || path.basename(name) !== name || !name.endsWith('.js') || structuralFiles.includes(name))) {
        throw new Error('manifest.json deve listar apenas nomes de módulos .js, sem caminhos ou arquivos estruturais.');
    }
}

let manifest;
try {
    manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
} catch (error) {
    throw new Error(`Não foi possível ler manifest.json válido: ${error.message}`);
}
validateManifest(manifest);

const expectedFiles = [...structuralFiles, ...manifest].sort();
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
const modules = await Promise.all(manifest.map(readSource));
const close = await readSource('close.js');
const bundle = `${banner}\n\n${open}\n${modules.join('\n\n')}\n${close}\n`;

await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, bundle, 'utf8');

const bytes = Buffer.byteLength(bundle, 'utf8');
const lines = bundle.split('\n').length - (bundle.endsWith('\n') ? 1 : 0);
console.log('Build concluído: dist/prompt-enhancer.user.js');
console.log(`Módulos: ${manifest.length}`);
console.log(`Tamanho: ${bytes} bytes`);
console.log(`Linhas: ${lines}`);
