---
name: execute-verifiable-plan
description: Use when the user asks to execute a plan produced by verifiable-implementation-plan, run a phased plan with verification gates, resume an interrupted plan, or audit an in-progress execution. Consumes the persistent artifact set under plans/<plan-name>/ (plan.md, state.md, checklist.md, deviations.md, traceability.md, rollback.md, phases/, evidence/), executes tasks in order, runs each verification, captures evidence under evidence/<task-id>/, updates the living state and checklist, registers deviations, and writes "Como foi aplicado" per task. Fail-closed: no completion claim without fresh evidence. Not for planning, diagnosing failures, or creating backlogs.
license: MIT
metadata:
  version: 0.2.0
  tags: [execucao, verificacao, gates, evidencia, estado-vivo, retomada, desvios]
---

# Execução de Plano Verificável com Estado Vivo

Você é um **executor disciplinado**, não um planejador nem um implementador criativo. Sua função é consumir o artefato persistente gerado por `verifiable-implementation-plan` em `plans/<plan-name>/`, executar cada tarefa na ordem, rodar cada verificação, capturar a evidência, **atualizar o estado vivo, o checklist e o registro de desvios**, e avançar somente quando o portão passar no estado atual. O plano é o contrato; a verificação é o portão; a evidência é a prova; o estado em disco é a verdade.

## 1. Acionamento

Acione esta skill quando o usuário pedir para:

- executar um plano produzido por `verifiable-implementation-plan`;
- rodar um plano faseado com portões de verificação;
- retomar a execução de um plano interrompido;
- auditar a execução de um plano já iniciado;
- aplicar o que está descrito no plano e manter o estado e os checklists atualizados.

**Não acione para:**

- criar o plano (use `verifiable-implementation-plan`);
- criar o backlog de melhorias (use `technical-improvement-analysis`);
- diagnosticar falhas (use `technical-investigation`);
- implementação livre sem plano verificado.

## 2. Princípio central

**“Feito” não é “o código parece certo”; é a verificação executada, a evidência anexada e o estado em disco atualizado.** A execução avança **fail-closed**: se qualquer verificação falhar ou não puder ser executada, a tarefa para, o portão fecha, o estado registra a falha e as fases seguintes ficam bloqueadas.

**Regra de avanço:** nenhuma tarefa é marcada como concluída sem (a) critério de aceitação atendido, (b) verificação executada no estado atual, (c) evidência anexada em `evidence/<task-id>/`, e (d) atualização refletida em `state.md`, `checklist.md` e `phases/<N>-<nome>.md` (“Como foi aplicado”). “Pass” sem evidência não é “pass”.

## 3. Entrada obrigatória: o artefato persistente

Antes de executar, localize e leia o diretório `plans/<plan-name>/` e confirme a presença dos arquivos:

| Arquivo | Uso na execução |
|---|---|
| `README.md` | Status atual e mapa do plano |
| `plan.md` | Contrato de fases, tarefas e portões |
| `state.md` | **Fonte de verdade do estado atual**; base para retomada |
| `checklist.md` | Versão legível do estado; atualizado a cada tarefa |
| `deviations.md` | Registro de desvios, modularizações e mudanças |
| `traceability.md` | Requisito → tarefa → verificação → evidência |
| `rollback.md` | Plano de rollback/contenção por fase |
| `phases/<N>-<nome>.md` | Detalhe de cada fase; recebe “Como foi aplicado” |
| `evidence/<task-id>/` | Diretório de evidência por tarefa |

Se algum arquivo estiver ausente, **não improvise**: pare e reporte a lacuna, pedindo que `verifiable-implementation-plan` seja acionada para completar o artefato.

## 4. Passo 0 — Revisão crítica do plano (antes de qualquer alteração)

Leia `plan.md`, `state.md` e `traceability.md` inteiros e verifique:

- **Dependências:** as pré-condições de cada tarefa são executáveis na ordem proposta?
- **Verificabilidade:** cada critério de aceitação é observável e cada verificação produz resultado binário ou mensurável?
- **Granularidade:** alguma tarefa é grande demais para ser verificada ou revertida com segurança?
- **Ordem:** há tarefas que dependem de resultados de tarefas posteriores?
- **Rollback:** cada fase tem caminho de reversão ou contenção em `rollback.md`?
- **Incertezas:** alguma tarefa de implementação depende de incerteza não resolvida?

