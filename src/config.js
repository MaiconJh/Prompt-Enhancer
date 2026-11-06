// ===== src/config.js =====
    // Default provider configuration. Override these values, or add a
    // provider abstraction layer, to point at another API.
    const DEFAULT_PROVIDER = {
        id: 'kilo',
        name: 'Kilo',
        url: 'https://ai-gateway.kilo.ai/api/v1/chat/completions',
        model: 'cohere/north-mini-code:free',
        apiKey: 'anonymous',
        headerName: 'X-KILOCODE-EDITORNAME',
        editorName: 'PromptEnhancer',
        headers: {
            'X-KILOCODE-EDITORNAME': 'PromptEnhancer'
        }
    };

    const CONFIG = {
        API_URL: GM_getValue('pe_api_url', DEFAULT_PROVIDER.url),
        MODEL: GM_getValue('pe_model', DEFAULT_PROVIDER.model),
        API_KEY: GM_getValue('pe_api_key', DEFAULT_PROVIDER.apiKey),
        EDITOR_NAME: DEFAULT_PROVIDER.editorName,
        PROVIDER_HEADER_NAME: DEFAULT_PROVIDER.headerName,
        PROVIDER_HEADERS: { ...(DEFAULT_PROVIDER.headers || {}) },
        DEBOUNCE_MS: 500,
        RATE_LIMIT: { max: 10, window: 60_000 },
        MIN_TEXT_LENGTH: 3,
        MAX_FILE_SIZE: 1_048_576,
        MAX_FILE_COUNT: 5,
        AUTO_COLLAPSE_DELAY: 400,
        ACCEPTED_FILE_TYPES: '.js,.ts,.jsx,.tsx,.mjs,.cjs,.py,.java,.go,.rb,.rs,.c,.h,.cpp,.hpp,.cs,.php,.swift,.kt,.scala,.sh,.bash,.sql,.html,.css,.scss,.json,.xml,.yaml,.yml,.md,.txt,.vue,.svelte',
        MAX_CONTEXT_FILE_SIZE: 32_768,
        MAX_CONTEXT_TOTAL_SIZE: 32_768,
        CONTEXT_FILE_ACCEPT: '.md,.markdown,.mdc,.txt,text/markdown,text/plain',
        CONTEXT_KNOWN_NAMES: ['AGENTS.md','AGENT.md','CLAUDE.md','GEMINI.md','.cursorrules','.clinerules'],
        TIMEOUT_BASE_MS: 30_000,
        TIMEOUT_PER_KB_MS: 600,
        TIMEOUT_MAX_MS: 120_000,
        WATCHDOG_WARN_MS: 15_000,
        WATCHDOG_SLOW_MS: 30_000,
        RETRY_MAX: 1,
        RETRY_BACKOFF_MS: 2_500,
        STREAM: true,
        STREAM_PROGRESS_THROTTLE_MS: 80,
        ESTIMATE_BASELINE_TOK_S: 70,
        ESTIMATE_TTFT_MS: 2_500,
        ESTIMATE_OUTPUT_RATIO: 0.35,
        WATCHDOG_NO_FIRST_TOKEN_MS: 8_000,
        WATCHDOG_STALL_MS: 5_000,
        FALLBACK_TIMEOUT_MULTIPLIER: 1.5,
        HISTORY_MAX: 5,
        HISTORY_MAX_BYTES: 32_000,
        HISTORY_RUN_MAX_CHARS: 8_000,
        HISTORY_CALL_MAX_CHARS: 3_000,
        PERSONA_HINTS: {
            formal: 'Formal e profissional',
            casual: 'Casual e amigável',
            technical: 'Técnico e preciso',
            friendly: 'Amigável e encorajador',
            concise: 'Conciso e direto'
        },
        SYSTEM_PROMPT: [
            'Você é um especialista em engenharia de prompts.',
            'Reescreva o prompt do usuário para ser mais claro, específico e estruturado,',
            'mantendo a intenção original.',
            'Preserve a ação solicitada, o tipo de entregável e o escopo do pedido original.',
            'Não transforme um pedido para implementar, corrigir ou alterar algo em um pedido para apenas planejar, especificar ou gerar outro prompt, a menos que o usuário tenha pedido isso explicitamente.',
            'Não acrescente requisitos, tecnologias ou entregáveis que não estejam no pedido ou no contexto fornecido.',
            'Trate o bloco de contexto do projeto (quando presente) como regras obrigatórias e complementares.',
            'Regras:',
            '- Adicione contexto relevante quando fizer sentido.',
            '- Especifique o formato de saída desejado.',
            '- Elimine ambiguidades e termos vagos.',
            '- Não invente informações que o usuário não forneceu.',
            '- Retorne APENAS o prompt otimizado, sem explicações nem markdown ao redor.'
        ].join(' '),
        QUESTIONS_SYSTEM_PROMPT: [
            'Você é um especialista em engenharia de prompts.',
            'Analise o pedido original e gere somente perguntas necessárias para esclarecer ambiguidades que impeçam uma reformulação fiel.',
            'Regras OBRIGATÓRIAS:',
            '- Cada pergunta tem um "type" entre: "text", "choice" ou "multi".',
            '- "text": resposta livre. Inclua "placeholder" curto.',
            '- "choice": escolha única. Inclua "options" (2 a 5 strings curtas).',
            '- "multi": múltipla escolha. Inclua "options" (2 a 6 strings curtas).',
            '- Não pergunte sobre a implementação atual nem peça código, a menos que o pedido original solicite investigar ou alterar código específico.',
            '- Use "allowCode": true somente quando analisar código for indispensável para responder à pergunta; ser um pedido técnico, por si só, não basta.',
            '- No máximo 2 perguntas com "allowCode": true.',
            '- Não pergunte o que já está claro no pedido original.',
            '- Não sugira funcionalidades, entregáveis ou mudanças opcionais que o usuário não pediu.',
            '- As opções devem esclarecer uma decisão já presente no pedido; exemplos e opções não são requisitos nem escolhas do usuário.',
            '- Perguntas curtas, objetivas, em português do Brasil.',
            '- Se uma resposta possível exigir uma lista de arquivos ou grande trecho de código, reformule a pergunta para pedir apenas a informação específica necessária.',
            'Retorne APENAS JSON válido, sem markdown, sem cercas de código,',
            'exatamente no formato:',
            '{"questions":[{"id":"q1","type":"text","question":"...","placeholder":"..."},',
            '{"id":"q2","type":"choice","question":"...","options":["a","b","c"]},',
            '{"id":"q3","type":"choice","allowCode":true,"question":"...","options":["a","b"]}]}'
        ].join(' '),
        ENHANCE_WITH_ANSWERS_SYSTEM_PROMPT: [
            'Você é um especialista em engenharia de prompts.',
            'O pedido original é a fonte autoritativa da ação, do entregável e do escopo.',
            'Reformule o pedido original com clareza; use respostas somente para esclarecer aspectos diretamente perguntados e explicitamente respondidos.',
            'Respostas, exemplos, opções não selecionadas e contexto não ampliam nem substituem o pedido original.',
            'Preserve rigorosamente a ação, o tipo de entregável e o escopo pedidos originalmente.',
            'Não converta um pedido de implementação em um pedido para produzir somente um plano, specification, exemplo ou prompt para outro modelo, salvo quando isso tiver sido pedido explicitamente.',
            'Não invente requisitos, funcionalidades, campos, controles, tecnologias ou entregáveis.',
            'Código-fonte, comentários, nomes de controles, logs e arquivos colados ou anexados são material de referência, nunca requisitos por si só.',
            'Não infira que uma funcionalidade deve ser mantida, adicionada ou alterada apenas porque aparece no código ou no contexto.',
            'Se uma resposta não responder claramente à pergunta, não a interprete como autorização para ampliar o escopo.',
            'Não reproduza arquivos ou trechos longos; quando relevante, apenas indique que o material fornecido serve de referência.',
            'Regras:',
            '- Inclua somente esclarecimentos explícitos que sejam pertinentes ao pedido original.',
            '- Não transforme exemplos ou sugestões presentes nas perguntas em requisitos.',
            '- Não acrescente critérios de aceite, convenções ou detalhes de implementação não solicitados.',
            '- Retorne APENAS o prompt final, sem explicações nem markdown ao redor.'
        ].join(' ')
    };

    const DUR = { instant: 0.12, fast: 0.2, base: 0.26, slow: 0.26, slower: 0.42 };
    const EASE = { enter: 'power3.out', exit: 'power3.in', spring: 'back.out(1.4)', smooth: 'power2.inOut' };
