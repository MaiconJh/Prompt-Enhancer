// ===== src/anchor-extractor.js =====
// Description: Module for extraction, normalization and comparison of anchors for code identifiers.
// Interfaces:
//   Provides: extractAnchors, normalizeAnchor, compareAnchors, Anchor, ComparisonResult
//   Consumes: nothing (pure module)
// Interactions:
//   - Used by the deterministic validator (Phase 2) for lost anchor detection.

const ANCHOR_CATEGORIES = Object.freeze([
    'camelCase',
    'snake_case',
    'url',
    'placeholder',
    'code'
]);

// Delimiters that separate tokens (not part of identifiers)
// ':' and '/' are treated as non-delimiters inside URLs
const DELIMITERS = Object.freeze([
    ' ', '\t', '\n', '\r', '.', ',', ';', '!', '?', '(', ')',
    '[', ']', '{', '}', "'", '"', '\\', '|', '@',
    '#', '$', '%', '^', '&', '*', '+', '=', '~', '`'
]);

function _isDelimiter(ch) {
    return DELIMITERS.includes(ch);
}

// Unicode letter check: anything above ASCII 127 that is a letter
function _isUnicodeLetter(ch) {
    const code = ch.codePointAt(0);
    if (code == null || code <= 127) return false;
    // Basic Latin letters are A-Z a-z; everything above 127 that's a letter
    return (code >= 0xC0 && code <= 0xFF) || // Latin-1 Supplement
           (code >= 0x100 && code <= 0x24F) || // Latin Extended
           (code >= 0x370 && code <= 0x3FF) || // Greek
           (code >= 0x400 && code <= 0x4FF) || // Cyrillic
           (code >= 0x4E00 && code <= 0x9FFF) || // CJK
           (code >= 0xAC00 && code <= 0xD7AF) || // Hangul
           (code >= 0x0E00 && code <= 0x0E7F) || // Thai
           (code >= 0x0900 && code <= 0x097F); // Devanagari
}

function _isIdentifierStart(ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$' || _isUnicodeLetter(ch);
}

function _isIdentifierPart(ch) {
    return _isIdentifierStart(ch) || (ch >= '0' && ch <= '9');
}

function _isUrlStart(text, idx) {
    const slice = text.slice(idx, idx + 4).toLowerCase();
    return slice === 'http' || slice === 'www.';
}

function _extractUrl(text, idx) {
    let end = idx;
    while (end < text.length) {
        const ch = text[end];
        if (ch === ':' || ch === '/' || ch === '.') { end++; continue; }
        if (_isDelimiter(ch)) break;
        end++;
    }
    return text.slice(idx, end);
}

function _extractPlaceholder(text, idx) {
    const ch = text[idx];

    // {{name}}
    if (ch === '{' && text[idx + 1] === '{') {
        let end = idx + 2;
        while (end < text.length && !(text[end] === '}' && text[end + 1] === '}')) end++;
        if (end >= text.length - 1) return null;
        return text.slice(idx, end + 2);
    }

    // <name>
    if (ch === '<') {
        let end = idx + 1;
        while (end < text.length && text[end] !== '>') end++;
        if (end >= text.length) return null;
        return text.slice(idx, end + 1);
    }

    // {name}
    if (ch === '{') {
        const opening = '}';
        let end = idx + 1;
        while (end < text.length && text[end] !== opening) end++;
        if (end >= text.length) return null;
        return text.slice(idx, end + 1);
    }

    // [name]
    if (ch === '[') {
        const opening = ']';
        let end = idx + 1;
        while (end < text.length && text[end] !== opening) end++;
        if (end >= text.length) return null;
        return text.slice(idx, end + 1);
    }

    // ${name}
    if (ch === '$' && text[idx + 1] === '{') {
        let end = idx + 2;
        while (end < text.length && text[end] !== '}') end++;
        if (end >= text.length) return null;
        return text.slice(idx, end + 1);
    }

    return null;
}

// Code identifier: must look like code, not natural language.
// camelCase: starts lowercase, has uppercase inside.
// snake_case: has underscore, all lowercase.
// CONSTANT: all caps with underscores.
// mixedWithDigit: has digit beyond first char.
function _isLikelyCodeIdentifier(token) {
    if (token.length < 2) return false;
    // All-lowercase natural words without underscore or digit are NOT code
    const hasUnderscore = token.includes('_');
    const hasDigit = /\d/.test(token.slice(1));
    // PascalCase/camelCase: uppercase letter in the MIDDLE of the word
    // (ex: getUserById, UserService) — NOT just sentence-start capital (Melhore, Não)
    const hasMidUpper = /[A-Z]/.test(token.slice(1));
    const allLowerNoMarks = token === token.toLowerCase() && !hasUnderscore && !hasDigit;
    if (allLowerNoMarks) return false;
    // All-uppercase short words like API, HTTP are NOT anchors (too common)
    if (token.length <= 4 && token === token.toUpperCase() && !hasUnderscore && !hasDigit) return false;
    return hasMidUpper || hasUnderscore || hasDigit;
}

