// ===== src/rate-limiter.js =====
    const RateLimiter = (() => {
        const map = new Map();
        const key = () => location.hostname || 'unknown';
        function _prune() { const now = Date.now(); const k = key(); const arr = (map.get(k) || []).filter(t => now - t < CONFIG.RATE_LIMIT.window); map.set(k, arr); return arr; }
        return {
            check() { const arr = _prune(); if (arr.length < CONFIG.RATE_LIMIT.max) return { allowed: true, retryAfterMs: 0 }; const oldest = arr[0]; return { allowed: false, retryAfterMs: Math.max(0, CONFIG.RATE_LIMIT.window - (Date.now() - oldest)) }; },
            consume() { const arr = _prune(); arr.push(Date.now()); map.set(key(), arr); },
            refund() { const arr = _prune(); if (arr.length > 0) arr.pop(); map.set(key(), arr); }
        };
    })();

