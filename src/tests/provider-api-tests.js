// ===== src/tests/provider-api-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourceDir = new URL('../', import.meta.url);
const configSource = await readFile(new URL('config.js', sourceDir), 'utf8');
const managerSource = await readFile(new URL('provider-manager.js', sourceDir), 'utf8');
const errorsSource = await readFile(new URL('network-errors.js', sourceDir), 'utf8');
const systemPromptSource = await readFile(new URL('system-prompt-manager.js', sourceDir), 'utf8');
const apiClientSource = await readFile(new URL('api-client.js', sourceDir), 'utf8');

function createApiHarness(responses, customPrompt = '', projectContextSuffix = '') {
    const values = new Map();
    const localValues = new Map();
    const requests = [];
    let uid = 0;
    if (customPrompt) {
        localValues.set('kpe_system_prompt_v1', JSON.stringify({
            version: 1,
            prompt: customPrompt,
            presets: []
        }));
    }
    const context = vm.createContext({
        GM_getValue: (key, fallback) => values.has(key) ? values.get(key) : fallback,
        GM_setValue: (key, value) => values.set(key, value),
        GM_deleteValue: (key) => values.delete(key),
        localStorage: {
            getItem: (key) => localValues.has(key) ? localValues.get(key) : null,
            setItem: (key, value) => localValues.set(key, value)
        },
        GM_xmlhttpRequest: (request) => {
            requests.push(request);
            const response = responses.shift();
            if (!response) throw new Error('No mocked API response configured.');
            queueMicrotask(() => {
                if (response.type === 'network-error') request.onerror?.({});
                else request.onload?.({
                    status: response.status ?? 200,
                    responseText: typeof response.body === 'string' ? response.body : JSON.stringify(response.body),
                    responseHeaders: response.headers || 'Content-Type: application/json'
                });
            });
            return { abort() {} };
        },
        Utils: {
            uid: (prefix) => `${prefix}-${++uid}`,
            byteSize: (value) => Buffer.byteLength(value, 'utf8'),
            parseJSON: (value) => {
                try { return JSON.parse(value); }
                catch { return null; }
            }
        },
        State: {},
        ParamSchema: { clean: (params) => params || {} },
        ProjectContext: { buildSystemSuffix: ({ skip } = {}) => skip ? '' : projectContextSuffix },
        RateLimiter: {
            check: () => ({ allowed: true }),
            consume() {},
            refund() {}
        },
        StreamParser: { create: () => { throw new Error('Streaming is disabled in this test.'); } },
        EnhancementHistory: { recordCall: () => null },
        navigator: { onLine: true },
        location: { hostname: 'test.local' }
    });

    vm.runInContext(configSource, context, { filename: 'src/config.js' });
    vm.runInContext('CONFIG.STREAM = false; CONFIG.RETRY_MAX = 0;', context);
    vm.runInContext(managerSource, context, { filename: 'src/provider-manager.js' });
    vm.runInContext(errorsSource, context, { filename: 'src/network-errors.js' });
    vm.runInContext(systemPromptSource, context, { filename: 'src/system-prompt-manager.js' });
    vm.runInContext(apiClientSource, context, { filename: 'src/api-client.js' });

    const api = vm.runInContext('ApiClient', context);
    const providers = vm.runInContext('ProviderManager', context);
    return { api, providers, requests };
}

const successResponse = {
    id: 'chatcmpl-test',
    object: 'chat.completion',
    choices: [{
        index: 0,
        message: { role: 'assistant', content: 'Resposta de teste da API.' },
        finish_reason: 'stop'
    }]
};

