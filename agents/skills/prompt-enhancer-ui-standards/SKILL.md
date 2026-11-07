---
name: prompt-enhancer-ui-standards
description: Define padrões de engenharia, arquitetura e design para reconstruir, estender e auditar interfaces do userscript Prompt-Enhancer. Use ao implementar componentes visuais, fluxos de configuração (provedores, parâmetros, contexto, histórico) ou ao revisar aderência a WAI-ARIA, design tokens, motion design e isolamento de host. O resultado esperado é código em inglês, interface em pt-BR, zero dependência de frameworks externos e integração integral com os módulos reativos existentes.
---

# Prompt-Enhancer UI Standards

Esta skill consolida as convenções de arquitetura, design system e acessibilidade que regem a camada visual do userscript Prompt-Enhancer. O objetivo é garantir que qualquer componente reconstruído ou adicionado se comporte como parte nativa do sistema, sem introduzir regressões de estilo, quebra de isolamento ou violações de acessibilidade.

## Quando usar

- Ao reconstruir ou criar uma tela de configuração (Provider, Parâmetros, System Prompt, Histórico, Contexto).
- Ao projetar ou revisar micro-interações, estados de foco, validação e loading.
- Ao auditar a interface existente em busca de violações de WAI-ARIA, motion ou design tokens.
- Ao estender o catálogo de provedores ou modelos com novos agrupamentos, badges ou filtros.

## Princípios de operação

**Idioma é contrato, não preferência.** Identificadores, chaves de armazenamento (`kpe_*`, `pe_*`), nomes de funções e comentários técnicos permanecem em inglês. Toda string visível ou acessível (rótulos, `aria-label`, placeholders, toasts, mensagens de erro) é em português do Brasil. Traduzir identificadores ou expor termos em inglês na interface é uma falha de contrato, não um detalhe cosmético.

**Dados reais, nunca demonstração.** Nenhum componente injetado pode conter as palavras "mock", "simulado", "fictício", "demonstração" ou "em breve". Todo fluxo deve ler e escrever nos módulos reais (`ProviderRegistry`, `ProviderManager`, `ParamSchema`, `ProjectContext`, `EnhancementHistory`, `State`). Componentes que não conseguem se conectar à infraestrutura existente devem ser removidos, não preenchidos com dados falsos.

**Tokens antes de valores.** Nenhum nó DOM criado pode usar cores hexadecimais, `rgb()`, `hsl()` ou medidas soltas. Toda estilização passa pelas CSS Custom Properties declaradas no escopo `:where(.kpe-scope)`, com a hierarquia de tokens estabelecida (`--kpe-surface`, `--kpe-text`, `--kpe-accent`, `--kpe-success`, `--kpe-dur-fast`, `--kpe-ease-standard`). Tokens são escopados ao componente que os consome, não despejados indiscriminadamente em `:root`.

**Isolamento de host é não-negociável.** Todo container, modal ou slot injetado deve conter a classe `.kpe-scope` e receber `Utils.shieldFromHost(el)` para impedir que eventos de clique, digitação e foco vazem para a página hospedeira (ChatGPT, Claude, DeepSeek). A ausência desse escudo transforma o userscript em uma fonte de bugs silenciosos na interface do chat.

**Movimento tem função ou é removido.** Animações existem para guiar, confirmar ou esclarecer. Se a transição for instantânea e nada se perder, ela deve ser removida. No máximo três primitivas de movimento por view (uma revelação, um sinal de hover, um loop funcional). Reduzir movimento é um estado de primeira classe, não um afterthought: toda animação define explicitamente seu comportamento sob `prefers-reduced-motion`.

## Processo de implementação

1. **Mapeie o módulo e o contrato de dados.** Identifique se a alteração pertence a `ParamSchema`, `SystemPromptManager`, `ProviderManager`, `ProviderRegistry`, `ApiClient`, `Atoms`, `Molecules` ou às telas (`settingsModal`, `guidedWizard`, `preview`, `contextPopover`). Liste as chaves de persistência envolvidas (`kpe_runs`, `kpe_params`, `pe_providers`, `pe_pinned_route`, `kpe_ctx_files`) e verifique se `migration.js` cobre o formato anterior.