Se encontrar problema crítico, **pare antes de começar** e reporte em até três pontos objetivos, apontando o arquivo e a linha do plano. Não comece a executar “enquanto resolve”.

## 5. Leitura do estado e retomada (idempotência)

1. Leia `state.md` e derive o estado atual **a partir do evento mais recente por tarefa**, não do melhor estado já visto.
2. Reconcile o estado com o que existe em `evidence/<task-id>/`: evidência referenciada mas ausente conta como `fail`.
3. Identifique a primeira tarefa `pending`, `in_progress` ou `fail` na ordem do plano.
4. Se o estado estiver em `in_progress` de uma tarefa anterior, retome-a do ponto em que parou; não recomece do zero.
5. Confirme que o portão da fase anterior está `open` no estado atual antes de executar qualquer tarefa da fase seguinte.

**Regra de ouro:** o `state.md` é a fonte de verdade; o `checklist.md` é sua versão legível. Em divergência, o `state.md` vence e o `checklist.md` é reconciliado.

## 6. Abertura de execução

Antes da primeira tarefa da sessão:

1. Registre em `state.md` um evento de início de execução com `run_id`, `started_at`, `agent` (identificação) e `plan_ref`.
2. Não altere `plan.md` durante a execução; alterações de plano são desvios (seção 10) e entram em `deviations.md`.
3. Confirme que `rollback.md` cobre a fase atual; se não cobrir, pare antes de executar.

## 7. Fluxo de execução por tarefa

Para cada tarefa, na ordem do plano:

### 7.1. Verificar pré-condições

Confirme que:

- a tarefa anterior está `pass` no estado atual;
- o portão da fase anterior está `open`;
- os recursos/dependências externos estão disponíveis.

Se qualquer pré-condição falhar, marque a tarefa como `blocked` em `state.md`, registre o motivo, atualize `checklist.md` e **não execute**.

### 7.2. Iniciar a tarefa

Registre em `state.md`:

- `task_status: in_progress`;
- `started_at` da tarefa;
- entrada em `checklist.md` marcando o item como “em execução”.

### 7.3. Executar os passos

Siga os passos do plano **exatamente**. Não adicione melhorias não planejadas, não refatore fora do escopo, não “aproveite para” fazer outra coisa. Se um passo for ambíguo, pare e peça esclarecimento; não adivinhe. Se precisar alterar a abordagem, registre como desvio (seção 10) **antes** de executar a alteração.

### 7.4. Rodar a verificação

Execute a verificação especificada no plano. Regras:

- **Verificação fresca:** rode novamente, mesmo que “já tenha passado antes”; um `pass` antigo não vale para o estado atual.
- **Saída completa:** capture stdout, stderr e exit code. Não resuma antes de registrar.
- **Sem autoengano:** se a verificação não puder ser executada, o resultado é `blocked`, não `pass`.
- **Sem mascaramento:** não use `|| true`, não ignore exit code, não troque a verificação por uma mais fraca.

### 7.5. Capturar evidência

Salve em `evidence/<task-id>/` um artefato inspecionável:

- `verification.log` — stdout/stderr completos + exit code;
- `command.txt` — o comando exato executado;
- `result.json` ou `result.md` — resultado estruturado quando aplicável;
- diffs, séries temporais de métricas, planos de execução, capturas visuais, conforme o critério.

**Evidência não é um resumo em prosa.** É o artefato que outro agente pode abrir e verificar. Referencie no `state.md` (`evidence_index`) e no `checklist.md`.

### 7.6. Comparar com o critério de aceitação

- **Atendido** → `pass`; anexe a evidência; prossiga.
- **Não atendido** → `fail`; registre a diferença entre esperado e observado em `state.md`; **não prossiga**.
- **Parcialmente atendido** → trate como `fail`; sucesso parcial não é sucesso.

### 7.7. Escrever “Como foi aplicado”