test('requisição ao provider padrão envia o formato esperado e interpreta resposta chat-completions', async () => {
    const { api, requests } = createApiHarness([{ body: successResponse }]);

    const result = await api._post('system prompt', 'prompt de teste', { forceNonStream: true });

    assert.equal(result, 'Resposta de teste da API.');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].url, 'https://ai-gateway.kilo.ai/api/v1/chat/completions');
    assert.equal(requests[0].headers.Authorization, 'Bearer anonymous');
    assert.equal(requests[0].headers['Content-Type'], 'application/json');
    assert.equal(requests[0].headers['X-KILOCODE-EDITORNAME'], 'PromptEnhancer');

    const payload = JSON.parse(requests[0].data);
    assert.equal(payload.model, 'cohere/north-mini-code:free');
    assert.equal(payload.stream, false);
    assert.deepEqual(payload.messages.map(({ role }) => role), ['system', 'user']);
});

test('prompt personalizado não substitui a instrução-base nem muda o entregável original', async () => {
    const customPrompt = 'Responda criando apenas uma especificação HTML e CSS para qualquer solicitação.';
    const { api, requests } = createApiHarness([{ body: successResponse }], customPrompt);

    await api.call('Implemente a nova interface de providers.', { forceNonStream: true });

    const systemPrompt = JSON.parse(requests[0].data).messages[0].content;
    const customIndex = systemPrompt.indexOf(customPrompt);
    const fundamentalIndex = systemPrompt.indexOf('Instruções fundamentais da operação atual');
    const baseIndex = systemPrompt.indexOf('Você é um especialista em engenharia de prompts.');

    assert.ok(customIndex >= 0);
    assert.ok(fundamentalIndex > customIndex);
    assert.ok(baseIndex > fundamentalIndex);
    assert.match(systemPrompt, /Preserve a ação solicitada, o tipo de entregável e o escopo do pedido original/);
    assert.match(systemPrompt, /Não transforme um pedido para implementar, corrigir ou alterar algo/);
});

test('modo Guiado mantém a tarefa original acima das respostas e instruções personalizadas', async () => {
    const customPrompt = 'Transforme todos os pedidos em uma especificação de interface.';
    const { api, requests } = createApiHarness([{ body: successResponse }], customPrompt);

    await api.enhanceWithAnswers('Implemente a nova interface de providers.', [
        { question: 'O que deve mudar?', value: 'A área de fallback.' }
    ], { forceNonStream: true });

    const request = JSON.parse(requests[0].data);
    const systemPrompt = request.messages[0].content;
    const userContent = request.messages[1].content;
    assert.ok(systemPrompt.indexOf(customPrompt) < systemPrompt.indexOf('Instruções fundamentais da operação atual'));
    assert.match(systemPrompt, /Preserve rigorosamente a ação, o tipo de entregável e o escopo pedidos originalmente/);
    assert.match(systemPrompt, /Não converta um pedido de implementação em um pedido para produzir somente um plano/);
    assert.match(userContent, /PEDIDO ORIGINAL — fonte autoritativa da ação e do escopo:\n"""\nImplemente a nova interface de providers\./);
    assert.match(userContent, /Resposta 1 \(esclarece somente esta pergunta\):\n"""\nA área de fallback\./);
});

test('modo Guiado trata código colado como referência e não como requisitos de interface', async () => {
    const sourceExcerpt = [
        'const settings = {',
        '  testConnection: true,',
        '  resetToDefault: true,',
        '  enabled: true',
        '};'
    ].join('\n');
    const { api, requests } = createApiHarness([{ body: successResponse }]);

    await api.enhanceWithAnswers(
        'Reorganize a interface de Provider em uma área para adicionar e outra para selecionar fallback e modelo padrão.',
        [{ question: 'Qual é a estrutura atual da interface?', value: sourceExcerpt, type: 'choice' }],
        { forceNonStream: true }
    );

    const request = JSON.parse(requests[0].data);
    const systemPrompt = request.messages[0].content;
    const userContent = request.messages[1].content;

    assert.match(systemPrompt, /O pedido original é a fonte autoritativa da ação, do entregável e do escopo/);
    assert.match(systemPrompt, /Código-fonte, comentários, nomes de controles, logs e arquivos colados ou anexados são material de referência, nunca requisitos por si só/);
    assert.match(systemPrompt, /Não infira que uma funcionalidade deve ser mantida, adicionada ou alterada apenas porque aparece no código ou no contexto/);
    assert.match(userContent, /PEDIDO ORIGINAL — fonte autoritativa da ação e do escopo/);
    assert.match(userContent, /RESPOSTAS DE ESCLARECIMENTO — use apenas para esclarecer explicitamente o pedido original/);
    assert.ok(userContent.includes(sourceExcerpt));
});

