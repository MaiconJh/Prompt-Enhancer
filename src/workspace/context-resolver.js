// ===== src/workspace/context-resolver.js =====
// Read-only project context discovery. This module never mutates Workspace data.
const ContextResolver = (() => {
    const DEFAULTS = Object.freeze({
        maxFiles: 12,
        maxExcerptsPerFile: 3,
        maxExcerptLines: 18,
        maxContextBytes: 48 * 1024,
        minScore: 2
    });
    const STOP_WORDS = new Set([
        'a','o','as','os','um','uma','uns','umas','de','da','do','das','dos','em','no','na','nos','nas',
        'por','para','com','sem','sobre','entre','que','qual','quais','como','onde','quando','e','ou',
        'the','a','an','and','or','of','to','in','on','for','with','from','by','is','are','be','this',
        'that','it','how','what','which','where','when'
    ]);

    function normalize(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase()
            .replace(/[^\p{L}\p{N}_./-]+/gu, ' ')
            .trim();
    }

    function tokenize(value) {
        return [...new Set(normalize(value).split(/\s+/).filter(token =>
            token.length > 1 && !STOP_WORDS.has(token)
        ))];
    }

    function escapeRegExp(value) {
        return String(value).replace(/[.*+?^$()|[\]{}\\]/g, '\\$&');
    }

    function matchesPattern(path, pattern) {
        const value = String(path || '');
        const source = String(pattern || '').trim();
        if (!source) return false;
        let regex = '';
        for (let index = 0; index < source.length; index++) {
            const char = source[index];
            if (char === '*' && source[index + 1] === '*') {
                if (source[index + 2] === '/') {
                    regex += '(?:.*/)?';
                    index += 2;
                } else {
                    regex += '.*';
                    index++;
                }
            } else if (char === '*') regex += '[^/]*';
            else if (char === '?') regex += '[^/]';
            else regex += escapeRegExp(char);
        }
        try { return new RegExp('^' + regex + '$').test(value); }
        catch (_) { return false; }
    }

    function matchesAnyPattern(path, patterns) {
        return !Array.isArray(patterns) || patterns.length === 0
            || patterns.some(pattern => matchesPattern(path, pattern));
    }

    function scoreFile(file, content, query, terms) {
        const path = normalize(file.path || file.name);
        const name = normalize(file.name || (file.path || '').split('/').pop());
        const body = normalize(content);
        let score = 0;
        const reasons = [];

        if (path.includes(query)) {
            score += 12;
            reasons.push('path-phrase');
        } else if (name.includes(query)) {
            score += 12;
            reasons.push('name-phrase');
        }

        for (const term of terms) {
            if (name.includes(term)) {
                score += 8;
                reasons.push('filename:' + term);
            } else if (path.includes(term)) {
                score += 4;
                reasons.push('path:' + term);
            }
            const identifierPattern = new RegExp('(^|[^\\p{L}\\p{N}])' + escapeRegExp(term) + '([^\\p{L}\\p{N}]|$)', 'gu');
            const identifierMatches = [...body.matchAll(identifierPattern)].length;
            const broadMatches = body.split(term).length - 1;
            const occurrences = Math.min(identifierMatches + Math.max(0, broadMatches - identifierMatches), 8);
            if (occurrences) {
                score += identifierMatches ? 3 : Math.min(occurrences, 5);
                reasons.push('content:' + term);
            }
        }
        if (terms.length > 1 && terms.every(term => body.includes(term))) {
            score += 10;
            reasons.push('all-terms');
        }
        return { score, reasons: [...new Set(reasons)] };
    }

    function makeExcerpts(content, terms, options) {
        const lines = String(content).split(/\r?\n/);
        const normalizedLines = lines.map(normalize);
        const matched = [];
        for (let i = 0; i < lines.length; i++) {
            if (terms.some(term => normalizedLines[i].includes(term))) matched.push(i);
        }
        if (!matched.length) {
            const limit = Math.min(lines.length, options.maxExcerptLines);
            return limit ? [{ startLine: 1, endLine: limit, content: lines.slice(0, limit).join('\n') }] : [];
        }
        const ranges = [];
        for (const lineIndex of matched) {
            const start = Math.max(0, lineIndex - 3);
            const end = Math.min(lines.length - 1, start + options.maxExcerptLines - 1);
            const previous = ranges[ranges.length - 1];
            if (previous && start <= previous.end + 2) previous.end = Math.min(previous.start + options.maxExcerptLines - 1, Math.max(previous.end, end));
            else ranges.push({ start, end });
        }
        return ranges.slice(0, options.maxExcerptsPerFile).map(range => ({
            startLine: range.start + 1,
            endLine: range.end + 1,
            content: lines.slice(range.start, range.end + 1).join('\n')
        }));
    }

    function getAccess(project, file) {
        const mode = project.settings?.aiAccessMode || 'selected';
        if (mode === 'none') return false;
        if (mode === 'all') return true;
        return file.aiAccess === 'allowed';
    }

    async function resolve({ projectId, query, ...overrides } = {}) {
        if (!Workspace?.isInitialized?.()) {
            return { status: 'workspace-not-initialized', project: null, context: emptyContext(), diagnostics: emptyDiagnostics() };
        }
        const normalizedQuery = normalize(query);
        const terms = tokenize(query);
        if (!normalizedQuery || !terms.length) {
            return { status: 'invalid-query', project: null, context: emptyContext(), diagnostics: emptyDiagnostics() };
        }
        const options = { ...DEFAULTS, ...overrides };
        const project = await Workspace.projects.get(projectId);
        if (!project) {
            return { status: projectId ? 'project-not-found' : 'project-not-configured', project: null, context: emptyContext(), diagnostics: emptyDiagnostics() };
        }

        const files = await Workspace.files.list(project.id);
        const accessible = files.filter(file => getAccess(project, file));
        const patterns = project.settings?.config?.includePatterns || [];
        const included = accessible.filter(file => matchesAnyPattern(file.path, patterns));
        const configuredBudget = Number(project.settings?.config?.maxContextBytes);
        if (Number.isInteger(configuredBudget) && configuredBudget > 0) {
            options.maxContextBytes = Math.min(options.maxContextBytes, configuredBudget);
        }
        const diagnostics = {
            searchedFiles: files.length,
            accessibleFiles: accessible.length,
            includedFiles: included.length,
            matchedFiles: 0
        };

        if (project.settings?.aiAccessMode === 'none') {
            return { status: 'project-no-access', project: projectSummary(project), context: emptyContext(project), diagnostics };
        }
        if (!accessible.length) {
            return { status: 'no-readable-files', project: projectSummary(project), context: emptyContext(project), diagnostics };
        }
        if (!included.length) {
            return { status: 'no-files-included', project: projectSummary(project), context: emptyContext(project), diagnostics };
        }

        const candidates = [];
        for (const metadata of included) {
            const file = await Workspace.files.get(project.id, metadata.id);
            if (!file || typeof file.content !== 'string') continue;
            const relevance = scoreFile(file, file.content, normalizedQuery, terms);
            if (relevance.score >= options.minScore) candidates.push({ file, ...relevance });
        }
        candidates.sort((a, b) => b.score - a.score || a.file.path.localeCompare(b.file.path));
        diagnostics.matchedFiles = candidates.length;
        if (!candidates.length) {
            return { status: 'no-relevant-files', project: projectSummary(project), context: emptyContext(project), diagnostics };
        }

        let remainingBytes = options.maxContextBytes;
        const selected = [];
        let truncated = false;
        for (const candidate of candidates) {
            if (selected.length >= options.maxFiles || remainingBytes <= 0) { truncated = true; break; }
            const excerpts = makeExcerpts(candidate.file.content, terms, options);
            const excerptItems = [];
            for (const excerpt of excerpts) {
                const bytes = new TextEncoder().encode(excerpt.content).byteLength;
                if (bytes > remainingBytes) {
                    const clipped = clipUtf8Text(excerpt.content, remainingBytes);
                    if (clipped) excerptItems.push({ ...excerpt, content: clipped.content, truncated: true });
                    truncated = true;
                    remainingBytes = 0;
                    break;
                }
                excerptItems.push(excerpt);
                remainingBytes -= bytes;
            }
            if (excerptItems.length) selected.push({
                id: candidate.file.id,
                path: candidate.file.path,
                name: candidate.file.name,
                relevance: candidate.score,
                reasons: candidate.reasons,
                excerpts: excerptItems
            });
        }
        const totalBytes = selected.reduce((sum, file) =>
            sum + file.excerpts.reduce((inner, excerpt) => inner + new TextEncoder().encode(excerpt.content).byteLength, 0), 0);
        return {
            status: selected.length ? (truncated ? 'context-truncated' : 'context-found') : 'no-relevant-files',
            project: projectSummary(project),
            context: { projectInstructions: project.settings?.instructions || '', files: selected, totalBytes, truncated },
            diagnostics
        };
    }

    function clipUtf8Text(value, maxBytes) {
        if (maxBytes <= 0) return null;
        const encoder = new TextEncoder();
        let output = '';
        for (const character of value) {
            if (encoder.encode(output + character).byteLength > maxBytes) break;
            output += character;
        }
        return output ? { content: output } : null;
    }

    function projectSummary(project) { return { id: project.id, name: project.name, updatedAt: project.updatedAt }; }
    function emptyContext(project = null) { return { projectInstructions: project?.settings?.instructions || '', files: [], totalBytes: 0, truncated: false }; }
    function emptyDiagnostics() { return { searchedFiles: 0, accessibleFiles: 0, includedFiles: 0, matchedFiles: 0 }; }

    return Object.freeze({ resolve, tokenize, scoreFile, matchesPattern, matchesAnyPattern, defaults: DEFAULTS });
})();
