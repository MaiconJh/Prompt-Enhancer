import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourceDir = new URL('../', import.meta.url);
const readSource = (name) => readFile(new URL(name, sourceDir), 'utf8');
const [
    configSource, catalogSource, discoverySource, registrySource, managerSource,
    errorsSource, systemPromptSource, apiClientSource
] = await Promise.all([
    readSource('config.js'),
    readSource('provider-catalog.js'),
    readSource('provider-discovery.js'),
    readSource('provider-registry.js'),
    readSource('provider-manager.js'),
    readSource('network-errors.js'),
    readSource('system-prompt-manager.js'),
    readSource('api-client.js')
]);

const discoveryData = {
    'openrouter.ai': { data: [
        { id: 'vendor/free-model:free', name: 'Free Model', pricing: { prompt: '0', completion: '0' }, context_length: 8192 },
        { id: 'vendor/paid-model', name: 'Paid Model', pricing: { prompt: '1', completion: '1' } }
    ] },
    'ai-gateway.kilo.ai': { data: [
        { id: 'amazon/nova-2-lite-v1', name: 'Amazon Nova 2 Lite', isFree: false, pricing: { prompt: '-1', completion: '-1' } },
        { id: 'vendor/free-model', name: 'Free Model', isFree: true, pricing: { prompt: '0', completion: '0' } },
        { id: 'vendor/suffix-free-model:free', name: 'Suffix Free Model', pricing: { prompt: '-1', completion: '-1' } }
    ] },
    'gen.pollinations.ai': { data: [{ id: 'pollinations-discovered' }] },
    'keylessai.thryx.workers.dev': { data: [{ id: 'keyless-discovered' }] }
};

function createHarness(responses = []) {
    const values = new Map();
    const requests = [];
    const events = [];
    let uid = 0;
    const context = vm.createContext({
        GM_getValue: (key, fallback) => values.has(key) ? values.get(key) : fallback,
        GM_setValue: (key, value) => values.set(key, value),
        GM_deleteValue: (key) => values.delete(key),
        GM_xmlhttpRequest: (request) => {
            if (request.method === 'GET') {
                requests.push(request);
                const host = new URL(request.url).hostname;
                queueMicrotask(() => request.onload?.({
                    status: 200,
                    responseText: JSON.stringify(discoveryData[host] || { data: [] })
                }));
                return { abort() {} };
            }
            requests.push(request);
            const response = responses.shift();
            if (!response) throw new Error('No mocked API response configured.');
            queueMicrotask(() => request.onload?.({
                status: response.status ?? 200,
                responseText: JSON.stringify(response.body),
                responseHeaders: 'Content-Type: application/json'
            }));
            return { abort() {} };
        },
        Utils: {
            uid: (prefix) => `${prefix}-${++uid}`,
            byteSize: (value) => Buffer.byteLength(value, 'utf8'),
            parseJSON: (value) => {
                try { return JSON.parse(value); } catch { return null; }
            }
        },
        State: {},
        ParamSchema: { clean: (params) => params || {} },
        ProjectContext: { buildSystemSuffix: () => '' },
        RateLimiter: { check: () => ({ allowed: true }), consume() {}, refund() {} },
        StreamParser: { create: () => { throw new Error('Streaming is disabled in this test.'); } },
        EnhancementHistory: { recordCall: () => null },
        localStorage: { getItem: () => null, setItem() {} },
        navigator: { onLine: true },
        location: { hostname: 'test.local' },
        console: { warn() {}, info() {} }
    });

    [configSource, catalogSource, discoverySource, registrySource, managerSource, errorsSource, systemPromptSource, apiClientSource]
        .forEach((source, index) => vm.runInContext(source, context, { filename: `provider-module-${index}.js` }));
    vm.runInContext('CONFIG.STREAM = false; CONFIG.RETRY_MAX = 0;', context);
    const apis = vm.runInContext('({ registry: ProviderRegistry, manager: ProviderManager, api: ApiClient })', context);
    return { ...apis, values, requests, events, context };
}

const successResponse = {
    choices: [{ message: { content: 'Resposta de teste.' }, finish_reason: 'stop' }]
};

