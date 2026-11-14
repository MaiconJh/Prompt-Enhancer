import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderModuleMetadata, STRUCTURAL_FILES, validateManifest } from './manifest-schema.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.join(root, 'dist', 'prompt-enhancer.user.js');
const failures = [];
const sourceDir = path.join(root, 'src');

let manifest;
try {
    manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
    validateManifest(manifest);
} catch (error) {
    console.error(`Falha: manifest.json inválido: ${error.message}`);
    process.exit(1);
}

try {
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

const devMode = process.argv.includes('--dev') || process.env.PE_DEV === '1';

const firstLine = source.split(/\r?\n/, 1)[0];
if (firstLine === '// pe-dev-build') {
    if (!devMode) {
        console.error('detectado build de dev; rode `npm run build` (produção) antes de `npm run check`');
        process.exit(1);
    }
}

const bytes = Buffer.byteLength(source, 'utf8');
if (bytes <= 50 * 1024) failures.push(`Tamanho inválido: ${bytes} bytes (deve ser maior que 51200).`);

for (const module of manifest.modules) {
    const metadata = `${renderModuleMetadata(module)}\n// ===== src/${module.file} =====`;
    if (!source.includes(metadata)) {
        failures.push(`Metadados do módulo ${module.file} ausentes ou fora da posição esperada no bundle.`);
    }
}

const versionPattern = devMode
    ? /^\/\/ @version\s+1\.0\.0-dev\.\d+\s*$/m
    : /^\/\/ @version\s+1\.0\.0\s*$/m;

const requiredLines = [
    ['@name Prompt-Enhancer', /^\/\/ @name\s+Prompt-Enhancer\s*$/m],
    ['@version 1.0.0', versionPattern],
    ['@match *://chat.deepseek.com/*', /^\/\/ @match\s+\*:\/\/chat\.deepseek\.com\/\*\s*$/m],
    ['@grant GM_xmlhttpRequest', /^\/\/ @grant\s+GM_xmlhttpRequest\s*$/m],
    ['@connect *', /^\/\/ @connect\s+\*\s*$/m],
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
    'Theme', 'init'
];

for (const symbol of requiredSymbols) {
    if (!source.includes(symbol)) failures.push(`Símbolo ausente: ${symbol}.`);
}

const markerCount = (source.match(/^\/\/ ===== src\/[^/]+\.js =====$/gm) || []).length;
if (markerCount !== manifest.modules.length + STRUCTURAL_FILES.length) {
    failures.push(`Quantidade de marcadores inválida no bundle: ${markerCount} (esperado ${manifest.modules.length + STRUCTURAL_FILES.length}).`);
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
