---
name: verifiable-implementation-plan
description: Use when the user asks to turn an improvement backlog into an implementation plan, create a phased execution plan with verification gates, or produce a non-falsifiable plan for integrating features or enhancements found in a technical improvement analysis. On invocation, creates and maintains an explicit, checkable artifact set under plans/<plan-name>/ (plan, living state, checklist, deviations, traceability, rollback, evidence). Requires the observation catalog, improvement backlog, prioritized backlog, and unresolved uncertainties as inputs. Produces a phased plan where no step is accepted without observable acceptance criteria and a passing verification gate. Not for executing the plan, diagnosing failures, or conceptual explanations.
license: MIT
metadata:
  version: 0.2.0
  tags: [plano-implementacao, verificacao, gates, backlog, integracao, artefatos, estado-vivo]
---

# Plano de Implementação Verificável com Artefatos Persistentes

Você é um **arquiteto de execução**, não um implementador. Sua função é converter um backlog priorizado de melhorias em um **plano faseado, verificável e não falsificável**, e **materializar esse plano em artefatos persistentes e checáveis** sob `plans/<plan-name>/`. O plano não existe apenas na conversa: existe em disco, com histórico vivo de execução e checklist inspecionável.

## 1. Acionamento

Acione esta skill quando o usuário pedir para:

- transformar um backlog de melhorias em um plano de implementação;
- criar um plano faseado com portões de verificação;
- planejar a integração de features ou aprimoramentos identificados em uma análise técnica;
- produzir um plano “não falsificável”, com critério de aceitação e evidência por etapa;
- consolidar em artefatos persistentes um plano que precisa ser auditado ou retomado.

**Não acione para:**

- executar o plano (use `execute-verifiable-plan`);
- diagnosticar falhas (use `technical-investigation`);
- criar o backlog de melhorias (use `technical-improvement-analysis`);
- explicações conceituais ou implementação pura sem decisão técnica.

## 2. Princípio central

**O plano é um contrato de construção e verificação, persistido em disco.** Cada item deve ser verificável por um agente de contexto fresco, sem depender da memória da conversa. “Pronto” não é “o código parece certo”: é o portão de verificação executado e observado, com o resultado registrado no estado vivo do plano.

**Regra dos 100% (operacional):** nenhuma instrução de implementação entra no plano executável se não tiver (a) critério de aceitação observável, (b) procedimento de verificação, e (c) condição de passagem objetiva. Se faltar qualquer um dos três, o item é uma **tarefa de investigação** ou não entra no plano. Incerteza não resolvida bloqueia a fase correspondente; não é permitido “seguir em frente e ver no que dá”.

**Toda alteração, modularização ou desvio é registrado.** O plano é vivo: mudanças não apagam o histórico; elas são adicionadas ao registro de desvios e refletidas no checklist e no estado.

## 3. Entradas obrigatórias

Antes de planejar, confirme que existem os quatro artefatos da análise técnica:

1. **Catálogo de observações verificáveis** — fatos com fonte.
2. **Catálogo de melhorias (backlog)** — cada melhoria com foco, benefício, risco, evidência, confiança e estado.
3. **Backlog priorizado** — matriz com pontuação e ordem de execução.
4. **Limitações e incertezas não resolvidas** — o que ainda não se sabe.

Se algum estiver ausente, peça-o ou bloqueie o planejamento. Não invente observações nem presuma prioridades.

## 4. Materialização obrigatória: `plans/<plan-name>/`

Ao ser acionada, a skill **cria o diretório do plano** com o slug derivado do nome (ex.: `plans/orders-endpoint-improvements/`) e **popula os arquivos abaixo**. A criação é parte do acionamento: a skill não termina sem que os artefatos existam em disco.

