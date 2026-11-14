// ===== src/site-adapter-registry.js =====
// Registry: SiteAdapterRegistry — Strategy/Factory com resolução determinística e fallback genérico.
// Ordem de registro define precedência (mais específico primeiro). Hosts canônicos de F0-T1.

// =========================================================================
// PATCH: Trusted Types (Gemini CSP)
// Libera o uso de innerHTML no restante da arquitetura sem alterar os módulos.
// =========================================================================
if (typeof window !== 'undefined' && window.trustedTypes && window.trustedTypes.createPolicy) {
  try {
    window.trustedTypes.createPolicy('default', {
      createHTML: (string) => string,
      createScript: (string) => string,
      createScriptURL: (string) => string
    });
  } catch (e) {
    // Ignora silenciosamente se a política já foi criada
  }
}
// =========================================================================

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

  findInput(root = document) {
    if (!root || !root.querySelector) return null;
    return (
      root.querySelector('div.ProseMirror[contenteditable="true"]') ||
      root.querySelector('[data-placeholder][contenteditable]') ||
      root.querySelector('[data-testid="composer-input"]') ||
      root.querySelector('[aria-label*="Message Claude"][contenteditable]') ||
      root.querySelector('div[role="textbox"][contenteditable]') ||
      root.querySelector('[contenteditable="true"]') ||
      SiteAdapter.defaults.findInput(root)
    );
  },

  findMountPoint(input) {
    if (!input) return null;

    // Sobe na árvore DOM até encontrar a "pílula" (o elemento com fundo e bordas arredondadas)
    let composer = input.parentElement;
    while (composer && composer !== document.body) {
      const style = window.getComputedStyle(composer);
      if (style.borderRadius !== '0px' && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        break; // Encontrou a cápsula do Claude
      }
      composer = composer.parentElement;
    }

    if (!composer || composer === document.body) {
      return SiteAdapter.defaults.findMountPoint(input);
    }

    if (!document.getElementById('pe-claude-style')) {
      const style = document.createElement('style');
      style.id = 'pe-claude-style';
      style.textContent = `
        /* 1. Transforma a cápsula do Claude em uma coluna */
        .pe-claude-container {
          display: flex !important;
          flex-direction: column !important;
          gap: 0 !important;
          padding: 0 !important;
          overflow: hidden !important; /* Mantém a barra dentro dos cantos arredondados */
        }

        /* 2. Reset dos invólucros de animação do script */
        .pe-inline-slot { 
          display: block !important; 
          width: 100% !important; 
        }
        .pe-inline-clip { 
          overflow: visible !important; 
        }

        /* 3. Posiciona a barra no topo da cápsula */
        .pe-mount {
          position: static !important;
          order: -1 !important; 
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* 4. Estilo da Barra de Ferramentas */
        .pe-actionbar {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid color-mix(in srgb, var(--pe-text) 8%, transparent) !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          width: 100% !important;
          box-sizing: border-box !important;
          
          /* Alinhamento e dimensões compactas */
          padding: 3px 32px !important; 
          min-height: 38px !important; 
          
          display: flex !important;
          align-items: center !important;
        }

        /* 5. Miniaturização dos controles */
        .pe-actionbar button {
          font-size: 12px !important;
          padding: 2px 8px !important;
          height: 28px !important; 
          min-height: 28px !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
          color: var(--pe-text-muted) !important;
        }
        
        .pe-actionbar svg {
          width: 14px !important;
          height: 14px !important;
        }

        /* 6. Botão "Aprimorar" */
        .pe-actionbar .pe-btn--primary {
          background: var(--pe-surface-3, #2f2f2f) !important;
          border: 1px solid var(--pe-border, #444) !important;
          border-radius: 6px !important;
          color: var(--pe-text, #fff) !important;
          height: 26px !important;
          padding: 0 12px !important;
        }

        /* 7. Respiro para o campo de texto não colar nas bordas */
        .pe-claude-container > :not(.pe-inline-slot) {
          padding-top: 2px !important;
          padding-bottom: 6px !important;
        }
      `;
      document.head.appendChild(style);
    }

    composer.classList.add('pe-claude-container');
    return composer;
  },

  insertText(input, text) {
    if (!input) return false;
    const str = String(text == null ? '' : text);
    try {
      input.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(input);
      sel.removeAllRanges();
      sel.addRange(range);

      const beforeInput = new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: str,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      if (input.dispatchEvent(beforeInput)) {
        document.execCommand('insertText', false, str);
      }

      input.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: 'insertText',
        data: str
      }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (_) {
      if (typeof Utils !== 'undefined' && typeof Utils.applyText === 'function') {
        Utils.applyText(input, str);
        return true;
      }
      return false;
    }
  },

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

  findInput(root = document) {
    if (!root || !root.querySelector) return null;
    return (
      root.querySelector('#prompt-textarea') ||
      root.querySelector('[data-testid="prompt-textarea"]') ||
      root.querySelector('div.ProseMirror[contenteditable="true"]') ||
      root.querySelector('div[contenteditable="true"][role="textbox"]') ||
      SiteAdapter.defaults.findInput(root)
    );
  },

  findMountPoint(input) {
    if (!input) return null;

    let composer = input.parentElement;
    while (composer && composer !== document.body) {
      const style = window.getComputedStyle(composer);
      if (style.borderRadius !== '0px' && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        break;
      }
      composer = composer.parentElement;
    }

    if (!composer || composer === document.body) {
      return SiteAdapter.defaults.findMountPoint(input);
    }

    if (!document.getElementById('pe-chatgpt-style')) {
      const style = document.createElement('style');
      style.id = 'pe-chatgpt-style';
      style.textContent = `
        .pe-chatgpt-container {
          display: flex !important;
          flex-direction: column !important;
          gap: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          padding-bottom: 4px !important; /* Respiro extra na base */
        }

        .pe-inline-slot { display: block !important; width: 100% !important; }
        .pe-inline-clip { overflow: visible !important; }

        .pe-mount {
          position: static !important;
          order: -1 !important; 
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .pe-actionbar {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid color-mix(in srgb, var(--pe-text) 8%, transparent) !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          width: 100% !important;
          box-sizing: border-box !important;
          
          /* Redução de altura: padding vertical menor e min-height de 38px */
          padding: 3px 32px !important; 
          min-height: 38px !important; 
          
          display: flex !important;
          align-items: center !important;
        }

        /* Força os botões a terem uma altura fixa menor */
        .pe-actionbar button {
          font-size: 12px !important;
          padding: 2px 8px !important;
          height: 28px !important; 
          min-height: 28px !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
          color: var(--pe-text-muted) !important;
        }
        
        .pe-actionbar svg {
          width: 14px !important;
          height: 14px !important;
        }

        .pe-actionbar .pe-btn--primary {
          background: var(--pe-surface-3, #2f2f2f) !important;
          border: 1px solid var(--pe-border, #444) !important;
          border-radius: 6px !important; /* Borda levemente menor para combinar */
          color: var(--pe-text, #fff) !important;
          height: 26px !important; /* Botão primário um pouco mais esbelto */
          padding: 0 12px !important;
        }

        /* Garante o respiro do campo de texto com o topo e a base */
        .pe-chatgpt-container > :not(.pe-inline-slot) {
          padding-top: 2px !important;
          padding-bottom: 8px !important;
        }
      `;
      document.head.appendChild(style);
    }

    composer.classList.add('pe-chatgpt-container');
    return composer;
  },

  insertText(input, text) {
    if (!input) return false;
    const str = String(text == null ? '' : text);
    try {
      input.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(input);
      sel.removeAllRanges();
      sel.addRange(range);

      const beforeInput = new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: str,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      if (input.dispatchEvent(beforeInput)) {
        document.execCommand('insertText', false, str);
      }

      input.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: 'insertText',
        data: str
      }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (_) {
      if (typeof Utils !== 'undefined' && typeof Utils.applyText === 'function') {
        Utils.applyText(input, str);
        return true;
      }
      return false;
    }
  },

  wrapContext(body) {
    const b = body == null ? '' : String(body);
    return `### CONTEXTO ###\n${b}\n### FIM DO CONTEXTO ###`;
  }
}));

