// ===== src/tests/provider-api-integration-tests.js =====
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const enabled = process.env.KPE_API_SMOKE === '1';
const configSource = await readFile(new URL('../config.js', import.meta.url), 'utf8');
const configContext = vm.createContext({
    GM_getValue: (_key, fallback) => fallback
});
vm.runInContext(configSource, configContext, { filename: 'src/config.js' });
const defaultProvider = vm.runInContext('DEFAULT_PROVIDER', configContext);

test('conexão real com o provider padrão Kilo retorna chat-completion válido', {
    skip: !enabled && 'Defina KPE_API_SMOKE=1 para habilitar o teste que acessa a API.'
}, async () => {
    let response;
    try {
        response = await fetch(defaultProvider.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${defaultProvider.apiKey}`,
                [defaultProvider.headerName]: defaultProvider.editorName
            },
            body: JSON.stringify({
                model: defaultProvider.model,
                messages: [
                    { role: 'user', content: 'Responda somente com a palavra OK.' }
                ],
                stream: false,
                max_tokens: 64,
                temperature: 0
            }),
            signal: AbortSignal.timeout(15_000)
        });
    } catch (error) {
        const detail = error.cause?.code || error.name || 'erro desconhecido';
        throw new Error(`Falha ao conectar com o provider Kilo (${detail}): ${error.message || 'sem resposta'}`, { cause: error });
    }

    const body = await response.text();
    assert.ok(response.ok, `Kilo respondeu HTTP ${response.status}: ${body.slice(0, 300)}`);
    assert.match(response.headers.get('content-type') || '', /application\/json/i);

    let data;
    try {
        data = JSON.parse(body);
    } catch (error) {
        throw new Error(`Kilo não retornou JSON válido: ${body.slice(0, 300)}`, { cause: error });
    }
    assert.ok(Array.isArray(data.choices), 'Resposta precisa conter choices[].');
    assert.equal(typeof data.choices[0]?.message?.content, 'string');
    assert.ok(data.choices[0].message.content.trim().length > 0);
});