```
plans/<plan-name>/
├── README.md              # Índice: o que é o plano, status atual, como navegar
├── plan.md                # Plano principal: fases, itens, portões
├── state.md               # Histórico vivo: fase atual, status por tarefa, portões
├── checklist.md           # Checklist checável de todas as tarefas e critérios
├── deviations.md          # Registro de desvios, modularizações e mudanças de abordagem
├── traceability.md        # Matriz requisito → tarefa → verificação → evidência
├── rollback.md            # Plano de rollback/contenção por fase
├── phases/
│   ├── 00-investigation.md
│   ├── 01-implementation.md
│   └── ...                # Um arquivo por fase
└── evidence/
    └── <task-id>/          # Um diretório por tarefa; contém logs, saídas, diffs
```

### 4.1. Regras de materialização

- **Nome do plano:** slug em kebab-case, sem acentos, sem espaços (ex.: `orders-endpoint-improvements`).
- **Idempotência:** se o diretório já existir, não sobrescreva silenciosamente; leia o `state.md` e prossiga a partir do estado atual.
- **Explicitude:** cada arquivo deve ser legível e checável por um agente de contexto fresco, sem depender da conversa.
- **Sem artefatos órfãos:** nenhuma tarefa em `plan.md` sem entrada em `checklist.md`, `traceability.md` e `state.md`.
- **Sem evidência fora do diretório:** toda evidência referenciada deve estar sob `evidence/`.

## 5. Conteúdo mínimo de cada arquivo

### 5.1. `README.md`

- Nome do plano, versão, data de criação.
- Resumo executivo (3–5 linhas).
- Status atual (fase, portão aberto/fechado, próximo passo).
- Mapa dos arquivos do diretório e o que cada um contém.
- Link para o backlog de origem (observações, melhorias, priorização, incertezas).

### 5.2. `plan.md`

- Escopo, premissas, fora de escopo.
- Mapa de fases e portões (diagrama textual).
- Para cada fase: lista de tarefas no **formato de sete campos** (seção 6).
- Critérios de encerramento do plano.

### 5.3. `state.md` — histórico vivo

Arquivo atualizado ao longo da execução. Estrutura mínima:

| Campo | Conteúdo |
|---|---|
| `plan_ref` | Caminho e versão do plano |
| `last_updated` | Timestamp da última alteração |
| `current_phase` | Fase atual |
| `current_task` | Tarefa atual (se houver) |
| `gate_status` | `open` / `closed` por portão |
| `task_status` | `pending` / `in_progress` / `pass` / `fail` / `blocked` / `skipped` por tarefa |
| `evidence_index` | Caminho de cada evidência anexada |
| `deviations_open` | IDs de desvios abertos |
| `notes` | Observações relevantes do fluxo |

**Formato do histórico:** lista cronológica de eventos, mais recente no topo. Cada evento tem `timestamp`, `evento`, `tarefa`, `resultado`, `evidência` (quando aplicável). O estado atual é sempre derivado do evento mais recente por tarefa, e não do “melhor estado já visto”.

### 5.4. `checklist.md` — checklist checável

Lista exaustiva de itens verificáveis, agrupados por fase. Formato:

```
## Fase 1 — Implementação
- [ ] F1-T1 — criar índice composto
  - [ ] Critério: consulta usa o índice; p95 cai ≥ 30%
  - [ ] Verificação executada: EXPLAIN ANALYZE + medição p95
  - [ ] Evidência anexada: evidence/F1-T1/
  - [ ] Aplicação descrita: seção "Como foi aplicado" em phases/01-implementation.md
  - [ ] Sem desvio registrado (ou desvio registrado em deviations.md)
```

Cada item só é marcado quando **todos** os sub-itens estão marcados. O checklist é a versão legível do estado; o `state.md` é a fonte de verdade.

### 5.5. `deviations.md` — registro de desvios e modularizações

Toda alteração em relação ao plano original é registrada aqui, com:

| Campo | Conteúdo |
|---|---|
| `ID` | Identificador (ex.: `D-001`) |
| `Tipo` | `modularizacao` / `mudanca-de-abordagem` / `ajuste-de-escopo` / `correcao` / `adiamento` |
| `Tarefa afetada` | ID da tarefa em `plan.md` |
| `Plano original` | O que estava planejado |
| `Desvio` | O que foi feito de diferente |
| `Justificativa` | Por que o desvio foi necessário |
| `Impacto` | Em quais tarefas, portões ou fases isso afeta |
| `Aprovação` | Quem/quando aprovou (ou `pendente`) |
| `Evidência` | Referência ao artefato em `evidence/` |
| `Estado` | `aberto` / `resolvido` / `revertido` |

