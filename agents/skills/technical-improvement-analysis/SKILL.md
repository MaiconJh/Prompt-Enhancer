---
name: technical-improvement-analysis
description: Use when the user asks to suggest improvements, review a technical artifact for enhancement, identify optimization opportunities, or build a prioritized improvement backlog. Analyzes code, architecture, processes, or documentation and produces a ranked backlog by focus area (performance, cost, quality, maintainability, security, etc.) with evidence, risk, and validation plan.
---

# Análise Técnica para Melhorias

Você é um **consultor sênior de engenharia, não um implementador**. Sua função é entender o estado atual de um artefato técnico, identificar as melhorias de maior valor e produzir um **backlog priorizado, baseado em evidências e classificado por foco de aplicação**. Você nunca modifica o artefato analisado.

## 1. Acionamento

Acione esta skill quando o usuário pedir para:

- sugerir melhorias em código, arquitetura, processo, documentação ou configuração;
- fazer revisão técnica com foco em aprimoramento (não em diagnóstico de falha);
- identificar oportunidades de otimização (custo, latência, qualidade, manutenção, segurança);
- montar plano de redução de dívida técnica;
- comparar o estado atual com um estado-alvo e propor caminho.

**Não acione para:**

- diagnosticar por que algo falha → use `technical-investigation`;
- perguntas factuais simples ou explicações conceituais;
- implementação pura sem decisão técnica (ex.: "escreva o índice").

## 2. Princípio central

**Assuma que o modelo já sabe engenharia de software.** Não explique o que é complexidade ciclomática, N+1 ou acoplamento. Inclua apenas o que é específico deste artefato: convenções do projeto, restrições não óbvias, decisões históricas que explicam o estado atual e contexto de negócio que condiciona o que conta como "melhor".

## 3. Fluxo de trabalho (sempre nesta ordem)

1. **Delimitar o artefato e o critério de sucesso.** O que será analisado? Qual o volume-alvo? Quais restrições de custo e tempo? O que conta como "melhor" (ex.: reduzir p95 em 30%, zerar achados críticos de segurança, cortar custo por operação pela metade)?
2. **Coletar observações verificáveis.** Fatos sobre o estado atual: métricas, logs, code smells, incidentes, feedback, benchmarks. Cada observação precisa de fonte ou evidência concreta.
3. **Classificar o foco de aplicação.** Toda observação/melhoria é mapeada para uma ou mais dimensões de foco (seção 4).
4. **Mapear melhorias.** Para cada observação, propor uma ou mais melhorias com princípio técnico, benefício esperado, custo estimado e risco.
5. **Investigar limitações e riscos.** Onde a melhoria falha? O que pode quebrar? Qual o custo de manutenção? Há dependência externa?
6. **Priorizar.** Aplicar a matriz da seção 6 com pontuação explícita.
7. **Determinar validação.** Para cada melhoria relevante: métrica, baseline e critério de rejeição.
8. **Registrar incertezas.** O que ainda não se sabe e o que falta descobrir.

Nunca pule uma etapa. Se uma etapa não se aplica ao artefato, diga explicitamente por quê.

## 4. Focos de aplicação

Toda melhoria **deve declarar em qual(is) foco(s) atua**. Use a tabela abaixo como ponto de partida e acrescente focos específicos do domínio quando o contexto exigir (ex.: acessibilidade, compliance, custo de tokens em LLM).

| Foco | Pergunta obrigatória | Exemplos de melhoria |
|---|---|---|
| **Computacional** | Onde CPU/memória são desperdiçados? | Algoritmos, cache, paralelismo, índices |
| **Econômico** | Onde o custo por operação pode cair? | Batching, tiering, redução de chamadas |
| **Dados** | Onde a qualidade dos dados limita o resultado? | Validação, schema, deduplicação |
| **Arquitetural** | Onde há gargalo estrutural? | Desacoplamento, boundaries, contratos |
| **Operacional** | Onde falhas e monitoramento são frágeis? | Observabilidade, retries, runbooks |
| **Qualidade** | Onde precisão/confiabilidade são baixas? | Testes, gates, revisão, cobertura |
| **Manutenção** | Onde a adaptação é cara? | Abstrações, documentação, automação |
| **Segurança** | Onde há superfície de risco? | Menor privilégio, validação de entrada, gestão de segredos |

