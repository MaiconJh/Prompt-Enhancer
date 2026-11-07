// ===== src/tests/provider-default-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourceDir = new URL('../', import.meta.url);
const configSource = await readFile(new URL('config.js', sourceDir), 'utf8');
const i18nSource = await readFile(new URL('i18n.js', sourceDir), 'utf8');
const managerSource = await readFile(new URL('provider-manager.js', sourceDir), 'utf8');

function createProviderHarness(initialValues = {}) {
    // Força locale pt-BR por padrão para asserções determinísticas neste suite.
    // Testes que precisem de outro locale podem passar `pe_ui_language: 'en'|'auto'`.
    const merged = { pe_ui_language: 'pt-BR', ...initialValues };
    const values = new Map(Object.entries(merged));
    let uid = 0;
    const context = vm.createContext({
        GM_getValue: (key, fallback) => values.has(key) ? values.get(key) : fallback,
        GM_setValue: (key, value) => values.set(key, value),
        GM_deleteValue: (key) => values.delete(key),
        Utils: { uid: (prefix) => `${prefix}-${++uid}` },
        window: { dispatchEvent: () => {}, addEventListener: () => {}, removeEventListener: () => {} }
    });

    vm.runInContext(configSource, context, { filename: 'src/config.js' });
    vm.runInContext(i18nSource, context, { filename: 'src/i18n.js' });
    context.I18n = context.window.I18n;
    vm.runInContext(managerSource, context, { filename: 'src/provider-manager.js' });
    const { defaultProvider, providerManager } = vm.runInContext(
        '({ defaultProvider: DEFAULT_PROVIDER, providerManager: ProviderManager })',
        context
    );

    return {
        defaultProvider,
        providerManager,
        values
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('Kilo é o provider padrão configurado', () => {
    const { defaultProvider } = createProviderHarness();
    assert.equal(defaultProvider.id, 'kilo');
    assert.equal(defaultProvider.name, 'Kilo');
    assert.equal(defaultProvider.url, 'https://ai-gateway.kilo.ai/api/v1/chat/completions');
    assert.equal(defaultProvider.model, 'cohere/north-mini-code:free');
    assert.equal(defaultProvider.apiKey, 'anonymous');
    assert.deepEqual(plain(defaultProvider.headers), {
        'X-KILOCODE-EDITORNAME': 'PromptEnhancer'
    });
});

test('primeira execução salva Kilo como único provider ativo', () => {
    const { providerManager } = createProviderHarness();

    const active = providerManager.getActive();
    const providers = providerManager.list();
    const resolved = providerManager.resolveForRequest();

    assert.equal(active.id, 'kilo');
    assert.equal(active.builtin, true);
    assert.equal(providers.length, 1);
    assert.equal(providers[0].id, 'kilo');
    assert.equal(resolved.primary.url, 'https://ai-gateway.kilo.ai/api/v1/chat/completions');
    assert.equal(resolved.primary.model, 'cohere/north-mini-code:free');
    assert.equal(resolved.primary.apiKey, 'anonymous');
    assert.deepEqual(plain(resolved.primary.headers), {
        'X-KILOCODE-EDITORNAME': 'PromptEnhancer'
    });
    assert.equal(resolved.fallback, null);
});

test('provider Kilo salvo na versão antiga migra para o endpoint e modelo funcionais', () => {
    const storedKilo = {
        id: 'kilo',
        name: 'Kilo (padrão)',
        url: 'https://api.kilo.ai/api/openrouter/chat/completions',
        model: 'kilo-auto/free',
        apiKey: 'anonymous',
        headers: { 'X-KILOCODE-EDITORNAME': 'PromptEnhancer' },
        builtin: true,
        fallback: false
    };
    const { providerManager, values } = createProviderHarness({
        pe_providers: JSON.stringify([storedKilo]),
        pe_active_provider: 'kilo',
        pe_providers_migrated: true
    });

    const active = providerManager.getActive();

    assert.equal(active.url, 'https://ai-gateway.kilo.ai/api/v1/chat/completions');
    assert.equal(active.model, 'cohere/north-mini-code:free');
    assert.equal(active.apiKey, 'anonymous');
    assert.equal(active.headers['X-KILOCODE-EDITORNAME'], 'PromptEnhancer');
    assert.equal(values.get('pe_kilo_gateway_migrated'), true);
});

test('migração Kilo preserva URL e modelo customizados', () => {
    const customizedKilo = {
        id: 'kilo',
        name: 'Kilo (padrão)',
        url: 'https://my-kilo-proxy.example/v1/chat/completions',
        model: 'custom-kilo-model',
        apiKey: 'custom-key',
        headers: {},
        builtin: true,
        fallback: false
    };
    const { providerManager } = createProviderHarness({
        pe_providers: JSON.stringify([customizedKilo]),
        pe_active_provider: 'kilo',
        pe_providers_migrated: true
    });

    const active = providerManager.getActive();

    assert.equal(active.url, customizedKilo.url);
    assert.equal(active.model, customizedKilo.model);
});

test('configuração legada customizada é preservada e passa a ser ativa', () => {
    const legacy = {
        pe_api_url: 'https://api.example.test/v1/chat/completions',
        pe_model: 'custom-model',
        pe_api_key: 'custom-key'
    };
    const { providerManager, values } = createProviderHarness(legacy);

    const providers = providerManager.list();
    const active = providerManager.getActive();

    assert.equal(providers.length, 2);
    assert.equal(providers[0].id, 'kilo');
    assert.equal(active.name, 'Meu provider (legado)');
    assert.equal(active.url, legacy.pe_api_url);
    assert.equal(active.model, legacy.pe_model);
    assert.equal(active.apiKey, legacy.pe_api_key);
    assert.equal(values.has('pe_api_url'), false);
    assert.equal(values.has('pe_model'), false);
    assert.equal(values.has('pe_api_key'), false);
});

test('valores legados padrão do Kilo não são importados como provider customizado', () => {
    const { providerManager } = createProviderHarness({
        pe_api_url: 'https://api.kilo.ai/api/openrouter/chat/completions',
        pe_model: 'kilo-auto/free',
        pe_api_key: 'anonymous'
    });

    const providers = providerManager.list();

    assert.equal(providers.length, 1);
    assert.equal(providers[0].id, 'kilo');
    assert.equal(providerManager.getActive().url, 'https://ai-gateway.kilo.ai/api/v1/chat/completions');
    assert.equal(providerManager.getActive().model, 'cohere/north-mini-code:free');
});

test('fallback só é resolvido quando escolhido e nunca pode ser também o principal', () => {
    const { providerManager } = createProviderHarness();
    const secondary = providerManager.add({
        name: 'Alternativo',
        url: 'https://api.example.test/v1/chat/completions',
        model: 'alternative-model'
    });

    assert.equal(providerManager.getFallback(), null);
    providerManager.setFallback(secondary.id);
    assert.equal(providerManager.getFallback().id, secondary.id);
    assert.equal(providerManager.resolveForRequest().fallback.id, secondary.id);

    providerManager.setActive(secondary.id);
    assert.equal(providerManager.getFallback(), null);
    assert.equal(providerManager.resolveForRequest().primary.id, secondary.id);
});