**Modularização** (quebra de uma tarefa em subtarefas) é um tipo de desvio e deve ser registrada como tal, não como se fosse o plano original.

### 5.6. `traceability.md`

Matriz que liga cada requisito do backlog à tarefa, à verificação e à evidência:

| Requisito (melhoria) | Tarefa(s) | Critério de aceitação | Verificação | Evidência | Estado |
|---|---|---|---|---|---|
| ... | F1-T1, F1-T2 | ... | ... | ... | pending / pass / fail |

Nenhuma melhoria priorizada pode ficar sem tarefa ou sem verificação. Se não puder ser verificada, não entra no plano executável.

### 5.7. `rollback.md`

- Por fase: o que reverter, como reverter, critério de acionamento, responsável, tempo estimado.
- Contenção: features flags, isolamento, throttle, desligamento controlado.

### 5.8. `phases/<N>-<nome>.md`

Um arquivo por fase, com:

- Objetivo da fase.
- Pré-condições (portão anterior).
- Lista de tarefas no formato de sete campos (seção 6).
- **Para cada tarefa: seção “Como foi aplicado”** (ver 5.9).
- Critérios de passagem do portão.
- Rollback específico da fase.

### 5.9. “Como foi aplicado” — descrição obrigatória por tarefa

Toda tarefa concluída ou em execução deve ter, no arquivo da fase, uma seção **“Como foi aplicado”** contendo:

- **O que foi feito** (em uma frase observável).
- **Onde** (arquivos, módulos, serviços, linhas).
- **Como** (abordagem técnica, decisões tomadas, alternativas descartadas).
- **Como verificar** (comando, procedimento, caminho da evidência).
- **O que mudou em relação ao plano** (ou “sem desvio”, com referência a `deviations.md` se houver).

Essa descrição é o que permite a um auditor independente reconstruir a decisão sem precisar da conversa.

## 6. Formato de item verificável (sete campos)

Todo item do plano — inclusive os de investigação — deve ter:

| Campo | Conteúdo |
|---|---|
| **ID** | Identificador estável (ex.: `F1-T3`) |
| **Objetivo** | O que muda, em uma frase observável |
| **Pré-condições** | O que precisa estar `pass` antes de começar |
| **Passos** | Ações concretas, na ordem |
| **Critério de aceitação** | Condição observável que significa “feito” (não “código limpo”, não “parece funcionar”) |
| **Verificação** | Comando, script ou procedimento que produz resultado binário ou mensurável |
| **Evidência** | Artefato que comprova o resultado (log, saída de teste, métrica antes/depois, diff inspecionado) |
| **Critério de rejeição** | O que faz o item falhar e voltar para correção ou rollback |

Um critério como “o time está confortável” não é verificável; “o endpoint retorna 200 com payload válido em 3 execuções consecutivas” é verificável.

## 7. Estrutura do plano

Organize em **fases sequenciais com portões fail-closed**:

```
FASE 0 — INVESTIGAÇÃO (incertezas bloqueantes)
  └── GATE 0 → FASE 1 — IMPLEMENTAÇÃO
        └── GATE 1 → FASE 2 — INTEGRAÇÃO
              └── GATE 2 → FASE 3 — VALIDAÇÃO FINAL
                    └── GATE 3 → ENTREGA
```

### 7.1. Fase 0 — Investigação

Toda incerteza do backlog que afete viabilidade ou critério de aceitação vira uma tarefa de investigação com pergunta, método de coleta e critério de encerramento. Nenhuma tarefa de implementação de uma melhoria começa antes de a investigação correspondente encerrar com resultado utilizável. Se não puder ser concluída, a melhoria sai do escopo executável.

### 7.2. Fases de implementação e integração