test('catálogo síncrono começa com entradas curadas sem requisição de rede', async () => {
    const { registry, requests } = createHarness();
    const entries = registry.getCached();

    assert.ok(Array.isArray(entries));
    assert.ok(entries.some((entry) => entry.id === 'ovhcloud:Meta-Llama-3_3-70B-Instruct'));
    assert.ok(entries.some((entry) => entry.id === 'groq:llama-3.3-70b-versatile'));
    assert.equal(requests.length, 0);

    const hydrated = await registry.hydrate();
    assert.ok(hydrated.some((entry) => entry.id === 'openrouter:vendor/free-model:free' && entry.source === 'dynamic'));
    assert.ok(hydrated.some((entry) => entry.id === 'kilo:vendor/free-model'));
    assert.ok(!hydrated.some((entry) => entry.id === 'kilo:amazon/nova-2-lite-v1'));
    assert.ok(hydrated.some((entry) => entry.id === 'kilo:vendor/suffix-free-model:free'));
    assert.ok(!hydrated.some((entry) => entry.modelId === 'vendor/paid-model'));
    assert.ok(registry.list({ search: 'FREE MODEL' }).some((entry) => entry.providerId === 'openrouter'));
    assert.ok(registry.list({ keylessOnly: true }).every((entry) => entry.auth.type === 'none' || entry.auth.key === 'anonymous'));
    const groups = registry.groupByProvider(registry.list({ search: 'FREE MODEL' }));
    assert.deepEqual(Array.from(groups, (group) => group.providerId), ['kilo', 'openrouter']);
    assert.ok(groups.every((group) => group.entries.every((entry) => entry.providerId === group.providerId)));
    assert.ok(requests.filter((request) => request.method === 'GET').every((request) => request.timeout === 3000));
});

test('cache expirado é renovado na hidratação seguinte', async () => {
    const { registry, requests, values } = createHarness();
    await registry.hydrate();
    const initialRequestCount = requests.length;
    const cache = JSON.parse(values.get('kpe_provider_catalog_cache'));
    cache.fetchedAt -= 300_001;
    values.set('kpe_provider_catalog_cache', JSON.stringify(cache));

    await registry.hydrate();

    assert.equal(requests.length, initialRequestCount + 4);
    assert.ok(JSON.parse(values.get('kpe_provider_catalog_cache')).fetchedAt > cache.fetchedAt);
});

test('pin OVHcloud resolve rota sem chave e API envia o modelo fixado em __meta', async () => {
    const { manager, api, requests, events } = createHarness([{ body: successResponse }]);
    assert.equal(manager.pin('ovhcloud:Meta-Llama-3_3-70B-Instruct'), true);

    const pinned = manager.getPinned();
    assert.equal(pinned.modelId, 'Meta-Llama-3_3-70B-Instruct');
    const resolved = manager.resolveForRequest();
    assert.equal(resolved.primary.url, 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions');
    assert.equal(resolved.primary.authType, 'none');

    await api._post('system prompt', 'prompt de teste', {
        forceNonStream: true,
        onEvent: (event) => events.push(event)
    });
    assert.equal(JSON.parse(requests[0].data).model, 'Meta-Llama-3_3-70B-Instruct');
    assert.equal(requests[0].headers.Authorization, undefined);
    assert.ok(events.some((event) => event.type === '__meta' && event.meta.model === 'Meta-Llama-3_3-70B-Instruct'));
});

test('falha HTTP 429 em rota fixada tenta o fallback virtual Kilo e emite evento', async () => {
    const { manager, api, requests, events, values } = createHarness([
        { status: 429, body: { error: { message: 'rate limited' } } },
        { body: successResponse }
    ]);
    values.set('kpe_virtual_fallback_enabled', true);
    manager.pin('ovhcloud:Meta-Llama-3_3-70B-Instruct');

    const result = await api._post('system prompt', 'prompt de teste', {
        forceNonStream: true,
        onEvent: (event) => events.push(event)
    });

    assert.equal(result, 'Resposta de teste.');
    assert.equal(requests.length, 2);
    assert.equal(JSON.parse(requests[1].data).model, 'kilo-auto/free');
    assert.ok(events.some((event) => event.type === 'provider_fallback'));
});