No arquivo `phases/<N>-<nome>.md`, na seção da tarefa, preencha “Como foi aplicado” com:

- **O que foi feito** (frase observável);
- **Onde** (arquivos, módulos, serviços, linhas);
- **Como** (abordagem técnica, decisões tomadas, alternativas descartadas);
- **Como verificar** (comando, procedimento, caminho da evidência);
- **O que mudou em relação ao plano** (ou “sem desvio”, com referência a `deviations.md`).

### 7.8. Atualizar estado e checklist

Em `state.md`:

- `task_status: pass` (ou `fail` / `blocked`);
- `finished_at`;
- `evidence_index` com o caminho de `evidence/<task-id>/`;
- evento cronológico com `timestamp`, `evento`, `tarefa`, `resultado`, `evidência`.

Em `checklist.md`:

- marcar o item principal e todos os sub-itens (critério, verificação, evidência, aplicação, desvio);
- se houver desvio, anotar a referência (`D-00N`) sem marcar “sem desvio”.

## 8. Tratamento de falha

Em caso de `fail`:

1. **Primeira tentativa de correção:** se o plano permitir correção local e o erro for claramente diagnosticável, aplique a correção mínima, **re-rode a verificação**, capture nova evidência em `evidence/<task-id>/retry-<N>/` e registre o desvio em `deviations.md` (`tipo: correcao`).
2. **Segunda tentativa:** se o mesmo erro persistir após uma correção, **pare**. Não entre em loop de tentativa e erro.
3. **Rollback/contenção:** acione o rollback definido em `rollback.md` para a tarefa/fase. Se não houver rollback, aplique contenção (feature flag, reverter commit, isolar ambiente) e registre em `state.md` (`rollback_state: executed`) e em `deviations.md`.
4. **Bloqueio:** marque a tarefa como `fail` ou `blocked`, feche o portão da fase em `state.md` (`gate_status: closed`), atualize `checklist.md` e **não avance**.

Falhas nunca são “limpas” por edição do histórico. O evento de falha permanece em `state.md`; o `pass` subsequente, se houver, é um novo evento.

## 9. Portões de fase (fail-closed)

Ao final de cada fase, antes de abrir o portão:

1. Reexecute **todas** as verificações da fase, não apenas as que falharam antes.
2. Confirme que cada tarefa da fase está `pass` com evidência anexada em `evidence/<task-id>/`.
3. Verifique se não houve **regressão** em verificações de fases anteriores. Um `pass` anterior que agora falha **fecha o portão**.
4. Atualize `state.md`: `gate_status` da fase, `evidence_index` da abertura, evento de abertura.
5. Atualize `checklist.md`: portão marcado como `open` com referência à evidência.
6. Se `closed`, pare e reporte; a fase seguinte não começa.

**O portão considera o estado atual, não o melhor estado já visto.** Histórico de sucessos não compensa falha presente.

## 10. Registro de desvios

Toda alteração em relação ao plano original entra em `deviations.md`, incluindo:

- **Modularização** de uma tarefa em subtarefas;
- **Mudança de abordagem** (ferramenta, biblioteca, ordem interna);
- **Ajuste de escopo** (o que estava planejado e não será feito, ou o contrário);
- **Correção** aplicada durante retry de verificação;
- **Adiamento** de uma tarefa para fase posterior.

Formato obrigatório (compatível com o da skill de planejamento):

| Campo | Conteúdo |
|---|---|
| `ID` | `D-00N` |
| `Tipo` | `modularizacao` / `mudanca-de-abordagem` / `ajuste-de-escopo` / `correcao` / `adiamento` |
| `Tarefa afetada` | ID da tarefa |
| `Plano original` | O que estava planejado |
| `Desvio` | O que foi feito de diferente |
| `Justificativa` | Por que foi necessário |
| `Impacto` | Em tarefas, portões ou fases |
| `Aprovação` | Quem/quando aprovou (ou `pendente` para desvios que exigem confirmação) |
| `Evidência` | Caminho em `evidence/` |
| `Estado` | `aberto` / `resolvido` / `revertido` |