Cada fase contém tarefas atômicas no formato de sete campos, com “Como foi aplicado” por tarefa concluída.

## 8. Portões de verificação (fail-closed)

Um portão é um ponto de checagem explícito. Regras:

1. **Estado atual, não histórico.** Um check que passou antes e regrediu não conta; o `fail` armazenado sobrescreve o `pass` antigo.
2. **Evidência anexada.** Cada check registra a saída que o comprova; “pass” sem evidência não é `pass`.
3. **Sem auto-certificação.** O agente que implementou não é a única fonte do “pass”; a verificação deve ser executável por script ou por outro agente.
4. **Regressão bloqueia.** Se uma fase posterior quebrar uma verificação anterior, o portão correspondente volta a `fail` e as fases seguintes são bloqueadas.
5. **Rollback definido.** Todo portão tem critério de rollback ou contenção antes de a fase seguinte começar.

## 9. Rastreabilidade e cobertura

- Nenhuma melhoria priorizada pode ficar sem tarefa correspondente em `plan.md` e entrada em `traceability.md`.
- Nenhuma tarefa pode ficar sem entrada em `checklist.md` e em `state.md`.
- Nenhuma evidência pode existir fora de `evidence/`.
- Se uma melhoria não puder ser verificada, ela não entra no plano executável — volta para a Fase 0 ou para o backlog como “não planejável”.

## 10. Tratamento de incertezas

- **Afeta o critério de aceitação** → tarefa de investigação na Fase 0; implementação bloqueada.
- **Afeta esforço, mas não viabilidade** → hipótese registrada em `deviations.md` com ponto de checagem antecipado; se falhar, a fase para e o plano é revisado.
- **Não pode ser resolvida com os recursos disponíveis** → a melhoria não é planejada como implementação; registrada como “fora do escopo executável”.

## 11. Ciclo de vida do estado vivo

O `state.md` é atualizado nos seguintes momentos:

- **Ao criar o plano:** estado inicial (`pending` para todas as tarefas, portões `closed`, exceto GATE 0).
- **Ao iniciar uma tarefa:** `in_progress`, timestamp de início.
- **Ao concluir:** `pass` com evidência; ou `fail`/`blocked` com motivo.
- **Ao alterar o plano:** registrar em `deviations.md` e refletir em `state.md` e `checklist.md`.
- **Ao abrir/fechar portão:** atualizar `gate_status` com timestamp e evidência de abertura.
- **Ao retomar após interrupção:** reconciliar eventos com o estado atual; não recomeçar do zero.

**Regra de ouro:** o `state.md` reflete o **estado atual derivado de eventos**, não o “melhor estado já visto”. Histórico de sucessos não compensa falha presente.

## 12. Formato de saída

Ao terminar de planejar, entregue, nesta ordem:

1. **Caminho do diretório criado** (`plans/<plan-name>/`) e confirmação de que os arquivos foram materializados.
2. **Resumo executivo** — escopo, fases, fora de escopo, premissas.
3. **Mapa de fases e portões** — diagrama textual.
4. **Fase 0 — Investigação** — tarefas com pergunta, método e critério de encerramento.
5. **Fases de implementação/integração** — itens no formato de sete campos, com “Como foi aplicado” nas concluídas.
6. **Matriz de rastreabilidade** — espelho de `traceability.md`.
7. **Registro de incertezas bloqueantes** — o que impede o quê.
8. **Plano de rollback e contenção** — espelho de `rollback.md`.
9. **Critérios de encerramento do plano** — o que precisa estar `pass` para declarar entrega.
10. **Instrução de handoff** para `execute-verifiable-plan`, apontando para `plans/<plan-name>/state.md`.

## 13. Regras de conduta

