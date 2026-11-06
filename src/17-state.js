// ===== src/17-state.js =====
    const State = {
        activeInput: null, activeComposer: null, previousText: null,
        isProcessing: false, isGuiding: false, preview: null, wizard: null,
        _currentRequest: null, pendingAbort: null, lastError: null,
        params: null, paramsDraft: null,
        stream: { active: false, startedAt: 0, firstTokenAt: 0, tokenCount: 0, lastTokenAt: 0, observedTokS: 0, fullText: '' }
    };