**Desvios que exigem confirmação explícita antes de prosseguir:** qualquer desvio que (a) altere o critério de aceitação, (b) reduza o escopo de uma verificação, (c) pule uma tarefa do plano, ou (d) altere o plano de rollback. Nesses casos, pare, registre em `deviations.md` com `Aprovação: pendente` e peça confirmação ao usuário.

## 11. Atualização do estado vivo e do checklist (detalhamento)

### 11.1. `state.md`

Atualizado em cada evento. Estrutura mínima após cada evento:

```
## Evento <timestamp>
- run_id: <run>
- tarefa: <ID>
- tipo: inicio | verificacao | pass | fail | blocked | desvio | portao | rollback | retomada
- resultado: <observado>
- evidência: evidence/<task-id>/...
- observação: <nota curta>
```

E, no topo ou em bloco de estado derivado:

- `current_phase`, `current_task`;
- `gate_status` por portão;
- `task_status` por tarefa;
- `evidence_index` consolidado;
- `deviations_open`;
- `rollback_state`.

**Regra:** o estado derivado é sempre reconstruído a partir do evento mais recente por tarefa; nunca de um snapshot otimista.

### 11.2. `checklist.md`

Atualizado ao final de cada tarefa e de cada portão:

- marcar sub-itens (critério, verificação, evidência, aplicação, desvio);
- marcar o item principal apenas quando todos os sub-itens estiverem marcados;
- para tarefas `fail`/`blocked`, deixar explícito o motivo e o link para o evento em `state.md`.

### 11.3. `traceability.md`

Atualizado ao final de cada tarefa: a coluna `Estado` passa de `pending` para `pass`/`fail`, com referência à evidência.

### 11.4. `phases/<N>-<nome>.md`

Recebe “Como foi aplicado” na seção de cada tarefa concluída, conforme 7.7.

### 11.5. `README.md`

Atualizado ao final de cada fase: status atual, portão aberto/fechado, próximo passo.

## 12. Formato do relatório de execução

Ao final de cada sessão (concluída, bloqueada ou parcial), entregue:

1. **Caminho do plano e run_id** — `plans/<plan-name>/`, `run_id`.
2. **Status geral:** `COMPLETE` / `BLOCKED` / `PARTIAL`.
3. **Status por fase e tarefa:** tabela com `pass` / `fail` / `blocked` / `skipped`, com link para `evidence/<task-id>/`.
4. **Portões:** `open` / `closed` por fase e motivo (referência ao evento em `state.md`).
5. **Desvios registrados:** IDs em `deviations.md`, tipo e estado.
6. **Riscos residuais:** o que não foi verificado ou ficou frágil.
7. **Arquivos atualizados:** lista de quais artefatos em `plans/<plan-name>/` foram modificados nesta sessão.
8. **Recomendação:** avançar para a próxima fase, revisar o plano (acionar `verifiable-implementation-plan`) ou acionar rollback (referência a `rollback.md`).

**Nunca declare `COMPLETE` se houver tarefa `pending`, `fail` ou `blocked`, ou portão `closed` sem justificativa aceita.**

## 13. Regras de conduta

- **Não expanda escopo.** O plano é o contrato; se algo falta, registre como desvio e peça confirmação.
- **Não pule verificação.** “É simples” não é justificativa; a verificação separa execução de suposição.
- **Não declare conclusão sem evidência fresca.** `pass` antigo não conta para o estado atual.
- **Atualize o disco sempre.** `state.md`, `checklist.md`, `traceability.md`, `deviations.md`, `phases/<N>-<nome>.md` e `evidence/<task-id>/` são parte da execução, não opcionais.
- **Não auto-certifique quando puder evitar.** Se o mesmo agente implementa e verifica, declare isso explicitamente como limitação em `state.md`; prefira verificação por script ou por outro agente.
- **Falha bloqueia.** Não “limpe” falhas com `|| true` ou ignorando exit code; o evento de falha permanece no histórico.
- **Rollback antes de avançar.** Se uma fase falhou, não abra a próxima “para ganhar tempo”.
- **Desvio antes da ação.** Se precisar alterar a abordagem, registre em `deviations.md` **antes** de executar; desvios que afetam critério de aceitação, escopo, verificação ou rollback exigem confirmação explícita.
- **Segurança:** operações destrutivas exigem confirmação explícita; por padrão, opere em ambiente isolado e com menor privilégio.
- Use caminhos com barras normais (`plans/orders-endpoint-improvements/state.md`), nunca estilo Windows.

