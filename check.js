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
    async function collectSourceFiles(prefix = '') {
        const directory = prefix ? path.join(sourceDir, ...prefix.split('/')) : sourceDir;
        const entries = await readdir(directory, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                if (relative === 'tests') continue;
                files.push(...await collectSourceFiles(relative));
            } else if (entry.isFile()) files.push(relative);
        }
        return files;
    }
    const expectedFiles = [...STRUCTURAL_FILES, ...manifest.modules.map(({ file }) => file)].sort();
    const actualFiles = (await collectSourceFiles()).sort();
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
            const firstLine = (await readFile(path.join(sourceDir, ...name.split('/')), 'utf8')).split(/\r?\n/, 1)[0];
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

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const escapedVersion = packageJson.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const versionPattern = devMode
    ? new RegExp('^// @version\\s+' + escapedVersion + '-dev\\.\\d+\\s*$', 'm')
    : new RegExp('^// @version\\s+' + escapedVersion + '\\s*$', 'm');

const requiredLines = [
    ['@name Prompt-Enhancer', /^\/\/ @name\s+Prompt-Enhancer\s*$/m],
    [`@version ${packageJson.version}`, versionPattern],
    ['@match *://chat.deepseek.com/*', /^\/\/ @match\s+\*:\/\/chat\.deepseek\.com\/\*\s*$/m],
    ['@grant GM_xmlhttpRequest', /^\/\/ @grant\s+GM_xmlhttpRequest\s*$/m],
    ['@require GSAP', /^\/\/ @require\s+https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/3\.12\.5\/gsap\.min\.js#sha256=[A-Za-z0-9+/=]+\s*$/m]
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
    'Theme', 'WorkspaceModel', 'WorkspaceStorage', 'ProjectManager', 'FileRegistry', 'Workspace', 'init'
];

for (const symbol of requiredSymbols) {
    if (!source.includes(symbol)) failures.push(`Símbolo ausente: ${symbol}.`);
}

// Verificação: todo host em BUILTIN_HOSTS deve ter @connect correspondente no banner
const builtinHostsMatch = source.match(/BUILTIN_HOSTS\s*=\s*\[\s*([^\]]+)\s*\]/);
if (builtinHostsMatch) {
    const builtinHosts = builtinHostsMatch[1]
        .split(',')
        .map(h => h.replace(/['"]/g, '').trim())
        .filter(Boolean);
    const connectLines = source.match(/^\/\/ @connect\s+(\S+)/gm) || [];
    const connectHosts = connectLines.map(l => l.replace(/^\/\/ @connect\s+/, '').trim());
    for (const host of builtinHosts) {
        if (!connectHosts.includes(host)) {
            failures.push(`BUILTIN_HOST '${host}' não tem @connect correspondente no banner.`);
        }
    }
}

// Verificação: todo @grant GM_* declarado deve ter pelo menos um uso no código
const grantDeclares = source.match(/^\/\/ @grant\s+(GM_\w+)/gm) || [];
const declaredGrants = grantDeclares.map(l => l.match(/^\/\/ @grant\s+(GM_\w+)/)[1]);
const codeWithoutGrants = source.replace(/^\/\/ @grant\s+GM_\w+.*$/gm, '').replace(/^\/\/.*$/gm, '');
for (const grant of declaredGrants) {
    const usageRegex = new RegExp(`\\b${grant}\\b`, 'g');
    const usages = (codeWithoutGrants.match(usageRegex) || []).length;
    if (usages === 0) {
        failures.push(`@grant '${grant}' declarado mas não usado no código (superfície de ataque desnecessária).`);
    }
}

const markerCount = (source.match(/^\/\/ ===== src\/.+\.js =====$/gm) || []).length;
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