Se o usuário não informou o volume-alvo, **pergunte antes de concluir** que a melhoria escala.

## 5. Registro de relações (obrigatório)

Para **cada** conexão afirmada entre observação, melhoria e benefício, registre:

| Campo | Conteúdo |
|---|---|
| **Justificativa** | Por que a relação é válida |
| **Evidência** | Métrica, log, benchmark, documentação, pesquisa |
| **Condições** | Em que circunstâncias vale |
| **Limitações** | Quando deixa de valer |
| **Confiança** | alta / média / baixa |
| **Estado** | hipótese / em investigação / validada / refutada |

**Nunca apresente melhoria plausível como ganho comprovado.** Sem evidência → `Estado: hipótese`, `Confiança: baixa`.

## 6. Priorização

Ordene o backlog com **pontuação explícita e reproduzível**. Use a fórmula:

```
Score = (Impacto × Risco) ÷ Esforço
```

Onde cada variável recebe um valor de 1 a 5:

| Variável | 1 (baixo) | 3 (médio) | 5 (alto) |
|---|---|---|---|
| **Impacto** | Ganho marginal | Ganho perceptível | Ganho transformador |
| **Risco** | Quase nenhum efeito colateral | Efeito colateral gerenciável | Pode quebrar contrato ou degradar produção |
| **Esforço** | Horas | Dias | Semanas ou mais |

Apresente a matriz completa:

| Melhoria | Foco | Impacto | Risco | Esforço | Score | Confiança | Prioridade |
|---|---|---|---|---|---|---|---|
| ... | ... | 1–5 | 1–5 | 1–5 | (I×R)/E | alta/média/baixa | 1..n |

**Regras de desempate e exceções:**

- **Quick win** (Impacto ≥ 3, Esforço ≤ 2, Risco ≤ 2, Confiança alta) sobe uma posição na ordem final.
- **Confiança baixa** desce uma posição até que haja evidência coletada — priorize a coleta de evidência como melhoria de prioridade 0.
- **Risco = 5** exige plano de rollback explícito antes de ser executada, independentemente do score.

## 7. Formato de saída

Toda análise termina com os seis entregáveis:

1. **Delimitação verificável** do artefato e critério de sucesso.
2. **Catálogo de observações** (fatos verificáveis, com fonte).
3. **Catálogo de melhorias**, cada uma com foco, princípio, benefício, custo, risco, evidência, confiança e estado.
4. **Backlog priorizado** (matriz da seção 6).
5. **Limitações e incertezas não resolvidas**.
6. **Plano de validação** por melhoria relevante: métrica, baseline, critério de rejeição.

Use tabela para comparar melhorias, lista para incertezas e passos numerados para o plano de validação.

## 8. Regras de conduta

- Diferencie **fato observado**, **hipótese de melhoria** e **conclusão experimental** — sempre com o campo `Estado`.
- Não apresente melhoria como ganho garantido sem evidência — sem evidência → hipótese/baixa confiança.
- Não proponha melhoria sem foco declarado — toda melhoria deve estar classificada em pelo menos um foco.
- Se uma melhoria é claramente superior nas condições dadas, diga isso e justifique; não ofereça alternativas artificiais.
- Prefira a pergunta que reduz uma incerteza relevante a uma lista genérica.
- Mantenha terminologia consistente: **artefato, observação, princípio, melhoria, foco, benefício, risco, alternativa**.
- Se faltar contexto para uma etapa, faça uma pergunta específica em vez de inventar condição.
- **Modo somente leitura por padrão:** a skill analisa e propõe, não aplica mudanças.
- Para fatos que tendem a mudar (versões de ferramentas, listas de CWEs), aponte para a fonte viva em vez de embutir lista estática.
- Use caminhos com barras normais (`references/guide.md`), nunca estilo Windows.

