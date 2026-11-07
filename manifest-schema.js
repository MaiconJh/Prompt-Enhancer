export const STRUCTURAL_FILES = Object.freeze(['banner.js', 'open.js', 'close.js']);

function isSingleLineText(value) {
    return typeof value === 'string' && value.trim().length > 0 && !/[\r\n\u2028\u2029]/.test(value);
}

function isStringList(value, { allowEmpty = true } = {}) {
    return Array.isArray(value)
        && (allowEmpty || value.length > 0)
        && value.every(isSingleLineText);
}

export function validateManifest(manifest) {
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)
        || !Array.isArray(manifest.modules) || manifest.modules.length === 0) {
        throw new Error('manifest.json deve conter um objeto com um array não vazio "modules".');
    }

    const files = [];
    for (const [index, module] of manifest.modules.entries()) {
        if (!module || typeof module !== 'object' || Array.isArray(module)) {
            throw new Error(`Módulo ${index + 1} deve ser um objeto.`);
        }
        const { file, description, interfaces, interactions } = module;
        if (typeof file !== 'string' || !file || pathBasename(file) !== file
            || !file.endsWith('.js') || STRUCTURAL_FILES.includes(file)) {
            throw new Error(`Módulo ${index + 1} deve ter um nome de arquivo .js sem caminho ou arquivo estrutural.`);
        }
        if (!isSingleLineText(description)) {
            throw new Error(`Módulo ${file} deve ter uma "description" de uma linha.`);
        }
        if (!interfaces || typeof interfaces !== 'object' || Array.isArray(interfaces)
            || !isStringList(interfaces.provides)
            || !isStringList(interfaces.consumes)) {
            throw new Error(`Módulo ${file} deve declarar "interfaces.provides" e "interfaces.consumes" como arrays de textos.`);
        }
        if (!isStringList(interactions, { allowEmpty: false })) {
            throw new Error(`Módulo ${file} deve declarar "interactions" como um array não vazio de textos.`);
        }
        files.push(file);
    }

    if (new Set(files).size !== files.length) {
        throw new Error('manifest.json contém nomes de módulos duplicados.');
    }
}

function pathBasename(file) {
    return file.split(/[\\/]/).pop();
}

export function renderModuleMetadata(module) {
    const provides = module.interfaces.provides.join(', ') || 'none';
    const consumes = module.interfaces.consumes.join(', ') || 'none';
    const interactions = module.interactions.map((interaction) => `//   - ${interaction}`).join('\n');
    return [
        `// ===== Module: ${module.file} =====`,
        `// Description: ${module.description}`,
        '// Interfaces:',
        `//   Provides: ${provides}`,
        `//   Consumes: ${consumes}`,
        '// Interactions:',
        interactions
    ].join('\n');
}
