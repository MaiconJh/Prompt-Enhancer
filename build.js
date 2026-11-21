import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderModuleMetadata, STRUCTURAL_FILES, validateManifest } from './manifest-schema.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(root, 'src');
const outputDir = path.join(root, 'dist');
const outputFile = path.join(outputDir, 'prompt-enhancer.user.js');

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const packageVersion = packageJson.version;
const escapedVersion = packageVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const dev = process.argv.includes('--dev') || process.env.PE_DEV === '1';
const minifyCss = process.argv.includes('--minify-css') || process.env.PE_MINIFY_CSS === '1';

let manifest;
try {
    manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
    validateManifest(manifest);
} catch (error) {
    throw new Error(`Não foi possível ler manifest.json válido: ${error.message}`);
}

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
    throw new Error(`Conteúdo de src/ não corresponde ao manifest.json (${details}).`);
}

async function readSource(name) {
    return readFile(path.join(sourceDir, ...name.split('/')), 'utf8');
}

const banner = await readSource('banner.js');
function stripThirdPartyComments(source) {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
}
const finderModulePath = path.join(root, 'node_modules/find-file-icon/dist/create-finder-Blsbrr7E.js');
const finderDataPath = path.join(root, 'node_modules/find-file-icon/dist/icon-set/vscode-icons.js');
const finderSource = stripThirdPartyComments(await readFile(finderModulePath, 'utf8')).replace(/export\s*\{\s*createFinder as t\s*\};?/, '');
const finderDataSource = stripThirdPartyComments(await readFile(finderDataPath, 'utf8')).replace(/export\s*\{\s*vscodeIcons\s*\};?/, '');
const finderDataModule = await import(pathToFileURL(finderDataPath).href);
const vscodeIcons = finderDataModule.vscodeIcons;
const iconifySet = JSON.parse(await readFile(path.join(root, 'node_modules/@iconify-json/vscode-icons/icons.json'), 'utf8'));
const iconNames = new Set(['default-file', 'default-folder', 'default-folder-opened']);
for (const table of ['fileNames', 'fileExtensions', 'fileStems', 'languageIds']) {
    for (const name of Object.keys(vscodeIcons[table] || {})) iconNames.add('file-type-' + name);
}
for (const name of Object.keys(vscodeIcons.folderNames || {})) {
    iconNames.add('folder-type-' + name);
    iconNames.add('folder-type-' + name + '-opened');
}
function resolveIcon(name, seen = new Set()) {
    if (seen.has(name)) return null;
    seen.add(name);
    const direct = iconifySet.icons?.[name];
    if (direct) return direct;
    const alias = iconifySet.aliases?.[name];
    return alias ? resolveIcon(alias.parent, seen) : null;
}
const iconSvgMap = {};
for (const name of iconNames) {
    const icon = resolveIcon(name);
    if (icon?.body) iconSvgMap[name] = { width: icon.width || iconifySet.width || 16, height: icon.height || iconifySet.height || 16, body: icon.body };
}
const fileIconVendor = '(function(w){\n' + finderSource + '\n' + finderDataSource + '\nw.__PEFindFileIcon=createFinder(vscodeIcons);\nw.__PEFileIconSvg=' + JSON.stringify(iconSvgMap) + ';\n})(window);';
const findFileIconLicense = await readFile(path.join(root, 'node_modules/find-file-icon/LICENSE'), 'utf8');
const iconLicenseNotice = '/* Bundled third-party file icons: find-file-icon (Copyright (c) 2026 pengzhanbo) and vscode-icons (Copyright (c) vscode-icons contributors), MIT License.\n' + findFileIconLicense.trim() + '\n*/';
const treeVendor = `(function (w) {\n  var previousJQuery = w.jQuery;\n  var previousDollar = w.$;\n  var module, exports, define;\n  ${await readFile(path.join(root, 'node_modules/jquery/dist/jquery.min.js'), 'utf8')}\n  ${await readFile(path.join(root, 'node_modules/jstree/dist/jstree.min.js'), 'utf8')}\n  w.__PEJQuery = w.jQuery;\n  if (previousJQuery === undefined) delete w.jQuery; else w.jQuery = previousJQuery;\n  if (previousDollar === undefined) delete w.$; else w.$ = previousDollar;\n})(window);`;
const rawTreeCss = await readFile(path.join(root, 'node_modules/jstree/dist/themes/default/style.min.css'), 'utf8');
const treeCss = rawTreeCss.replace(/([^{}]+)\{/g, (rule, selector) => {
    const trimmed = selector.trim();
    if (!trimmed || trimmed.startsWith('@')) return rule;
    return trimmed.split(',').map(part => `.pe-workspace-host ${part.trim()}`).join(',') + '{';
}) + '.pe-workspace-host .pe-jstree-host{overflow:auto;position:relative}.pe-workspace-host .pe-jstree-host li{position:relative}.pe-workspace-host .pe-jstree-host .jstree-anchor{color:var(--pe-text-secondary);font:var(--pe-fw-regular) var(--pe-fs-base) var(--pe-font);height:22px;line-height:22px;padding:0 26px 0 2px;position:relative}.pe-workspace-host .pe-jstree-host .jstree-wholerow{height:22px}.pe-workspace-host .pe-jstree-host .jstree-wholerow-hovered{background:var(--pe-surface-2)}.pe-workspace-host .pe-jstree-host .jstree-wholerow-clicked{background:var(--pe-accent-soft)}.pe-workspace-host .pe-jstree-host .jstree-clicked{background:transparent;color:var(--pe-accent-text)}.pe-workspace-host .pe-jstree-host .jstree-icon.jstree-ocl{background:none!important;position:relative;width:18px}.pe-workspace-host .pe-jstree-host .jstree-icon.jstree-ocl:before{border-bottom:1.5px solid var(--pe-text-faint);border-right:1.5px solid var(--pe-text-faint);content:"";height:5px;left:5px;position:absolute;top:7px;transform:rotate(-45deg);width:5px}.pe-workspace-host .pe-jstree-host .jstree-leaf>.jstree-icon.jstree-ocl:before{display:none}.pe-workspace-host .pe-jstree-host .jstree-closed>.jstree-icon.jstree-ocl:before{transform:rotate(-45deg)}.pe-workspace-host .pe-jstree-host .jstree-open>.jstree-icon.jstree-ocl:before{transform:rotate(45deg);top:5px}.pe-workspace-host .pe-jstree-host .pe-file-icon{display:inline-flex;vertical-align:middle;width:16px;height:16px;margin-right:6px}.pe-workspace-host .pe-jstree-host .pe-file-icon svg{width:16px;height:16px}.pe-workspace-host .pe-jstree-host .pe-file-name{padding:0}.pe-workspace-host .pe-jstree-host .pe-jstree-delete{position:absolute;right:4px;top:2px;opacity:0;z-index:2}.pe-workspace-host .pe-jstree-host li:hover>.pe-jstree-delete,.pe-workspace-host .pe-jstree-host li.is-focused>.pe-jstree-delete{opacity:1}.pe-workspace-host .pe-jstree-host .pe-jstree-rename{height:20px;width:calc(100% - 24px);font:inherit;color:var(--pe-text);background:var(--pe-surface-3);border:1px solid var(--pe-accent);border-radius:3px}.pe-workspace-host .pe-jstree-host .pe-dirty-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--pe-warning);margin-left:6px;vertical-align:middle}';
const workspaceTreeOverrides = `.pe-workspace-host .pe-jstree-host>.jstree-container-ul{margin:0!important;padding:0!important}
.pe-workspace-host .pe-jstree-host .jstree-node{min-height:22px;line-height:22px;margin-left:0!important;min-width:0!important}
.pe-workspace-host .pe-jstree-host .jstree-node>.jstree-children{box-sizing:border-box;margin:0 0 0 9px!important;padding:0 0 0 9px!important;border-left:1px solid var(--pe-indent-guide)}
.pe-workspace-host .pe-jstree-host .jstree-anchor{border-radius:0;color:var(--pe-text-secondary);height:22px;line-height:22px;padding-left:4px;transition:background-color 100ms ease,color 100ms ease}
.pe-workspace-host .pe-jstree-host .jstree-anchor:hover{background:var(--pe-surface-2);color:var(--pe-text)}
.pe-workspace-host .pe-jstree-host .jstree-wholerow-clicked{background:var(--pe-accent-soft)}
.pe-workspace-host .pe-jstree-host .jstree-wholerow-hovered{background:var(--pe-surface-2)}
.pe-workspace-host .pe-jstree-host .jstree-clicked{color:var(--pe-accent-text)}
.pe-workspace-host .pe-jstree-host li.is-focused>.jstree-anchor{box-shadow:inset 0 0 0 1px var(--pe-accent-border)}
.pe-workspace-host .pe-jstree-host .jstree-icon.jstree-ocl{height:22px;flex:0 0 18px}
.pe-workspace-host .pe-jstree-host .pe-file-icon{margin-right:5px}
.pe-workspace-host .pe-jstree-host .jstree-hovered{background:transparent!important}
.pe-jstree-context-menu[hidden]{display:none!important}
.pe-jstree-context-menu{position:fixed;z-index:2147483647;display:flex;flex-direction:column;gap:2px;min-width:148px;padding:4px;border:1px solid var(--pe-border-strong);border-radius:7px;background:var(--pe-surface);box-shadow:var(--pe-shadow-2);color:var(--pe-text-secondary);font:var(--pe-fs-base) var(--pe-font)}
.pe-jstree-context-menu .pe-jstree-action{display:block;width:100%;padding:7px 10px;border:0;border-radius:4px;background:transparent;color:var(--pe-text-secondary);font:inherit;text-align:left;white-space:nowrap;cursor:pointer}
.pe-jstree-context-menu .pe-jstree-action:hover,.pe-jstree-context-menu .pe-jstree-action:focus-visible{outline:none;background:var(--pe-surface-2);color:var(--pe-text)}
.pe-jstree-context-menu .pe-jstree-action--delete:hover,.pe-jstree-context-menu .pe-jstree-action--delete:focus-visible{background:var(--pe-error-soft);color:var(--pe-error)}
`;

/**
 * Minifica cirurgicamente o objeto DICTS de src/i18n.js no bundle de build.
 * Mantém o source do repo legível (multilinha) e deixa o dist com o dicionário
 * em uma única linha (JSON compacto), sem dependências externas.
 * Usa o próprio parser V8 (new Function) para validar a sintaxe e JSON.stringify
 * para serializar de volta com segurança, evitando quebras de string por regex.
 */
function minifyDictionaries(source) {
    const marker = 'const DICTS = {';
    const startIndex = source.indexOf(marker);
    if (startIndex === -1) return source;

    let openBraces = 0;
    let endIndex = -1;

    // Encontra o fechamento exato do objeto DICTS contando as chaves
    for (let i = startIndex + marker.length - 1; i < source.length; i++) {
        if (source[i] === '{') openBraces++;
        else if (source[i] === '}') {
            openBraces--;
            if (openBraces === 0) {
                endIndex = i + 1;
                if (source[endIndex] === ';') endIndex++;
                break;
            }
        }
    }

    if (endIndex === -1) return source;

    // Extrai apenas o objeto literal { ... }
    const dictCode = source.substring(startIndex + 'const DICTS ='.length, endIndex - 1).trim();

    try {
        // Parser do próprio Node valida a sintaxe do objeto multilinha
        const dictObj = new Function(`return (${dictCode})`)();

        // JSON.stringify compacta tudo em uma linha e normaliza aspas/acentos
        const minifiedDict = `const DICTS = ${JSON.stringify(dictObj)};`;

        // Substitui o bloco original no source
        return source.substring(0, startIndex) + minifiedDict + source.substring(endIndex);
    } catch (e) {
        console.warn('[build] Falha ao minificar dicionários i18n:', e.message);
        return source;
    }
}

const open = await readSource('open.js');
const modules = await Promise.all(manifest.modules.map(async (module) => {
    let source = await readSource(module.file);

    // Minifica o bloco CSS do styles.js (mantém o source legível no repo).
    // Ative com --minify-css ou PE_MINIFY_CSS=1 (ex.: build de produção).
    // Colapsa apenas o interior de cada bloco { ... } (seletor + propriedades
    // em uma linha) e preserva quebras entre blocos/seções.
    if (module.file === 'styles.js' && minifyCss) {
        const match = source.match(/const css = `([\s\S]*)`;/);
        if (match) {
            let css = match[1]
                .replace(/\/\*[\s\S]*?\*\//g, '');            // remove comentários CSS
            css = css.replace(/\{([\s\S]*?)\}/g, (_m, body) => {
                const minBody = body
                    .replace(/\s+/g, ' ')
                    .replace(/\s*([{}:;,>+~\[\]()])\s*/g, '$1')
                    .replace(/;}\s*$/, '}')
                    .trim();
                return `{${minBody}}`;
            });
            source = source.replace(match[1], css.trim());
        }
    }

    // Minifica o bloco DICTS do i18n.js no build de produção.
    // Ativado por --minify-css, PE_MINIFY_CSS=1, --minify-i18n ou PE_MINIFY_I18N=1.
    if (module.file === 'i18n.js' && (minifyCss || process.argv.includes('--minify-i18n') || process.env.PE_MINIFY_I18N === '1')) {
        source = minifyDictionaries(source);
    }

    return `${renderModuleMetadata(module)}\n${source}`;
}));
const close = await readSource('close.js');
let bundle = `${banner}\n\n${iconLicenseNotice}\n${fileIconVendor}\n\n${treeVendor}\n\n${open}\n${modules.join('\n\n')}\n(function(){var s=document.createElement('style');s.id='pe-jstree-styles';s.textContent=${JSON.stringify(treeCss + workspaceTreeOverrides)};document.head.appendChild(s);}());\n${close}\n`;

await mkdir(outputDir, { recursive: true });

if (dev) {
    const timestamp = Date.now();
    bundle = bundle.replace(
        '// @run-at       document-idle',
        `// @updateURL   http://127.0.0.1:8787/prompt-enhancer.user.js\n// @downloadURL http://127.0.0.1:8787/prompt-enhancer.user.js\n// @run-at       document-idle`
    );
    const versionPattern = new RegExp('^(// @version\\s+)' + escapedVersion + '(\\s*)$', 'm');
    bundle = bundle.replace(versionPattern, `$1${packageVersion}-dev.${timestamp}$2`);
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