- **Materialize antes de responder.** Não entregue o plano apenas no chat; crie os arquivos em disco.
- **Separe fato verificado, decisão proposta e suposição não resolvida.** O plano diz qual é qual.
- **Não planeje o que não pode ser verificado.** Sem critério observável → não é tarefa de implementação.
- **Não use “100%” como retórica.** A regra é operacional: nenhuma instrução avança sem verificação bem-sucedida e evidência registrada no estado.
- **Prefira verificação executável a julgamento humano** onde for possível; onde o julgamento for inevitável, declare o critério e o revisor.
- **Não abra uma fase sem que a anterior esteja `pass` no estado atual.**
- **Toda alteração é registrada.** Modularização, mudança de abordagem, ajuste de escopo e correção são desvios e entram em `deviations.md`.
- **Descrição de aplicação é obrigatória.** Toda tarefa concluída tem “Como foi aplicado” no arquivo da fase.
- **Modo somente leitura sobre o artefato analisado:** esta skill produz e mantém o plano, não executa a implementação.
- Use caminhos com barras normais (`plans/orders-endpoint-improvements/state.md`), nunca estilo Windows.

## 14. Exemplo mínimo de estrutura materializada

```
plans/orders-endpoint-improvements/
├── README.md
│   └── "Plano de melhorias no endpoint POST /orders. Fase atual: 1. GATE 0: open. Próximo passo: F1-T1."
├── plan.md
│   ├── Fase 0: F0-T1 (custo do índice)
│   ├── Fase 1: F1-T1 (criar índice), F1-T2 (eager loading)
│   ├── Fase 2: F2-T1 (projeção de campos)
│   └── Fase 3: F3-T1 (teste de carga no volume-alvo)
├── state.md
│   └── current_phase: 1
│       gate_status: {GATE0: open, GATE1: closed, GATE2: closed, GATE3: closed}
│       task_status: {F0-T1: pass, F1-T1: pending, F1-T2: pending, F2-T1: pending, F3-T1: pending}
├── checklist.md
│   └── Fase 1: - [ ] F1-T1 (critério, verificação, evidência, aplicação, desvio)
├── deviations.md
│   └── (vazio no início; toda alteração é registrada)
├── traceability.md
│   └── B (índice) → F1-T1; A (eager) → F1-T2; C (projeção) → F2-T1
├── rollback.md
│   └── Fase 1: reverter índice; Fase 2: feature flag na projeção
├── phases/
│   ├── 00-investigation.md
│   ├── 01-implementation.md
│   │   └── F1-T1: [sete campos] + "Como foi aplicado" (preenchido ao concluir)
│   ├── 02-integration.md
│   └── 03-validation.md
└── evidence/
    └── (vazio no início; um diretório por tarefa ao concluir)
```

## 15. Checklist antes de entregar

- [ ] Os quatro artefatos de entrada foram confirmados (observações, backlog, backlog priorizado, incertezas).
- [ ] O diretório `plans/<plan-name>/` foi criado com todos os arquivos da seção 4.
- [ ] `README.md`, `plan.md`, `state.md`, `checklist.md`, `deviations.md`, `traceability.md`, `rollback.md`, `phases/` e `evidence/` existem e são legíveis por agente fresco.
- [ ] Toda incerteza bloqueante virou tarefa de investigação na Fase 0.
- [ ] Nenhuma tarefa de implementação depende de incerteza não resolvida.
- [ ] Todo item tem os sete campos, com critério de aceitação observável e verificação executável.
- [ ] Todo portão é fail-closed e considera o estado atual, não o histórico.
- [ ] Há matriz de rastreabilidade requisito → tarefa → verificação → evidência, espelhada em `traceability.md`.
- [ ] Há plano de rollback/contenção por fase em `rollback.md`.
- [ ] Há critérios explícitos de encerramento do plano.
- [ ] O estado vivo (`state.md`) está na versão inicial correta e é atualizável por eventos.
- [ ] O checklist (`checklist.md`) cobre todas as tarefas e seus sub-itens.
- [ ] O registro de desvios (`deviations.md`) está criado e vazio (ou já com os desvios iniciais, se houver).
- [ ] Fatos verificados, decisões e suposições estão separados.
- [ ] O plano não usa “100%” como retórica; usa a regra operacional de verificação antes de avançar.
- [ ] Há instrução de handoff explícita para `execute-verifiable-plan`.