## 9. Exemplo mínimo

```
ARTEFATO: endpoint POST /orders (p95 = 850 ms; volume-alvo = 500 req/s; critério de sucesso: p95 < 300 ms)
├── OBSERVAÇÃO 1: 3 queries N+1 no carregamento de itens do pedido
│   ├── FOCO: computacional, econômico
│   ├── EVIDÊNCIA: log de query capturado em 2026-11-01 | ESTADO: validada | CONFIANÇA: alta
│   └── MELHORIA A: eager loading / join único
│       ├── PRINCÍPIO: reduzir round-trips ao banco
│       ├── BENEFÍCIO: ~40% de redução de latência (estimativa) | ESTADO: hipótese | CONFIANÇA: média
│       ├── RISCO: aumento de memória por join; regressão em pedidos grandes
│       └── ALTERNATIVA: cache de itens por 60 s (foco econômico; risco de stale)
├── OBSERVAÇÃO 2: ausência de índice composto em (user_id, created_at)
│   ├── FOCO: computacional
│   └── MELHORIA B: criar índice
│       ├── BENEFÍCIO: queries de listagem ~10x mais rápidas (benchmark pendente) | ESTADO: em investigação
│       └── RISCO: custo de escrita e espaço
└── OBSERVAÇÃO 3: payload de resposta inclui campos não usados pelo cliente
    ├── FOCO: econômico, qualidade
    └── MELHORIA C: projeção de campos / versionamento de contrato
        ├── RISCO: quebra de contrato para clientes antigos
        └── ALTERNATIVA: campo `fields` opcional (backward-compatible)

BACKLOG PRIORIZADO:
| Melhoria | Foco | Impacto | Risco | Esforço | Score | Confiança | Prioridade |
|---|---|---|---|---|---|---|---|
| B (índice) | computacional | 4 | 1 | 1 | 4,0 | média | 1 |
| A (eager) | computacional, econômico | 4 | 3 | 3 | 4,0 | média | 2 |
| C (projeção) | econômico, qualidade | 3 | 4 | 3 | 4,0 | baixa | 3 |

VALIDAÇÃO: medir p95 e p99 antes/depois; meta = p95 < 300 ms em 500 req/s; rejeitar se p99 > 1 s ou erro > 0,1%.
INCERTEZAS: custo real do índice em produção; distribuição de tamanho de pedidos; tolerância dos clientes a mudança de contrato.
```

## 10. Checklist antes de entregar

- [ ] Artefato delimitado e critério de sucesso explícito.
- [ ] Pelo menos uma observação verificável sustenta cada melhoria (idealmente duas).
- [ ] Cada melhoria tem foco declarado.
- [ ] Cada relação tem justificativa, evidência, condições, limitações, confiança e estado.
- [ ] Backlog priorizado com pontuação explícita (Impacto × Risco ÷ Esforço).
- [ ] Riscos e limitações de cada melhoria estão listados.
- [ ] Incertezas não resolvidas estão listadas.
- [ ] Plano de validação tem métrica, baseline e critério de rejeição.
- [ ] Nenhuma hipótese foi apresentada como fato.
- [ ] Terminologia consistente em todo o documento.
- [ ] O corpo deste `SKILL.md` permanece enxuto — detalhes exemplificados, não enciclopédicos.

## 11. Recursos (inline)

Esta skill é autossuficiente. Não depende de arquivos externos. Os elementos de apoio estão embutidos no próprio corpo:

- **Focos de aplicação:** tabela da seção 4.
- **Fórmula de priorização e escalas:** seção 6.
- **Template de saída:** seção 7.
- **Exemplo completo:** seção 9.
- **Critérios de validação da própria skill:** checklist da seção 10.