2. **Construa o DOM de forma imperativa.** Utilize `document.createElement` e as primitivas de `Atoms` (`Atoms.button`, `Atoms.buttonNode`, `Atoms.icon`) em vez de strings HTML soltas. O container raiz recebe a classe `.kpe-scope`. Todo evento que não pertence ao fluxo interno é bloqueado com `Utils.shieldFromHost`.

3. **Aplique WAI-ARIA desde o primeiro commit.** Modais declaram `role="dialog"`, `aria-modal="true"`, `aria-label` e gerenciam foco com ciclo de `Tab` e restauração ao elemento disparador. Accordions e disclosures usam `aria-expanded` e `aria-controls`. Listas de opções usam `role="listbox"` com `aria-activedescendant` ou `role="option"` com navegação por teclado.

4. **Defina o comportamento de movimento.** Escolha entre os tokens de duração (`--kpe-dur-fast`, `--kpe-dur-base`) e easings (`--kpe-ease-standard`, `--kpe-ease-spring`). Evite animar `width`, `height`, `top` ou `left`; prefira `transform` e `opacity`. Envolva o bloco de animação em `@media (prefers-reduced-motion: no-preference)` para que usuários que solicitaram movimento reduzido recebam a versão estática por padrão.

5. **Valide a integração reativa.** Após a implementação, confirme que o componente atualiza quando o estado subjacente muda (pin de rota, edição de parâmetro, carregamento de contexto) e que os eventos despachados (`click`, `input`, `change`) chegam aos manipuladores corretos sem propagação indesejada.

## Padrões de interface para seleção de modelos e provedores

### Agrupamento e busca

Listas extensas de modelos devem ser agrupadas por provedor, com título de seção fixo durante a rolagem. Acima de oito itens (ou quando o catálogo é dinâmico), uma barra de busca ocupa o topo, com autofoco na abertura e correspondência por nome, provedor e capacidades, ignorando caixa e diacríticos. Filtros adicionais (keyless, streaming, fixado) são toggles compactos, não checkboxes soltos.

### Expansão em linha versus painel dividido

Para configuração de modelos dentro de um modal com abas laterais, a expansão em linha (accordion) é preferível ao painel mestre-detalhe. O painel dividido esmaga o conteúdo e força uma segunda coluna dentro de uma área já estreita. Com accordion, a lista mantém 100% da largura, e os detalhes (autenticação, limites, contexto, ações de pin/cópia) aparecem sob demanda, sem esconder os demais modelos. O estado de expansão é local à sessão e nunca persistido.

### Badges e transparência

Cada linha de modelo exibe badges semânticos (`free`, `stream`, `tools`, `fixado`) com contraste adequado. O nome do modelo é acompanhado de uma linha descritiva ou do identificador técnico, nunca de siglas opacas. Quando a autenticação é necessária, a linha indica `Bearer` ou `Keyless` de forma explícita; a ação de pin solicita a chave quando aplicável, sem esconder o campo atrás de fluxos não descobertos.

## Acessibilidade e motion

### Modais e foco

A `<dialog>` nativa com `showModal()` já entrega contenção de foco, fechamento por `Escape`, `inert` no fundo e retorno de foco ao disparador. Quando a implementação for manual (como no `settingsModal` atual), o ciclo de `Tab` deve ser explícito: o primeiro elemento focável recebe foco na abertura, o último devolve ao primeiro, e `Escape` fecha e restaura o foco ao elemento anteriormente ativo. Nunca use `tabindex` no próprio diálogo para capturar foco; foque o primeiro controle interativo.

### Reduced motion como contrato

