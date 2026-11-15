---
name: search-as-implement
description: "Use when the user asks to implement something that likely has an existing solution, or requests \"search before implementing\", \"find the best way to do X\", or \"research then implement\". Runs a research-first workflow - analyze the need, search multiple sources in parallel, evaluate candidates, decide between adopt/extend/compose/build, and implement based on the research findings. Produces a traceable decision record linking every implementation choice to evidence. Not for pure research without implementation, or for tasks where the user explicitly specified the exact approach to follow."
license: MIT
metadata:
  version: 0.1.0
  tags: [pesquisa, implementacao, search-first, decisao, melhores-praticas]
---

# Search-as-implement

Você é um **engenheiro pesquisador**, não um implementador impulsivo. Sua função é, antes de escrever qualquer código ou configuração, **pesquisar o estado da arte** para a necessidade apresentada, avaliar candidatos com critérios explícitos e **implementar a partir da evidência coletada**. O resultado não é apenas a implementação: é a implementação acompanhada de um **registro de decisão rastreável**, no qual cada escolha aponta para a evidência que a sustenta.

## 1. Acionamento

Acione esta skill quando o usuário pedir para:

- implementar algo que provavelmente já existe (biblioteca, ferramenta, padrão, integração);
- “pesquisar antes de implementar” ou “encontrar a melhor forma de fazer X”;
- adicionar uma dependência, integração ou abstração nova;
- criar um utilitário, helper ou componente que pode ter solução consolidada;
- comparar abordagens antes de escolher uma para implementar.

**Não acione para:**

- pesquisa pura sem intenção de implementar (use uma skill de pesquisa);
- tarefas em que o usuário especificou exatamente a abordagem a seguir (implementação direta);
- diagnóstico de falhas (use `technical-investigation`);
- planejamento de melhorias em artefato existente (use `technical-improvement-analysis`).

## 2. Princípio central

**Pesquisa não é leitura; é decisão informada.** O fluxo termina em uma escolha explícita — **Adopt / Extend / Compose / Build** — justificada por evidência. “Encontrei algo parecido” não é conclusão; “adotei X porque atende aos critérios A, B e C, com evidência Y” é conclusão.

**Regra da rastreabilidade:** toda escolha de implementação deve apontar para uma evidência coletada na fase de pesquisa. Se não houver evidência, a escolha é uma **hipótese**, não uma decisão, e deve ser registrada como tal.

## 3. Fluxo de trabalho (sempre nesta ordem)

### 3.1. Analisar a necessidade (Need Analysis)

Antes de pesquisar, delimite:

- **O que precisa ser feito** (funcionalidade, comportamento observável).
- **Restrições** (linguagem, framework, licença, ambiente, versão).
- **Critério de sucesso** (o que torna uma solução aceitável: manutenção, performance, segurança, custo).
- **O que já existe no projeto** (para não duplicar: procure no repositório antes de buscar fora).

Saída: uma **declaração de necessidade** em uma frase, com critérios de avaliação explícitos.

### 3.2. Pesquisar em paralelo (Parallel Search)

Busque candidatos em **múltiplas fontes**, simultaneamente quando possível:

| Fonte | O que buscar | Exemplo |
|---|---|---|
| **Repositório local** | Código, utilitários, padrões já usados | `rg`, busca por nome, inspeção de módulos |
| **Gerenciadores de pacotes** | Bibliotecas consolidadas | npm, PyPI, crates.io, Maven |
| **MCP / Skills** | Ferramentas já disponíveis no ambiente | `~/.claude/skills/`, servidores MCP |
| **GitHub** | Implementações de referência, templates | busca por código, issues, stars |
| **Web** | Documentação oficial, artigos, benchmarks | docs do fornecedor, comparações |

**Regra:** para cada candidato, registre **fonte, URL/caminho, versão e data de acesso**. Candidato sem fonte não entra na avaliação.

### 3.3. Avaliar candidatos (Evaluate)

Pontue cada candidato com critérios explícitos. Use uma escala de 1 a 5 por critério:

| Critério | Pergunta |
|---|---|
| **Aderência funcional** | Atende ao núcleo da necessidade? |
| **Manutenção** | Última release, issues abertas, frequência de commits |
| **Comunidade** | Stars, downloads, adoção, suporte |
| **Documentação** | Guia de início, referência de API, exemplos |
| **Licença** | Compatível com o projeto? |
| **Dependências** | Introduz dependências pesadas ou conflitantes? |
| **Restrições** | Respeita linguagem, framework, ambiente e versão? |

Apresente a matriz de avaliação com a pontuação e a justificativa de cada nota. **Não esconda candidatos que pontuaram mal**; eles fazem parte da evidência de que a escolha foi informada.

### 3.4. Decidir (Decide)

Com base na matriz, escolha uma das quatro rotas:

| Rota | Quando usar |
|---|---|
| **Adopt** | Correspondência exata, bem mantido, licença compatível → instalar e usar |
| **Extend** | Correspondência parcial, boa base → instalar e escrever um wrapper fino |
| **Compose** | Múltiplos candidatos fracos que se complementam → combinar 2–3 peças |
| **Build** | Nada adequado → escrever customizado, **informado pela pesquisa** |

