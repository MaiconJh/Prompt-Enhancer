import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.join(root, 'dist', 'prompt-enhancer.user.js');
const failures = [];
const sourceDir = path.join(root, 'src');
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
    validateManifest(manifest);
} catch (error) {
    console.error(`Falha: manifest.json inválido: ${error.message}`);
    process.exit(1);
}

try {
    const expectedFiles = [...structuralFiles, ...manifest].sort();
    const actualFiles = (await readdir(sourceDir)).sort();
    const missingFiles = expectedFiles.filter((name) => !actualFiles.includes(name));
    const extraFiles = actualFiles.filter((name) => !expectedFiles.includes(name));
    if (missingFiles.length || extraFiles.length) {
        const details = [
            missingFiles.length ? `ausentes: ${missingFiles.join(', ')}` : '',
            extraFiles.length ? `inesperados: ${extraFiles.join(', ')}` : ''
        ].filter(Boolean).join('; ');
        failures.push(`Conteúdo de src/ não corresponde ao manifest.json (${details}).`);
    } else {
        for (const name of expectedFiles) {
            const firstLine = (await readFile(path.join(sourceDir, name), 'utf8')).split(/\r?\n/, 1)[0];
            if (firstLine !== `// ===== src/${name} =====`) {
                failures.push(`Marcador inválido em src/${name}: esperado "// ===== src/${name} =====".`);
            }
        }
    }
} catch (error) {
    failures.push(`Falha ao validar src/ contra manifest.json: ${error.message}`);
}

let source;
try {
    await stat(bundlePath);
    source = await readFile(bundlePath, 'utf8');
} catch (error) {
    console.error(`Falha: dist/prompt-enhancer.user.js não existe ou não pode ser lido: ${error.message}`);
    process.exit(1);
}

const bytes = Buffer.byteLength(source, 'utf8');
if (bytes <= 50 * 1024) failures.push(`Tamanho inválido: ${bytes} bytes (deve ser maior que 51200).`);

const requiredLines = [
    ['@name Prompt-Enhancer', /^\/\/ @name\s+Prompt-Enhancer\s*$/m],
    ['@version 1.0.0', /^\/\/ @version\s+1\.0\.0\s*$/m],
    ['@match *://chat.deepseek.com/*', /^\/\/ @match\s+\*:\/\/chat\.deepseek\.com\/\*\s*$/m],
    ['@grant GM_xmlhttpRequest', /^\/\/ @grant\s+GM_xmlhttpRequest\s*$/m],
    ['@require GSAP', /^\/\/ @require\s+https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/3\.12\.5\/gsap\.min\.js\s*$/m]
];

for (const [label, pattern] of requiredLines) {
    if (!pattern.test(source)) failures.push(`Banner ausente ou inválido: ${label}.`);
}

const requiredSymbols = [
    'CONFIG', 'HostShield', 'Utils', 'Providers', 'ProjectContext', 'NetError',
    'ErrorIndexer', 'EnhancementHistory', 'RateLimiter', 'ParamSchema',
    'SystemPromptManager', 'StreamParser', 'Anim', 'GEAR_STATES', 'createGear',
    'injectStyles', 'ICONS', 'Atoms', 'codeAttachment', 'contextPopover', 'State',
    'settingsModal', 'wireOverlayToEvents', 'Molecules', 'ApiClient', 'Composer',
    'init'
];

for (const symbol of requiredSymbols) {
    if (!source.includes(symbol)) failures.push(`Símbolo ausente: ${symbol}.`);
}

const markerCount = (source.match(/^\/\/ ===== src\/[^/]+\.js =====$/gm) || []).length;
if (markerCount !== manifest.length + 3) {
    failures.push(`Quantidade de marcadores inválida no bundle: ${markerCount} (esperado ${manifest.length + 3}).`);
}

const syntax = spawnSync(process.execPath, ['--check', bundlePath], {
    cwd: root,
    encoding: 'utf8'
});
if (syntax.error) {
    failures.push(`Não foi possível executar node --check: ${syntax.error.message}`);
} else if (syntax.status !== 0) {
    failures.push(`node --check falhou:\n${syntax.stderr || syntax.stdout}`);
}

if (failures.length) {
    console.error('Verificação falhou:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
}

console.log('Verificação aprovada:');
console.log(`- Arquivo presente (${bytes} bytes, > 51200).`);
console.log('- Banner e metadata obrigatórios presentes.');
console.log(`- src/ consistente com manifest.json; ${markerCount} marcadores corretos.`);
console.log(`- ${requiredSymbols.length} símbolos-chave presentes.`);
console.log('- node --check aprovado.');