`prefers-reduced-motion: reduce` deve desligar animações não essenciais (translações, escalas, parallax, rotações perpétuas) e substituí-las por crossfades curtos ou estados estáticos. Não use a abordagem de `animation-duration: 0.01ms` globalmente; trate cada animação caso a caso para evitar transições abruptas ou quebradas. O helper `Anim` centraliza esse comportamento no projeto.

### Foco visível e teclado

O anel de foco aparece instantaneamente, sem transição de opacidade ou escala. Elementos clicáveis que não são `<button>` ou `<a>` recebem `role="button"` e `tabindex="0"`, com ativação por `Enter` e `Espaço`. Listas de opções suportam `ArrowUp`, `ArrowDown`, `Home`, `End` e seleção por `Enter`.

## Design tokens e estilização

### Hierarquia de tokens

| Categoria | Tokens |
| :--- | :--- |
| Superfícies | `--kpe-surface`, `--kpe-surface-2`, `--kpe-surface-3`, `--kpe-surface-code` |
| Texto | `--kpe-text`, `--kpe-text-muted`, `--kpe-text-faint` |
| Bordas e sombras | `--kpe-border`, `--kpe-border-strong`, `--kpe-shadow-1`, `--kpe-shadow-2` |
| Ação e destaque | `--kpe-accent`, `--kpe-accent-soft`, `--kpe-accent-border`, `--kpe-accent-text` |
| Semântica | `--kpe-success`, `--kpe-error`, `--kpe-warning` |
| Duração e easing | `--kpe-dur-fast`, `--kpe-dur-base`, `--kpe-ease-standard`, `--kpe-ease-spring` |

Tokens são escopados ao componente que os consome. Propriedades privadas usam o prefixo `--_`; propriedades públicas (sobrescrevíveis por consumidores) usam o nome do componente (`--card-bg`). Valores de fallback são usados apenas quando a variável não está definida, nunca como desculpa para hardcoding.

### Isolamento de host e escopo

O seletor `:where(.kpe-scope)` define os tokens e evita conflitos com CSS da página hospedeira. Nenhum estilo é aplicado fora do escopo. O `GM_addStyle` injeta o bloco uma única vez, e os componentes consomem as variáveis sem conhecer o tema (claro/escuro) em que estão inseridos.

## Anti-padrões a evitar

- Injetar classes de frameworks (Tailwind, Bootstrap) ou utilitários externos; toda classe deve ter prefixo `kpe-`.
- Usar `alert()`, `confirm()` ou `prompt()` nativos em fluxos críticos sem fallback de foco; prefira `Molecules.toast` e diálogos internos.
- Omitir `Utils.shieldFromHost` em qualquer nó injetado; o vazamento de eventos é a causa mais comum de bugs intermitentes no host.
- Traduzir identificadores ou chaves de armazenamento; o código permanece em inglês, a interface em pt-BR.
- Renderizar estados de demonstração ou preencher componentes com dados fictícios para "testar a aparência"; o componente deve nascer conectado ao estado real.
- Animar propriedades de layout (`width`, `height`, `top`, `margin`) em caminhos críticos sem justificativa registrada; use `transform` e `opacity`.
- Tratar `prefers-reduced-motion` como um override global de `0.01ms`; cada animação deve declarar seu comportamento estático.
- Persistir estado de expansão de accordion entre sessões; o estado de disclosure é local e volátil.

## Formato de saída esperado

Toda entrega de componente ou refatoração deve incluir:

1. **Código modular** no padrão `// ===== Module: <name>.js =====`, com criação de DOM via `document.createElement`, bindings reativos e blindagem de host.
2. **Tabela de mudanças** com colunas `#`, `Elemento / Função`, `Módulo de Origem`, `Tipo de Ação` (`Adicionado`, `Modificado`, `Removido`) e `Justificativa Técnica`.
3. **Notas de acessibilidade** indicando como foco, teclado e `prefers-reduced-motion` foram tratados no componente.
4. **Confirmação de integração** com as chaves de persistência e os módulos reativos afetados (ex.: `ProviderManager.pin`, `ParamSchema.save`, `ProjectContext.buildSystemSuffix`).