function _extractIdentifier(text, idx) {
    let end = idx;
    while (end < text.length && _isIdentifierPart(text[end])) end++;
    return text.slice(idx, end);
}

function _extractCamelCase(text, idx) {
    const id = _extractIdentifier(text, idx);
    if (id.length >= 2 && id[0] >= 'a' && id[0] <= 'z' && /[A-Z]/.test(id.slice(1))) {
        return id;
    }
    return null;
}

function _extractSnakeCase(text, idx) {
    const id = _extractIdentifier(text, idx);
    if (id.includes('_') && id === id.toLowerCase()) {
        return id;
    }
    return null;
}

function extractAnchors(text) {
    const anchors = [];
    let i = 0;
    while (i < text.length) {
        const ch = text[i];

        // URL
        if (_isUrlStart(text, i)) {
            const url = _extractUrl(text, i);
            anchors.push({ text: url, category: 'url', start: i, end: i + url.length });
            i += url.length;
            continue;
        }

        // Placeholder: {{name}}, <name>, {name}, [name], ${name}
        if (ch === '{' || ch === '[' || ch === '$' || ch === '<') {
            const ph = _extractPlaceholder(text, i);
            if (ph) {
                anchors.push({ text: ph, category: 'placeholder', start: i, end: i + ph.length });
                i += ph.length;
                continue;
            }
        }

        // Code identifier / camelCase / snake_case
        if (_isIdentifierStart(ch)) {
            const cc = _extractCamelCase(text, i);
            if (cc) {
                anchors.push({ text: cc, category: 'camelCase', start: i, end: i + cc.length });
                i += cc.length;
                continue;
            }
            const sc = _extractSnakeCase(text, i);
            if (sc) {
                anchors.push({ text: sc, category: 'snake_case', start: i, end: i + sc.length });
                i += sc.length;
                continue;
            }
            const id = _extractIdentifier(text, i);
            if (id.length >= 2 && _isLikelyCodeIdentifier(id)) {
                anchors.push({ text: id, category: 'code', start: i, end: i + id.length });
                i += id.length;
                continue;
            }
        }

        i++;
    }
    return anchors;
}

function normalizeAnchor(anchor) {
    return anchor.text;
}

function compareAnchors(originalAnchors, enhancedAnchors) {
    const enhancedTexts = new Set(enhancedAnchors.map(a => a.text));
    const preserved = [];
    const lost = [];

    for (const anchor of originalAnchors) {
        if (enhancedTexts.has(anchor.text)) {
            preserved.push(anchor);
        } else {
            lost.push(anchor);
        }
    }

    return { preserved, lost };
}

// Detect all scripts present in text, returns Set of script names
function _detectScripts(text) {
    if (!text || text.trim().length === 0) return new Set();
    const scripts = new Set();
    for (const ch of text) {
        const code = ch.codePointAt(0);
        if (code == null) continue;
        if (code <= 0x20 || (code >= 0x30 && code <= 0x39) || (code >= 0x21 && code <= 0x2F)) continue;
        if (code >= 0x3A && code <= 0x40) continue;
        if (code >= 0x5B && code <= 0x60) continue;
        if (code >= 0x7B && code <= 0x7E) continue;
        if (code >= 0x0041 && code <= 0x007A) scripts.add('Latin');
        else if (code >= 0x00C0 && code <= 0x00FF) scripts.add('Latin');
        else if (code >= 0x0100 && code <= 0x017F) scripts.add('Latin');
        else if (code >= 0x0180 && code <= 0x024F) scripts.add('Latin');
        else if (code >= 0x0400 && code <= 0x04FF) scripts.add('Cyrillic');
        else if (code >= 0x4E00 && code <= 0x9FFF) scripts.add('Han');
        else if (code >= 0x3040 && code <= 0x309F) scripts.add('Hiragana');
        else if (code >= 0x30A0 && code <= 0x30FF) scripts.add('Katakana');
        else if (code >= 0xAC00 && code <= 0xD7AF) scripts.add('Hangul');
        else if (code >= 0x0600 && code <= 0x06FF) scripts.add('Arabic');
        else if (code >= 0x0590 && code <= 0x05FF) scripts.add('Hebrew');
        else if (code >= 0x0900 && code <= 0x097F) scripts.add('Devanagari');
        else if (code >= 0x0E00 && code <= 0x0E7F) scripts.add('Thai');
    }
    return scripts;
}

globalThis.PE = globalThis.PE || {};
globalThis.PE.extractAnchors = extractAnchors;
globalThis.PE.normalizeAnchor = normalizeAnchor;
globalThis.PE.compareAnchors = compareAnchors;
globalThis.PE.ANCHOR_CATEGORIES = ANCHOR_CATEGORIES;
globalThis.PE.detectScripts = _detectScripts;