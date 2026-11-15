---
name: structured-userscript-audit
description: Audits Tampermonkey/Violentmonkey/Greasemonkey userscripts for metadata integrity, privileged-execution security, host isolation, DOM/CSP resilience, lifecycle correctness, and local-data governance. Use when the user shares a .user.js file, diff, or PR and asks for review, hardening, risk analysis, or "what could break"; also trigger when code is pasted with a critical-analysis request even without the word "audit". Do NOT trigger for style-only linting, pure "explain this line" questions, concept tutorials, refactoring without a risk question, or generic JavaScript that is not a userscript.
license: MIT
compatibility: claude-code, claude-ai, api
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*), Bash(grep:*)
metadata:
  version: 2.0.0
  domain: userscript-security, browser-extension-risk, dom-resilience, local-data-governance
  owner: userscript-maintenance
---

# Structured Userscript Audit

Auditoria que identifica **classes de falha elimináveis** em userscripts. Cada achado converte-se em artefato de regressão (teste, regra Semgrep, gate de CI ou verificação reproduzível) que falha antes da correção e passa depois.

## Roteamento

| Situação | Ação |
|---|---|
| `.user.js`, diff ou PR compartilhado + pedido de review/hardening/risco | **Executar** |
| Código colado + análise crítica, mesmo sem a palavra "auditoria" | **Executar** |
| "Explique esta linha/função" sem pergunta de risco | Ignorar |
| Formatação, renomeação, regra estilística | Ignorar — delegar a linter |
| Apenas uma dimensão ("só XSS") | Executar escopo restrito; não expandir |
| Repositório não trivial | Confirmar escopo antes de executar |
| JavaScript genérico, não userscript | Não executar |

## Pré-voo (confirmar só o que bloqueia; inferir o resto)

1. Escopo: arquivo, `src/`, ou diff.
2. Gerenciador-alvo: Tampermonkey / Violentmonkey / Greasemonkey / ScriptCat / genérico (define APIs `GM_*` e sandbox).
3. Hosts: `@match` cobre quais sites; onde injeta UI e intercepta eventos.
4. Confiança do host: página é confiável? Usuário digita dados sensíveis nela? (afeta D2/D6)
5. Restrições: APIs fixas, compatibilidade legada, deadline.

Sem input do usuário: **inferir e declarar suposições no topo do relatório**.

## Princípios operacionais

1. Evidência sobre opinião: cada achado cita `arquivo:linha` + fluxo metadado→API→sink + modo de falha.
2. Classe, não instância: reportar o antipadrão e o padrão que previne o próximo.
3. Explorabilidade sobre rótulo: `innerHTML` com string estática é LOW; com dado de `GM_getValue` é HIGH. Declarar alcançabilidade.
4. Teste ou não aconteceu: toda remediação inclui artefato de regressão.
5. Profundidade por dimensão, não por arquivo.
6. Ensino defensivo: vetor de ataque só para justificar a defesa.

## D1 — Integridade estrutural

1. Cabeçalho completo: `@name`, `@namespace`, `@version` semântica, `@description`, `@author`, `@match` específico, `@grant` mínimo, `@run-at` coerente.
2. `@match` sobre `@include`; `*://*/*` ou `https://*/*` sem justificativa é achado.
3. `@grant` mínimo: cada `GM_*` declarado tem uso real; grant declarado e não usado é superfície de ataque.
4. `@connect` explícito para todo host de `GM_xmlhttpRequest`/`GM_cookie`; `@connect *` exige justificativa forte.
5. `@require`/`@resource`: HTTPS, versão fixa; **ausência de SRI é achado `Medium`** (substituição silenciosa de CDN).
6. IIFE + `'use strict'` para não poluir `window` do host.
7. `@sandbox`: `@grant none` desabilita sandbox (Violentmonkey); verificar se é intencional.
8. `@run-at` coerente com a estratégia de montagem (`document-start` + observer vs. `document-idle` + seletor direto).

## D2 — Execução privilegiada

1. Segredos: nenhuma API key/token/senha hardcoded; credenciais via `GM_getValue` ou prompt.
2. `eval`/`new Function`/`setTimeout(string)` com argumento dinâmico → `Critical`.
3. **`eval` de resposta de `GM_xmlhttpRequest`** → `Critical`: execução remota sob privilégios `GM_*`; padrão documentado em malware que exfiltra `GM_info`.
4. `innerHTML`/`outerHTML`/`insertAdjacentHTML` com dado não sanitizado: rastrear `GM_getValue`/`prompt`/`fetch` → `textContent` ou DOMPurify.
5. `unsafeWindow` → `High`: quebra sandbox; exigir justificativa e mitigação.
6. Interceptação global de `fetch`/`XHR`: exigir `Proxy` ou restauração; vazamento entre requisições é `High`.
7. `GM_xmlhttpRequest` sem `onerror`/`ontimeout` → `Medium` (falha silenciosa).
8. `postMessage` com `'*'` e payload sensível → `High`; exigir `targetOrigin` explícito e validação de `event.origin`.