// Gemini: gemini.google.com
SiteAdapterRegistry.register(SiteAdapter.create({
  id: 'gemini',
  name: 'Gemini',
  matches: (loc) => loc.hostname.includes('gemini.google.com'),

  findInput(root = document) {
    if (!root || !root.querySelector) return null;
    return (
      root.querySelector('rich-textarea .ql-editor[contenteditable="true"]') ||
      root.querySelector('rich-textarea .ql-editor.textarea') ||
      root.querySelector('.ql-editor[contenteditable="true"]') ||
      root.querySelector('rich-textarea [contenteditable="true"]') ||
      root.querySelector('[aria-label*="message"][contenteditable]') ||
      root.querySelector('div[role="textbox"][contenteditable]') ||
      root.querySelector('[contenteditable="true"]') ||
      SiteAdapter.defaults.findInput(root)
    );
  },

  findMountPoint(input) {
    if (!input) return null;

    const composer = input.closest('.text-input-field') || 
                     input.closest('input-area-v2') || 
                     SiteAdapter.defaults.findMountPoint(input);

    if (!composer) return SiteAdapter.defaults.findMountPoint(input);

    if (!document.getElementById('pe-gemini-style')) {
      const style = document.createElement('style');
      style.id = 'pe-gemini-style';
      style.textContent = `
        body.pe-host-gemini .pe-gemini-container {
          position: relative !important;
          padding-top: 46px !important; /* Abre espaço no topo */
        }

        body.pe-host-gemini .pe-mount {
          position: absolute !important;
          top: 0 !important;            /* Ancora no topo */
          left: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          z-index: 10 !important;
        }

        body.pe-host-gemini .pe-actionbar {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid color-mix(in srgb, var(--pe-text) 8%, transparent) !important; /* Linha embaixo */
          border-radius: 24px 24px 0 0 !important; /* Arredonda o topo */
          box-shadow: none !important;
          padding: 4px 16px !important;
          justify-content: flex-start !important;
          min-height: 42px !important;
        }
      `;
      document.head.appendChild(style);
      document.body.classList.add('pe-host-gemini');
    }

    composer.classList.add('pe-gemini-container');

    return composer;
  },

  insertText(input, text) {
    if (!input) return false;
    const str = String(text == null ? '' : text);
    try {
      input.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(input);
      sel.removeAllRanges();
      sel.addRange(range);

      const beforeInput = new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: str,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      if (input.dispatchEvent(beforeInput)) {
        document.execCommand('insertText', false, str);
      }

      input.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: 'insertText',
        data: str
      }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (_) {
      if (typeof Utils !== 'undefined' && typeof Utils.applyText === 'function') {
        Utils.applyText(input, str);
        return true;
      }
      return false;
    }
  },

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

// Perplexity: www.perplexity.ai
SiteAdapterRegistry.register(SiteAdapter.create({
  id: 'perplexity',
  name: 'Perplexity',
  matches: (loc) => loc.hostname.includes('perplexity.ai'),
  
  findInput(root) {
    return root.querySelector('#ask-input') || 
           root.querySelector('[data-lexical-editor="true"]') || 
           SiteAdapter.defaults.findInput(root);
  },
  
  findMountPoint(input) {
    // 1. Injeta o CSS de integração e remoção de espaçamento
    if (!document.getElementById('pe-perplexity-style')) {
      const style = document.createElement('style');
      style.id = 'pe-perplexity-style';
      style.textContent = `
        body.pe-host-perplexity .pe-mount {
          display: block !important;
          width: 100% !important;
          position: relative !important;
          z-index: 50 !important;
          flex: 0 0 auto !important;
        }
        /* Ajuste da barra de ferramentas */
        body.pe-host-perplexity .pe-actionbar {
          display: flex !important;
          width: 100% !important;
          padding: 8px 16px !important;
          border-bottom: 1px solid color-mix(in srgb, var(--pe-text) 8%, transparent) !important;
          box-sizing: border-box !important;
          background: transparent !important;
          margin: 0 !important;
          border-radius: 0 !important;
        }
        /* Correção do espaçamento do container pai, conforme diagnóstico */
        body.pe-host-perplexity .bg-composer {
          padding-top: 0px !important;
          gap: 0px !important;
        }
      `;
      document.head.appendChild(style);
      document.body.classList.add('pe-host-perplexity');
    }

    // 2. Localiza o container do editor
    let editor = input.closest('form') || 
                 input.closest('.rounded-3xl') || 
                 input.closest('._editor_22sit_47') || 
                 input.closest('[class*="border"]');
    
    // 3. Fallback de segurança
    if (!editor) {
      editor = input.parentElement;
      for (let i = 0; i < 2 && editor && editor.tagName !== 'BODY'; i++) {
        editor = editor.parentElement;
      }
    }

    return editor || input.parentElement;
  },
  
  insertText(input, text) {
    input.focus();
    try {
      const inputEvent = new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: text,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      const notCancelled = input.dispatchEvent(inputEvent);
      if (notCancelled) {
        Utils.applyText(input, text);
      }
      return true;
    } catch (e) {
      Utils.applyText(input, text);
      return true;
    }
  },
  
  wrapContext(body) {
    const b = body == null ? '' : String(body);
    return `--- Instruções do projeto ---\n${b}\n--- Fim das instruções do projeto ---`;
  }
}));