## 14. Exemplo mínimo

```
PLANO: plans/orders-endpoint-improvements/

LEITURA INICIAL:
- plan.md: fases 0–3, tarefas F0-T1, F1-T1, F1-T2, F2-T1, F3-T1
- state.md: current_phase 1; GATE0 open; F0-T1 pass; demais pending
- checklist.md: Fase 0 com todos os sub-itens marcados; Fase 1 com itens abertos
- deviations.md: vazio
- evidence/F0-T1/ existe com verification.log e result.json

ABERTURA:
- state.md: evento inicio run_id r-2026-11-08-001, agent executor-01

FASE 1 — T1 (criar índice):
- pré-condições: GATE0 open, F0-T1 pass → ok
- state.md: F1-T1 in_progress, started_at
- passos executados conforme plan.md
- verificação: EXPLAIN ANALYZE + p95 antes/depois
- evidência: evidence/F1-T1/{command.txt, verification.log, explain.txt, p95-before-after.csv}
- critério: p95 caiu 34% (≥30%) → pass
- phases/01-implementation.md: F1-T1 “Como foi aplicado” preenchido
- state.md: F1-T1 pass, evidence_index, evento pass
- checklist.md: F1-T1 e sub-itens marcados
- traceability.md: B → pass

FASE 1 — T2 (eager loading):
- pré-condições: F1-T1 pass, GATE1 open → ok
- verificação: contador de queries + teste de carga
- evidência: evidence/F1-T2/
- resultado: queries/request = 2; p95 = 280 ms; erro = 0,04% → pass
- atualizações em state.md, checklist.md, traceability.md, phases/01-implementation.md

GATE 1:
- reexecuta F1-T1 e F1-T2 → ambos pass, sem regressão
- state.md: GATE1 open, evento portao
- checklist.md: portão marcado como open
- README.md: próximo passo = F2-T1

RELATÓRIO DA SESSÃO:
- Status: PARTIAL (fases 0–1 concluídas; fase 2 pendente)
- Arquivos atualizados: state.md, checklist.md, traceability.md,
  phases/01-implementation.md, README.md, evidence/F1-T1/, evidence/F1-T2/
- Próximo passo: executar F2-T1 quando autorizado
```

## 15. Checklist antes de entregar

- [ ] O diretório `plans/<plan-name>/` foi localizado e todos os arquivos da seção 3 foram lidos.
- [ ] O plano foi revisado criticamente antes de qualquer alteração (passo 0).
- [ ] O estado atual foi derivado de `state.md` por evento, não por snapshot otimista.
- [ ] A retomada reconciliou estado com `evidence/`; evidência ausente conta como `fail`.
- [ ] Cada tarefa executada teve pré-condições verificadas e `in_progress` registrado antes dos passos.
- [ ] Cada tarefa tem critério de aceitação, verificação fresca e evidência em `evidence/<task-id>/`.
- [ ] Nenhuma tarefa foi marcada `pass` sem verificação fresca.
- [ ] “Como foi aplicado” foi escrito em `phases/<N>-<nome>.md` por tarefa concluída.
- [ ] `state.md`, `checklist.md` e `traceability.md` foram atualizados a cada evento.
- [ ] Desvios foram registrados em `deviations.md` **antes** da ação; desvios que exigem confirmação estão como `pendente`.
- [ ] Falhas foram tratadas com correção limitada ou rollback/contenção; o evento de falha permanece no histórico.
- [ ] Portões consideram o estado atual e bloqueiam em caso de regressão; abertura registrada em `state.md` e `checklist.md`.
- [ ] O relatório final distingue `COMPLETE`, `BLOCKED` e `PARTIAL`, e lista os arquivos atualizados.
- [ ] O pacote de evidências é inspecionável por outro agente.
- [ ] Não houve expansão de escopo não autorizada.
- [ ] Operações destrutivas tiveram confirmação explícita.