## D3 — Resiliência a DOM/CSP

1. Seletores: classes hasheadas (`._editor_22sit_47`) ou caminho DOM profundo → `Medium`; preferir `data-testid`/`aria-label`/`role`.
2. `setInterval` para detectar elementos → `Low/Medium`; `MutationObserver` é a alternativa esperada.
3. CSP: injeção de `<script>`/`<style>` inline pode ser bloqueada; fallback `GM_addStyle`/`GM_addElement`.
4. Shadow DOM fechado: `querySelector` falha; declarar limitação.
5. `stopPropagation` indiscriminado quebra o host; escopar por `closest('.pe-scope')`.
6. `waitForElement` com timeout + `MutationObserver`, não assunção de existência no `document-idle`.

## D4 — Isolamento e vazamento de contexto

1. Listeners globais (`window`/`document`) sem filtro de escopo capturam eventos do host.
2. Atribuição a `window.*` fora do namespace do script → `Medium`.
3. `GM_addStyle` com seletor amplo (`button { ... }`) afeta a página inteira; escopar por classe/atributo.
4. `postMessage`: `'*'` com dado sensível → `High` (ver D2.8).
5. `@noframes` ausente permite execução em iframes de terceiros; verificar intencionalidade.

## D5 — Arquitetura e ciclo de vida

1. Ordem de módulos em IIFE concatenada: `function` (hoisted) vs. `const` (TDZ) — dependência usada antes de definida.
2. Estado global/singleton deve ser resetado em navegação SPA; vazamento entre "páginas" do host → `Medium`.
3. `mount`/`destroy` pareados: `MutationObserver.disconnect()`, `removeEventListener` ou **`AbortController`**, `GM_unregisterMenuCommand` correspondente a cada registro.
4. Migração de storage idempotente com flag `*_migrated`; chave legada removida só após leitura confirmada.
5. Limites `HISTORY_MAX`/`HISTORY_MAX_BYTES` respeitados; escrita concorrente em `GM_setValue` documentada.
6. Contrato `manifest.json`/`provides` vs. exports reais: divergência → `Medium`.
7. Duplicate-load guard (`if (window[GUARD]) return; window[GUARD] = 1`).

## D6 — Privacidade e dados locais

1. Classificação por campo: PII do usuário (prompts, contexto, código colado), API keys, tokens.
2. Minimização: campo coletado e não usado na finalidade declarada → `Medium`.
3. Retenção: `GM_setValue` sem limite/expiração → `Low/Medium`; dados persistem até remoção do script.
4. **`localStorage` vs. `GM_setValue`**: `localStorage` é acessível pela página e por outros scripts; uso para dado sensível → `High`.
5. Caminho de "reset": `GM_deleteValue` para cada chave sensível.
6. `console.log` de payload/prompt/token → `High` se console compartilhado.
7. `GM_notification`/`alert` não ecoa dado sensível.

## Armadilhas críticas (verificar explicitamente)

1. `@grant` excessivo — surface extra se comprometido.
2. `@connect *` sem justificativa — exfiltração para qualquer host.
3. `eval` de `GM_xmlhttpRequest.response` — RCE privilegiada.
4. `innerHTML` com dado de `GM_getValue`/`prompt` — XSS.
5. `@require` sem SRI — supply chain.
6. `unsafeWindow` — quebra de sandbox.
7. `setInterval` para montagem — polling frágil.
8. Seletores hasheados — quebram a cada deploy do host.
9. `fetch` global substituído sem restauração — efeito colateral em toda página.
10. Segredos hardcoded — histórico do repositório.
11. `postMessage('*')` com payload — vazamento.
12. `MutationObserver` sem `disconnect` / listeners sem `AbortController` — vazamento de memória.
13. `GM_setValue` sem limite de histórico — crescimento ilimitado.
14. `@noframes` ausente — execução em iframes de anúncios.
15. `console.log` com tokens/prompts — vazamento via DevTools.
16. `localStorage` para dado sensível — acessível ao host.

