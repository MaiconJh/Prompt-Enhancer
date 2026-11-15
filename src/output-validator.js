// ===== src/output-validator.js =====
// Description: Deterministic output validator for model responses.
// Detects: lost anchor, language/script change, meta comment.
// Interfaces:
//   Provides: validateOutput(originalText, enhancedText, lang?)
//   Consumes: extractAnchors, compareAnchors from globalThis.PE (anchor-extractor.js)
// Interactions:
//   - Used by orchestration (Phase 2) to validate outputs before applying.
//   - No hardcoded heuristics for specific languages (PT/EN).
//   - Language detection is generic by Unicode script (Latin, Cyrillic, CJK, Arabic, etc.).

// Universal meta-comment patterns (recognizable regardless of user language).
// Language models tend to emit these in English even when replying in another language.
const META_PATTERNS = [
    /as an (ai )?language model/i,
    /i am (an )?ai/i,
    /i cannot/i,
    /i can not/i,
    /i'm sorry/i,
    /i am sorry/i,
    /apologize/i,
    /i do not/i,
    /i don't/i,
    /as a model/i,
    /my training/i,
    /i do not have access/i
];

function _detectMetaComment(text) {
    return META_PATTERNS.some(p => p.test(text));
}

// Detects script change: returns true if original and enhanced share no script in common
function _scriptsChanged(originalText, enhancedText) {
    const origScripts = globalThis.PE.detectScripts(originalText);
    const enhScripts = globalThis.PE.detectScripts(enhancedText);
    if (origScripts.size === 0 || enhScripts.size === 0) return false;
    for (const s of origScripts) {
        if (enhScripts.has(s)) return false; // share at least one script -> no change
    }
    return true; // disjoint scripts -> language changed
}

function validateOutput(originalText, enhancedText, lang) {
    const violations = [];

    // 1. Detect lost anchor (generic — works for any language)
    const originalAnchors = globalThis.PE.extractAnchors(originalText);
    const enhancedAnchors = globalThis.PE.extractAnchors(enhancedText);
    const comparison = globalThis.PE.compareAnchors(originalAnchors, enhancedAnchors);

    if (comparison.lost.length > 0) {
        violations.push({
            type: 'lost_anchor',
            anchors: comparison.lost.map(a => a.text),
            message: 'Lost anchor(s): ' + comparison.lost.map(a => a.text).join(', ')
        });
    }

    // 2. Detect language/script change (generic by Unicode script, disjoint sets)
    if (_scriptsChanged(originalText, enhancedText)) {
        violations.push({
            type: 'language_change',
            message: 'Language/script change detected'
        });
    }

    // 3. Detect meta comment (generic — patterns in English recognizable by models)
    if (_detectMetaComment(enhancedText)) {
        violations.push({
            type: 'meta_comment',
            message: 'Meta comment detected in output'
        });
    }

    return {
        valid: violations.length === 0,
        violations
    };
}

globalThis.PE.validateOutput = validateOutput;