// ===== src/site-adapter-registry.js =====
// Registry: SiteAdapterRegistry — Strategy/Factory com resolução determinística e fallback genérico.
// Ordem de registro define precedência (mais específico primeiro). Hosts canônicos de F0-T1.
const SiteAdapterRegistry = (() => {
  const adapters = [];
  const seen = new Set();
  const fallbackWarned = new Set();

  function register(adapter) {
    if (!adapter || typeof adapter.id !== 'string') return false;
    if (seen.has(adapter.id)) return false;
    adapters.push(adapter);
    seen.add(adapter.id);
    return true;
  }

  function list() { return adapters.slice(); }

  function detect(location) {
    const loc = location || (typeof location !== 'undefined' ? location : null);
    const hostname = (loc && loc.hostname) ? String(loc.hostname).toLowerCase() : '';
    const href = (loc && loc.href) ? String(loc.href) : '';
    for (const adapter of adapters) {
      try {
        if (adapter.matches({ hostname, href, pathname: loc ? loc.pathname || '' : '' })) return adapter;
      } catch (_) {}
    }
    return null;
  }

  function getAdapter(location) {
    const specific = detect(location);
    if (specific) return specific;
    return GenericAdapter;
  }

  function diagnose(location) {
    const loc = location || {};
    const hostname = String(loc.hostname || '').toLowerCase();
    const href = String(loc.href || '');
    const adapter = getAdapter({ hostname, href, pathname: loc.pathname || '' });
    const isFallback = adapter.id === 'generic';
    const key = hostname || href;
    if (isFallback && key && !fallbackWarned.has(key)) {
      fallbackWarned.add(key);
      try {
        console.warn('[PE][SiteAdapter]', JSON.stringify({
          event: 'fallback',
          host: hostname || '(none)',
          href,
          adapterId: 'generic',
          inputFound: false,
          mountFound: false
        }));
      } catch (_) {}
    }
    return { adapter, isFallback };
  }

  // Adaptador genérico concreto (D-012: warning com campos mínimos)
  const GenericAdapter = SiteAdapter.create({
    id: 'generic',
    name: 'Genérico',
    matches: () => false,
    wrapContext(body) {
      const b = body == null ? '' : String(body);
      return `--- Instruções do projeto ---\n${b}\n--- Fim das instruções do projeto ---`;
    }
  });

  return { register, list, detect, getAdapter, diagnose, GenericAdapter };
})();

// Registros dos adaptadores concretos (ordem determinística: mais específico primeiro)
// Claude: claude.ai
SiteAdapterRegistry.register(SiteAdapter.create({
  id: 'claude',
  name: 'Claude',
  matches: (loc) => loc.hostname.includes('claude.ai'),
  wrapContext(body) {
    const b = body == null ? '' : String(body);
    return `<project_context>\n${b}\n</project_context>`;
  }
}));

// OpenAI/ChatGPT: chatgpt.com, chat.openai.com
SiteAdapterRegistry.register(SiteAdapter.create({
  id: 'openai',
  name: 'ChatGPT/OpenAI',
  matches: (loc) => loc.hostname.includes('chatgpt.com') || loc.hostname.includes('chat.openai.com'),
  wrapContext(body) {
    const b = body == null ? '' : String(body);
    return `### CONTEXTO DO PROJETO ###\n${b}\n### FIM DO CONTEXTO DO PROJETO ###`;
  }
}));

// Gemini: gemini.google.com
SiteAdapterRegistry.register(SiteAdapter.create({
  id: 'gemini',
  name: 'Gemini',
  matches: (loc) => loc.hostname.includes('gemini.google.com'),
  wrapContext(body) {
    const b = body == null ? '' : String(body);
    return `### CONTEXTO DO PROJETO ###\n${b}\n### FIM DO CONTEXTO DO PROJETO ###`;
  }
}));

// DeepSeek: chat.deepseek.com
SiteAdapterRegistry.register(SiteAdapter.create({
  id: 'deepseek',
  name: 'DeepSeek',
  matches: (loc) => loc.hostname.includes('chat.deepseek.com'),
  wrapContext(body) {
    const b = body == null ? '' : String(body);
    return `--- Instruções do projeto ---\n${b}\n--- Fim das instruções do projeto ---`;
  }
}));