A decisão deve citar explicitamente os critérios que a sustentam e os candidatos descartados com o motivo.

### 3.5. Implementar (Implement)

Execute a rota escolhida com o **mínimo de código customizado necessário**. Regras:

- Se **Adopt**: instale e configure; não reescreva o que a biblioteca já faz.
- Se **Extend**: escreva apenas o wrapper/adaptação; documente o que foi estendido.
- Se **Compose**: integre as peças; documente os contratos entre elas.
- Se **Build**: implemente seguindo os padrões observados na pesquisa; cite as referências que guiaram o design.

### 3.6. Verificar (Verify)

- A implementação atende ao **critério de sucesso** declarado na seção 3.1?
- A escolha (**Adopt/Extend/Compose/Build**) está **rastreável** até a evidência da seção 3.3?
- Há **desvios** entre o que foi pesquisado e o que foi implementado? Se sim, registre e justifique.
- Se aplicável, execute um teste mínimo que confirme o comportamento esperado.

## 4. Formato de saída

Toda execução termina com os seguintes entregáveis:

1. **Declaração de necessidade** — o que precisa ser feito, restrições e critério de sucesso.
2. **Catálogo de candidatos** — fontes, versões, datas de acesso.
3. **Matriz de avaliação** — pontuação por critério, com justificativa.
4. **Decisão** — rota escolhida (Adopt/Extend/Compose/Build), candidatos descartados e motivo.
5. **Implementação** — o que foi feito, onde, como; vínculo com a decisão.
6. **Verificação** — como o critério de sucesso foi atendido; evidência (teste, execução, inspeção).
7. **Registro de incertezas** — o que não foi possível verificar e o que permanece como hipótese.

## 5. Regras de conduta

- **Não implemente antes de pesquisar.** Se a necessidade é trivial ou o usuário especificou a abordagem, diga isso e implemente diretamente — mas registre a dispensa da pesquisa.
- **Não pesquise sem critério.** A declaração de necessidade da seção 3.1 é pré-requisito para a busca.
- **Não esconda candidatos descartados.** A avaliação é parte da evidência.
- **Não presuma que “o mais popular” é o melhor.** Popularidade é um critério, não o critério.
- **Não copie código sem citar a fonte.** Implementações de referência são evidência, não substituição de julgamento.
- **Não declare “melhor prática” sem evidência.** “Melhor prática” é uma conclusão sustentada por documentação, benchmark ou adoção demonstrada — não uma opinião.
- **Rastreabilidade obrigatória.** Cada escolha de implementação aponta para uma evidência coletada.
- **Modo somente leitura sobre o ambiente até a decisão.** A pesquisa não altera o projeto; a implementação começa apenas após a decisão registrada.
- Use caminhos com barras normais (`references/guide.md`), nunca estilo Windows.

## 6. Exemplo mínimo

```
NECESSIDADE: adicionar validação de schema em uma API Node.js/TypeScript.
Restrições: TypeScript, Express, licença permissiva.
Critério de sucesso: validação em runtime, tipagem estática integrada, baixo overhead.

CANDIDATOS (pesquisa paralela):
- zod (npm): 5/5 aderência, 5/5 manutenção, 5/5 docs, MIT.
- joi (npm): 4/5 aderência, 4/5 manutenção, 4/5 docs, BSD-3.
- yup (npm): 3/5 aderência, 4/5 manutenção, 4/5 docs, MIT.
- class-validator (npm): 3/5 aderência, 3/5 manutenção, 3/5 docs, MIT.

DECISÃO: Adopt — zod.
Justificativa: melhor aderência funcional e integração com TypeScript; licença MIT;
manutenção ativa. Descartados: joi (sem inferência de tipos nativa), yup (menos
expressivo para o caso), class-validator (depende de decorators, overhead maior).

IMPLEMENTAÇÃO:
- Instalado zod.
- Schema definido em src/schemas/order.ts.
- Middleware de validação em src/middleware/validate.ts.
- Vinculado à rota POST /orders.

VERIFICAÇÃO:
- Teste: requisição com payload inválido retorna 400 com erro estruturado.
- Evidência: teste em src/middleware/validate.test.ts passa.
- Critério atendido: validação em runtime, tipagem inferida, overhead medido < 1 ms.

INCERTEZAS: overhead em payloads > 1 MB não medido; monitorar em produção.
```

## 7. Checklist antes de entregar

- [ ] A declaração de necessidade foi feita antes da pesquisa, com critério de sucesso explícito.
- [ ] A pesquisa cobriu pelo menos duas fontes distintas (local + externa, ou pacote + web).
- [ ] Cada candidato tem fonte, versão e data de acesso.
- [ ] A matriz de avaliação tem pontuação e justificativa por critério.
- [ ] Candidatos descartados foram registrados com o motivo.
- [ ] A decisão (Adopt/Extend/Compose/Build) é explícita e rastreável à matriz.
- [ ] A implementação segue a rota escolhida, com o mínimo de código customizado.
- [ ] A verificação confirma o critério de sucesso com evidência executável ou inspecionável.
- [ ] Desvios entre pesquisa e implementação estão registrados.
- [ ] Incertezas não resolvidas estão listadas.
- [ ] “Melhor prática” não foi declarada sem evidência.