## Verificação determinística de metadados (aplicar como checklist)

| Check | Falha se |
|---|---|
| `@match` presente e não `*://*/*` | Ausente ou wildcard total |
| Todo `GM_*` do corpo tem `@grant` correspondente | `GM_*` sem grant |
| Todo host de `GM_xmlhttpRequest` em `@connect` | Requisição sem `@connect` |
| Todo `@require` de CDN tem `integrity` | CDN sem SRI |
| IIFE + `'use strict'` | Sem encapsulamento |
| `@run-at` coerente com a estratégia de montagem | Divergência |

## Trigger evals (rodar antes de release; meta ≥ 80% accuracy)

| should_trigger | should_not_trigger |
|---|---|
| "Revisa esse .user.js, quero saber se tem risco de XSS" | "Explique o que faz `MutationObserver.observe`" |
| "Auditoria de segurança nesse userscript do Tampermonkey" | "Formate esse código com Prettier" |
| "Esse PR tem problema de `@grant`?" | "Como funciona `GM_setValue`?" (conceito) |
| "O que pode quebrar se eu mudar esse `@match`?" | "Refatore para async/await" (sem risco) |
| "Harden this before I publish it" | "Write a userscript that changes the background" |
| "Check if my userscript leaks tokens in console" | "Diferença entre `localStorage` e `sessionStorage`" |
| "Review for `unsafeWindow` misuse" | "Lint this JavaScript file" |
| "Analise criticamente esse código de userscript" | "Traduza os comentários" |
| "Tem `eval` nesse script? Isso é seguro?" | "Qual a sintaxe correta de `@connect`?" |
| "Audit userscript supply chain" | "Crie um userscript que bloqueia anúncios" |

Teste de colisão: cada `should_trigger` ranqueia esta skill em top-1 ou top-3 entre skills instaladas; similaridade de `description` ≥ 75% com outra skill é erro de catálogo.

## Contrato de saída

| Campo | Conteúdo |
|---|---|
| **ID** | `D<n>.<k>` |
| **Título** | Uma linha, imperativo |
| **Local** | `arquivo:linha` + fluxo (`GM_getValue('x') → template → innerHTML`) |
| **Classe** | CWE-nnn / OWASP / metadado de userscript |
| **Severidade** | Critical / High / Medium / Low + justificativa de alcançabilidade |
| **Explorabilidade** | Requer interação? Host comprometido? Determinístico? |
| **Evidência** | Entrada, caminho, efeito observado. Sem payload armado além do necessário |
| **Remediação** | Código/biblioteca/padrão concreto |
| **Artefato de regressão** | Teste / regra Semgrep / verificação de metadado / gate de CI |
| **Esforço** | S / M / L |

Ordenar por (Severidade × Explorabilidade × Alcançabilidade). Agrupar por lote de remediação.

**Sumário obrigatório no topo**: escopo, suposições, dimensões aplicadas, contagem por severidade, correção de maior prioridade.

## Estados terminais

- `DONE` — escopo coberto, seis dimensões aplicadas.
- `DONE_WITH_CONCERNS` — cobertura limitada por escopo/acesso; declarar o que não foi coberto e risco residual.
- `NEEDS_INPUT` — bloqueado por informação necessária para julgar alcançabilidade; listar a pergunta exata.
- `BLOCKED` — código/acesso/ambiente ausente; declarar o que falta.

Não rebaixar cobertura silenciosamente. Se uma dimensão foi pulada, declarar no sumário.

## Handoff

| Situação | Encaminhamento |
|---|---|
| Validação em runtime (XSS, CSP, vazamento entre requisições) | Recomendar teste em perfil separado; fornecer formato |
| Supply chain (`@require` sem SRI) | Delegar a SCA; fornecer check e gate de CI |
| Conformidade (GDPR/LGPD sobre dados locais) | Sinalizar jurídico; fornecer evidência técnica |
| Decisão arquitetural entre times | Stub de ADR com contexto/decisão/consequências |
| Falso positivo | Declarar por quê, citar contra-fluxo, recomendar supressão justificada |

## O que esta skill não faz

- Exploits armados, fuzzers, ferramentas de ataque.
- Aprovação/rejeição por estilo ou nomenclatura (delegar a linter).
- Suposição de conformidade sem evidência no código.
- Veredito "parece ok" sem declarar dimensões checadas e puladas.
- Modificação de código sem consentimento explícito.
- Auditoria de JavaScript genérico fora do modelo de userscript.
- Substituição de validação em runtime para achados dependentes do host.