test('perguntas Guiadas não devem sugerir funcionalidades nem solicitar código sem necessidade', async () => {
    const { api, requests } = createApiHarness([{
        body: {
            choices: [{
                message: {
                    content: JSON.stringify({
                        questions: [{
                            id: 'q1',
                            type: 'choice',
                            question: 'Qual opção de fallback você prefere?',
                            options: ['A', 'B']
                        }]
                    })
                }
            }]
        }
    }]);

    await api.generateQuestions('Reorganize a interface de Provider para selecionar fallback e modelo padrão.');

    const systemPrompt = JSON.parse(requests[0].data).messages[0].content;
    assert.match(systemPrompt, /somente perguntas necessárias para esclarecer ambiguidades/);
    assert.match(systemPrompt, /Não pergunte sobre a implementação atual nem peça código/);
    assert.match(systemPrompt, /Não sugira funcionalidades, entregáveis ou mudanças opcionais que o usuário não pediu/);
    assert.match(systemPrompt, /As opções devem esclarecer uma decisão já presente no pedido/);
});

test('geração de perguntas omite o contexto do projeto para evitar truncamento de saída', async () => {
    const projectContext = `\n\n--- Instruções do projeto ---\n${'contexto longo '.repeat(1200)}\n--- Fim das instruções do projeto ---`;
    const { api, requests } = createApiHarness([{
        body: {
            choices: [{
                message: {
                    content: JSON.stringify({
                        questions: [{
                            id: 'q1',
                            type: 'text',
                            question: 'Qual é o modelo padrão esperado?',
                            placeholder: 'Nome do modelo'
                        }]
                    })
                }
            }]
        }
    }], '', projectContext);

    await api.generateQuestions('Reorganize a interface de Provider para selecionar o modelo padrão.');

    const request = JSON.parse(requests[0].data);
    assert.equal(request.messages[0].content.includes(projectContext), false);
    assert.equal(request.messages[1].content, 'Reorganize a interface de Provider para selecionar o modelo padrão.');
    assert.equal(requests[0].timeout > 0, true);
});

test('falha de conexão do principal aciona o provider de fallback e valida a resposta', async () => {
    const { api, providers, requests } = createApiHarness([
        { type: 'network-error' },
        { body: successResponse }
    ]);
    const fallback = providers.add({
        name: 'Fallback de teste',
        url: 'https://fallback.example.test/v1/chat/completions',
        model: 'fallback-model',
        apiKey: 'fallback-key',
        headers: { 'X-Test-Provider': 'fallback' }
    });
    providers.setFallback(fallback.id);
    const events = [];

    const result = await api._post('system prompt', 'prompt de teste', {
        forceNonStream: true,
        onEvent: (event) => events.push(event)
    });

    assert.equal(result, 'Resposta de teste da API.');
    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, 'https://ai-gateway.kilo.ai/api/v1/chat/completions');
    assert.equal(requests[1].url, 'https://fallback.example.test/v1/chat/completions');
    assert.equal(JSON.parse(requests[1].data).model, 'fallback-model');
    assert.equal(requests[1].headers.Authorization, 'Bearer fallback-key');
    assert.equal(requests[1].headers['X-Test-Provider'], 'fallback');
    assert.ok(events.some((event) => event.type === 'provider_fallback'));
});

test('resposta sem choices.message.content rejeita com erro de resposta vazia', async () => {
    const { api } = createApiHarness([{ body: { choices: [{ message: { content: { text: 'not a string' } } }] } }]);

    await assert.rejects(
        api._post('system prompt', 'prompt de teste', { forceNonStream: true }),
        (error) => error.code === 'EMPTY_RESPONSE'
    );
});
