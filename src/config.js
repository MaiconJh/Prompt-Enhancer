// ===== Module: config.js =====
// Description: Defines provider defaults, runtime configuration, prompt templates, and animation constants.
// Interfaces:
//   Provides: DEFAULT_PROVIDER, CONFIG, DUR, EASE
//   Consumes: GM_getValue
// Interactions:
//   - Provides shared settings to provider, context, API, and UI modules.
// ===== src/config.js =====
    const ConfigStore = (() => {
        const memoryOverrides = new Map();

        function deepFreeze(obj) {
            if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) return obj;
            Object.freeze(obj);
            Object.keys(obj).forEach((key) => deepFreeze(obj[key]));
            return obj;
        }

        function readStorage(key, fallback) {
            if (memoryOverrides.has(key)) return memoryOverrides.get(key);
            try {
                if (typeof GM_getValue === 'function') {
                    const value = GM_getValue(key, fallback);
                    if (value !== undefined && value !== null && String(value).trim() !== '') {
                        return value;
                    }
                }
            } catch (_) {}
            return fallback;
        }

        function writeOverride(key, value) {
            if (value === undefined || value === null || String(value).trim() === '') {
                memoryOverrides.delete(key);
            } else {
                memoryOverrides.set(key, value);
            }
        }

        function composePrompt(blocks) {
            return blocks.map((line) => line.trim()).filter(Boolean).join(' ');
        }

        return { deepFreeze, readStorage, writeOverride, composePrompt };
    })();

    const DEFAULT_PROVIDER = ConfigStore.deepFreeze({
        id: 'default',
        name: 'Kilo',
        url: 'https://ai-gateway.kilo.ai/api/v1/chat/completions',
        model: 'cohere/north-mini-code:free',
        apiKey: 'anonymous',
        headerName: 'X-KILOCODE-EDITORNAME',
        editorName: 'PromptEnhancer',
        headers: {
            'X-KILOCODE-EDITORNAME': 'PromptEnhancer'
        }
    });

    const FILE_EXTENSIONS = Object.freeze([
        '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
        '.py', '.java', '.go', '.rb', '.rs',
        '.c', '.h', '.cpp', '.hpp', '.cs',
        '.php', '.swift', '.kt', '.scala',
        '.sh', '.bash', '.sql',
        '.html', '.css', '.scss', '.less', '.vue', '.svelte', '.astro',
        '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.env',
        '.md', '.txt', '.csv', '.graphql', '.prisma', '.dockerfile'
    ]);

    const CONTEXT_FILENAMES = Object.freeze([
        'AGENTS.md',
        'AGENT.md',
        'CLAUDE.md',
        'GEMINI.md',
        'COPILOT.md',
        '.cursorrules',
        '.clinerules',
        '.windsurfrules'
    ]);

    const PROMPT_TEMPLATES = ConfigStore.deepFreeze({
        DIRECT_ENHANCE: ConfigStore.composePrompt([
            'Você é um especialista em engenharia e reescrita de prompts. Sua única função é transformar o pedido bruto do usuário em um prompt claro, específico e de alto impacto, pronto para ser enviado diretamente a um modelo de linguagem.',
            'A saída será colada literalmente no campo de entrada do chat. Produza instrução imperativa e direta ao modelo-alvo — não responda ao pedido em si, não faça análise prévia, não crie relatório e não estabeleça diálogo.',
            'Preserve rigorosamente a intenção, a ação principal, o idioma original (salvo instrução explícita em contrário) e o tipo de entregável do pedido original. Se o pedido for de implementação, correção, refatoração ou alteração, o prompt aprimorado continua sendo uma tarefa prática de implementação, correção, refatoração ou alteração.',
            'Separe com clareza o estado atual (código existente, ambiente, restrições) das alterações desejadas. Incorpore o contexto fornecido (arquivos, trechos, restrições) como detalhes concretos do prompt e resuma blocos extensos sem copiá-los integralmente.',
            'Se faltar informação secundária, complete com hipóteses técnicas razoáveis inferidas do contexto. Não faça perguntas ao usuário, não peça esclarecimentos e não liste o que falta saber.',
            'Retorne um único prompt em texto contínuo ou parágrafos naturais bem articulados. Não inclua títulos, cabeçalhos markdown, seções nomeadas, listas numeradas de perguntas, cercas de código envolvendo toda a resposta ou marcadores de análise.',
            'Retorne APENAS o prompt aprimorado.'
        ]),
        GUIDED_QUESTIONS: ConfigStore.composePrompt([
            'Você é um especialista em engenharia de prompts e levantamento de requisitos.',
            'Ajude a esclarecer o pedido original para produzir um prompt mais útil, preciso e executável.',
            'Gere entre 3 e 5 perguntas objetivas. Gere menos de 3 apenas se o pedido já contiver todas as informações necessárias para produzir um prompt completo.',
            'Priorize decisões em aberto que mudem materialmente o resultado: objetivo exato, comportamento esperado, escopo, casos de borda, restrições técnicas e critérios de sucesso.',
            'Em tarefas técnicas, pergunte sobre o estado atual, assinaturas, dependências, arquivos relevantes ou um trecho específico quando isso ajudar a entender a mudança ou preservar o comportamento existente.',
            'Peça apenas o material estritamente necessário: prefira caminhos de arquivos ou trechos delimitados; solicite arquivos ou blocos maiores somente quando forem indispensáveis. Considere também as referências já anexadas.',
            'Não presuma que código deve ser enviado em toda tarefa técnica, nem evite pedi-lo quando for útil.',
            'Retorne APENAS um objeto JSON válido, sem formatação markdown e sem cercas de código.',
            'O objeto raiz deve ter exatamente uma chave "questions". Não repita a chave, não emita dois objetos e não use chaves duplicadas.',
            'O valor de "questions" deve ser um array com 3 a 5 itens. Nunca menos que 3 (salvo quando o pedido já estiver completo) e nunca mais que 5.',
            'Cada pergunta deve ter um "type" entre: "text", "choice" ou "multi".',
            '"text": resposta livre curta. Inclua "placeholder" curto e orientador.',
            '"choice": escolha única. Inclua "options" (2 a 5 strings curtas e mutuamente exclusivas).',
            '"multi": múltipla escolha. Inclua "options" (2 a 6 strings curtas combináveis).',
            'Se o pedido mencionar script, código, arquivo, módulo, função, componente, repositório, plugin, bug ou trecho, pelo menos uma pergunta deve ter "allowCode": true.',
            'A pergunta com "allowCode": true deve pedir explicitamente o código ou o arquivo relevante (ex.: "Cole o trecho ou anexe o arquivo do módulo X").',
            'Use "allowCode": true em outras perguntas apenas quando um arquivo ou trecho de código puder ajudar diretamente a respondê-las.',
            'Não pergunte o que já está claro no pedido ou no contexto anexado, nem sugira funcionalidades extras como se já tivessem sido solicitadas.',
            'As opções devem ajudar a destravar uma decisão em aberto; exemplos são ilustrativos, não requisitos.',
            'Escreva as perguntas de forma breve e colaborativa, no idioma do pedido do usuário. Se o sistema especificar um idioma de resposta abaixo, ele prevalece.',
            'Valide o JSON mentalmente antes de responder: uma única chave raiz "questions", array com 3 a 5 itens, cada item com "id", "type", "question" e, se aplicável, "placeholder", "options" e "allowCode".',
            'Exemplo do formato exato esperado:',
            '{"questions":[{"id":"q1","type":"text","question":"...","placeholder":"..."},',
            '{"id":"q2","type":"choice","question":"...","options":["a","b","c"]},',
            '{"id":"q3","type":"text","allowCode":true,"question":"...","placeholder":"Cole o trecho ou anexe o arquivo..."}]}'
        ]),
        ENHANCE_WITH_ANSWERS: ConfigStore.composePrompt([
            'Você reescreve prompts. Recebe um pedido original e respostas de esclarecimento (incluindo eventuais códigos ou arquivos anexados) e devolve um único prompt aprimorado, que será colado literalmente no campo de entrada de um chat.',
            'A saída é instrução direta ao modelo-alvo. Não é análise, não é relatório, não é lista de módulos, não é plano de ação e não é documento com seções.',
            'Retorne texto contínuo (1 a 3 parágrafos fluidos), com no máximo 250 palavras, começando obrigatoriamente por um verbo de ação no imperativo (Crie, Reduza, Refatore, Implemente, Corrija, Ajuste, Otimize, Gere, Reescreva) ou por "Preciso".',
            'Integre as respostas e os detalhes relevantes dos anexos como especificações e restrições concretas dentro do texto do prompt. Não reproduza a estrutura de perguntas e respostas na saída e não descreva o processo de reescrita.',
            'Se uma resposta for vazia ou irrelevante, ignore-a silenciosamente. Se faltar dado essencial, decida com hipótese técnica razoável e siga — não pergunte e não liste o que falta esclarecer.',
            'Não inclua títulos, rótulos em negrito seguidos de dois-pontos, listas numeradas de itens, marcadores markdown, tabelas, blocos de citação, cercas de código envolvendo a resposta ou meta-comentário como "Aqui está o prompt" ou "Prompt final".',
            'Exemplo de saída válida (adapte ao pedido, não copie literalmente):',
            '"Refatore o script UserScript fornecido para reduzir seu tamanho em pelo menos 40%, removendo comentários redundantes, código morto e módulos não utilizados, consolidando utilitários duplicados e preservando todas as funcionalidades de detecção de provedor, injeção de contexto, aprimoramento guiado, fallback, retry e streaming. Mantenha os @grant, @match e @connect existentes. Entregue o script em um único arquivo."',
            'Retorne APENAS o prompt final, sem qualquer texto antes ou depois.'
        ])
    });

    const CONFIG = {
        // Catálogo e Roteamento
        CATALOG_CACHE_TTL_MS: 300_000,
        CATALOG_FETCH_TIMEOUT_MS: 3_000,
        VIRTUAL_FALLBACK_MODELS: Object.freeze(['openrouter/free', 'kilo-auto/free']),

        // Provedor Ativo (Getters/Setters reativos sincronizados com o storage)
        get API_URL() {
            return ConfigStore.readStorage('pe_api_url', DEFAULT_PROVIDER.url);
        },
        set API_URL(val) {
            ConfigStore.writeOverride('pe_api_url', val);
        },
        get MODEL() {
            return ConfigStore.readStorage('pe_model', DEFAULT_PROVIDER.model);
        },
        set MODEL(val) {
            ConfigStore.writeOverride('pe_model', val);
        },
        get API_KEY() {
            return ConfigStore.readStorage('pe_api_key', DEFAULT_PROVIDER.apiKey);
        },
        set API_KEY(val) {
            ConfigStore.writeOverride('pe_api_key', val);
        },
        EDITOR_NAME: DEFAULT_PROVIDER.editorName,
        PROVIDER_HEADER_NAME: DEFAULT_PROVIDER.headerName,
        PROVIDER_HEADERS: { ...DEFAULT_PROVIDER.headers },

        // Interação de UI e Rate Limiting Local
        DEBOUNCE_MS: 500,
        AUTO_COLLAPSE_DELAY: 400,
        MIN_TEXT_LENGTH: 3,
        RATE_LIMIT: ConfigStore.deepFreeze({ max: 10, window: 60_000 }),

        // Anexos de Código e Arquivos de Contexto
        MAX_FILE_SIZE: 1_048_576,
        MAX_FILE_COUNT: 5,
        ACCEPTED_FILE_TYPES: FILE_EXTENSIONS.join(','),
        MAX_CONTEXT_FILE_SIZE: 32_768,
        MAX_CONTEXT_TOTAL_SIZE: 32_768,
        CONTEXT_FILE_ACCEPT: '.md,.markdown,.mdc,.txt,text/markdown,text/plain',
        CONTEXT_KNOWN_NAMES: CONTEXT_FILENAMES,

        // Rede, Timeouts, Watchdogs e Retries
        TIMEOUT_BASE_MS: 30_000,
        TIMEOUT_PER_KB_MS: 600,
        TIMEOUT_MAX_MS: 120_000,
        FALLBACK_TIMEOUT_MULTIPLIER: 1.5,
        WATCHDOG_WARN_MS: 15_000,
        WATCHDOG_SLOW_MS: 30_000,
        WATCHDOG_NO_FIRST_TOKEN_MS: 8_000,
        WATCHDOG_STALL_MS: 5_000,
        RETRY_MAX: 1,
        RETRY_BACKOFF_MS: 2_500,
        MAX_OUTPUT_CONTINUATIONS: 2,

        // Streaming e Telemetria de Velocidade
        STREAM: true,
        STREAM_PROGRESS_THROTTLE_MS: 80,
        ESTIMATE_BASELINE_TOK_S: 70,
        ESTIMATE_TTFT_MS: 2_500,
        ESTIMATE_OUTPUT_RATIO: 0.35,

        // Limites de Persistência de Histórico
        HISTORY_MAX: 5,
        HISTORY_MAX_BYTES: 32_000,
        HISTORY_RUN_MAX_CHARS: 8_000,
        HISTORY_CALL_MAX_CHARS: 3_000,

        // Personalidades e Templates de System Prompt
        PERSONA_HINTS: ConfigStore.deepFreeze({
            formal: 'Formal, objetivo e profissional',
            casual: 'Casual, acessível e amigável',
            technical: 'Técnico, rigoroso e arquiteturalmente preciso',
            friendly: 'Amigável, colaborativo e encorajador',
            concise: 'Conciso, direto ao ponto e sem redundâncias'
        }),
        SYSTEM_PROMPT: PROMPT_TEMPLATES.DIRECT_ENHANCE,
        QUESTIONS_SYSTEM_PROMPT: PROMPT_TEMPLATES.GUIDED_QUESTIONS,
        ENHANCE_WITH_ANSWERS_SYSTEM_PROMPT: PROMPT_TEMPLATES.ENHANCE_WITH_ANSWERS
    };

    const DUR = ConfigStore.deepFreeze({
        instant: 0.12,
        fast: 0.2,
        base: 0.26,
        slow: 0.26,
        slower: 0.42
    });

    const EASE = ConfigStore.deepFreeze({
        enter: 'power3.out',
        exit: 'power3.in',
        spring: 'back.out(1.4)',
        smooth: 'power2.inOut'
    });