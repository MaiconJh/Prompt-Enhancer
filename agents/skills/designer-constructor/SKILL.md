---
name: designer-constructor
description: Constrói e especifica micro-interações, estados animados e movimento de interface alinhados à identidade do produto e às melhores práticas de craft moderno. Use ao definir a linguagem de movimento de um produto, projetar estados interativos (hover, foco, validação, loading), documentar motion tokens ou adaptar uma interface a diferentes formatos (web, mobile, desktop) com animação intencional e acessível.
---

# Designer Constructor

Projeta o movimento como parte do sistema de design, não como improviso por componente. O resultado é uma camada de interação que guia, confirma e orienta o usuário, com estética contemporânea, desempenho previsível e contrato de acessibilidade embutido.

## Quando usar

- Ao definir ou revisar a linguagem de movimento de um produto ou design system.
- Ao projetar estados interativos: hover, foco, pressão, validação, carregamento, transições entre telas.
- Ao adaptar uma interface a múltiplos formatos (web responsivo, mobile nativo, desktop) com comportamento de animação coerente.
- Ao documentar motion tokens, coreografias e assinaturas de movimento para handoff.

## Princípios de operação

**Movimento tem função ou é cortado.** Toda animação deve esclarecer, guiar ou confirmar. Pergunte o que se perde se a transição for instantânea; se nada se perde, remova.

**Restrição é sofisticação.** No máximo três primitivas de movimento por página (uma revelação, um sinal de hover, um loop funcional). A estética moderna não é “quanto mais movimento, melhor”; é o movimento certo no momento certo.

**Adapte-se ao formato, não imponha o mesmo movimento.** Web, mobile e desktop têm tolerâncias diferentes a duração, distância e gesto. A linguagem de movimento deve ter regras por contexto, não uma receita única.

**Reduced motion é um estado de primeira classe, não um afterthought.** Toda interação define explicitamente seu comportamento quando o usuário solicita movimento reduzido: colapso espacial para um crossfade curto, mantendo a mudança funcional de estado.

**Desempenho é design.** Anime apenas `transform` e `opacity` (e, com cautela, `filter` e `clip-path`). Animar propriedades de layout em caminhos críticos degrada a experiência e a percepção de qualidade.

## Processo de construção

1. **Leia a identidade do produto.** Determine o tom: calmo, ágil, lúdico, austero. Audite as animações existentes e mapeie a dispersão de durações e easings; essa dispersão é o argumento para sistematizar.

2. **Defina a escala de movimento.** Estabeleça tokens de duração e uma vocabulário de easing antes de tocar em qualquer componente. Valores de referência: `instant` ~100ms para feedback de estado; `fast` ~180–220ms para micro-interações; `base` ~300ms para revelações; `slow` ~500ms+ para mudanças de cena.

3. **Escreva as regras de coreografia.** Defina o que anima e o que nunca anima; assimetria de entrada/saída (saídas mais rápidas que entradas); regras de stagger (30–60ms entre filhos, com teto para listas longas); hierarquia (um movimento herói por view); e distâncias curtas (8–24px, não travessias de tela).

4. **Projete os estados por componente.** Para cada componente interativo, especifique os quatro estágios de uma micro-interação — gatilho, regras, feedback e loops/modos — com duração, easing e propriedade animada.

5. **Nomeie as assinaturas de movimento.** Crie 3–5 composições reutilizáveis e reconhecíveis (ex.: “card-lift”, “panel-reveal”, “count-up”), cada uma com gatilho, propriedades, tokens usados e contexto de NÃO uso.

6. **Exporte e documente.** Gere motion tokens (durações, easings, distâncias), CSS com guardas de reduced motion e um documento de especificação que um novo desenvolvedor leia antes de animar qualquer coisa.

7. **Faça o retrofit.** Mapeie o inventário inicial contra o novo sistema: quais animações existentes snapam para tokens, quais estão fora do sistema e quais devem ser deletadas por não comunicarem nada.

## Escala e tokens de movimento

| Token | Duração de referência | Uso típico |
|---|---|---|
| `motion-duration-instant` | ~100ms | Feedback imediato de estado (pressão, toggle) |
| `motion-duration-fast` | ~180–220ms | Micro-interações, hover, foco, validação |
| `motion-duration-base` | ~300ms | Revelações, expansão de painéis, dropdowns |
| `motion-duration-slow` | ~500ms+ | Mudanças de cena, transições de página |

| Token de easing | Papel |
|---|---|
| `motion-ease-standard` | Uso geral em estados e transições simétricas |
| `motion-ease-enter` (decelerate) | Entradas de elementos no viewport |
| `motion-ease-exit` (accelerate) | Saídas de elementos; mais rápida que a entrada |
| `motion-ease-signature` | No máximo UMA curva de assinatura (spring/overshoot) por produto; a personalidade vive aqui |

Durações fora da escala são deriva sistêmica, como um hex avulso.

## Biblioteca de padrões de micro-interação

### Hover e pressão (botões e cards)
- **Hover:** um único sinal, preferencialmente mudança de cor de fundo ou borda; não combine escala, sombra e movimento ao mesmo tempo.
- **Pressão:** deslocamento de 1px no eixo Y (`translateY(1px)`), liberado no `pointerup`.
- **Foco:** o anel de foco nunca anima; aparece instantaneamente e é sempre visível ao teclado.
- **Reduced motion:** hover e pressão mantêm a mudança de cor; o deslocamento espacial colapsa para nenhum ou um crossfade de 150ms.

### Foco de input e validação
- O outline de foco aparece imediatamente; a borda pode intensificar um passo, mas a largura nunca muda.
- Rótulos não flutuam como placeholders; o rótulo permanece estável acima do campo.
- Validação dispara no `blur` após o campo ter sido tocado, depois a cada `input`; nunca no primeiro caractere.
- A linha de erro ocupa o mesmo espaço reservado da linha de ajuda, sem deslocar o layout.

### Toast e feedback assíncrono
- Toasts são para falhas e efeitos que a página não consegue mostrar; sucesso visível não gera toast.
- Entrada em `motion-duration-slow`, permanência de 4–6s, saída em 65% da duração de entrada.
- Auto-dismiss pausa em hover e foco; toast de erro carrega uma ação de retry e não desaparece sozinho.

### Modal e diálogos
- Use `<dialog>` com `showModal()` e `inert` no conteúdo de fundo.
- Backdrop faz fade; o painel escala de 0.96 para 1 na entrada e fecha em ~65% da duração com easing de saída.
- O primeiro foco vai para o primeiro elemento interativo, não para o botão de fechar.
- Reduced motion: crossfade de 150ms sem escala.

### Menus, popovers e tooltips
- Prefira a Popover API com light-dismiss e posicionamento por âncora.
- Abertura em `motion-duration-fast` com easing de entrada; fechamento em 65% da duração com easing de saída.
- Stagger de 30ms entre itens apenas quando houver oito ou menos; tooltips aparecem após um atraso de hover e desaparecem imediatamente.

### Loading e loops funcionais
- Prefira estados de carregamento que não dependam de animação perpétua; quando um spinner for necessário, reduza a velocidade ou substitua por texto em reduced motion.
- No máximo um loop funcional por página (marquee, contador, progresso).

## Acessibilidade e reduced motion

- Envolva animações em `@media (prefers-reduced-motion: no-preference)` para que usuários que pediram movimento reduzido recebam a versão estática por padrão, sem perseguir cada animação com um override.
- O alvo do reduced motion são gatilhos vestibulares, não o feedback. Remova parallax, grandes varreduras em X/Y e movimentos perpétuos; mantenha mudanças de estado e feedback essencial.
- Não use `animation-duration: 0.01ms` globalmente; trate caso a caso para evitar animações abruptas ou quebradas.
- Garanta que nenhuma informação ou affordance dependa exclusivamente de movimento; hover tem equivalente em foco; gestos têm alternativa por teclado.
- Nunca ultrapasse o limite de três flashes por segundo em qualquer transição ou loop.

## Adaptação por formato de interface

**Web responsivo.** Durações curtas no mobile (fast a base); revelações por scroll com `animation-timeline: view()` quando possível, evitando listeners de scroll em JS; nunca sequestrar a velocidade do scroll.

**Mobile nativo.** Movimento mais contido e direto; priorize feedback tátil e transições de estado sobre grandes coreografias espaciais; respeite as diretrizes de movimento da plataforma (Material Motion, Human Interface Guidelines) como piso, não como teto.

**Desktop e telas grandes.** Distâncias maiores são toleráveis, mas ainda dentro do intervalo de 8–24px para elementos de interface; o movimento herói pode ocupar mais espaço, desde que não bloqueie a tarefa.

**Superfícies densas (dashboards, tabelas, editores).** Reduza ao mínimo: animações de estado e feedback de validação; evite revelações e entradas coreografadas que competem com a leitura de dados.

## Formato de saída

```
# Especificação de movimento — [nome do produto ou fluxo]

**Tom de movimento:** [calmo | ágil | lúdico | austero]
**Escopo:** [componentes, fluxos e formatos cobertos]

## Tokens
[motion-duration-* e motion-ease-* com valores e usos]

## Regras de coreografia
[o que anima, o que não anima, assimetria, stagger, hierarquia, distâncias]

## Assinaturas de movimento
- **[nome]:** [gatilho, propriedades, tokens, quando NÃO usar]

## Comportamento por componente
### [Componente]
- **Gatilho:** [...]
- **Feedback:** [propriedade, duração, easing]
- **Reduced motion:** [...]

## Contrato de acessibilidade
[prefers-reduced-motion, foco, alternativas, limites de flash]

## Notas de desempenho
[propriedades animadas, justificativa para exceções de layout]
```

## Anti-padrões a evitar

- Animar `width`, `height`, `top`, `left` ou `margin` em caminhos críticos sem justificativa registrada na especificação.
- Usar mais de uma curva de assinatura (um produto que às vezes salta e às vezes desliza tem duas personalidades).
- Tratar reduced motion como um override global de 0.01ms em vez de um contrato por animação.
- Adicionar micro-interações a todos os elementos interativos por padrão, criando ruído visual e fadiga de feedback.
- Documentar movimento em uma apresentação isolada que ninguém consulta; a especificação deve viver ao lado dos tokens e dos componentes.
- Ignorar o formato: aplicar a mesma duração e a mesma distância no mobile e no desktop sem calibração contextual.

---

# UI Reconstruction & Feature Implementation (Prompt-Enhancer Standards)

## Regras Críticas de Fidelidade (Tolerância Zero)

### 1. Idioma e Localização (Standards Sec. Language)

* **Código em inglês:** Identificadores, nomes de variáveis, nomes de classes/módulos, funções, objetos utilitários, métodos DOM, chaves de armazenamento GM/localStorage (`kpe_*`, `pe_*`), manipuladores de evento e comentários técnicos.
* **Interface e Strings Visíveis em português do Brasil (pt-BR):** Rótulos (`label`), placeholders, textos renderizados, tooltips (`title`), atributos de acessibilidade (`aria-label`, `aria-description`, `role`), mensagens de status, logs de erro, notificações (`toast`) e botões.
* **Proibido traduzir identificadores** e **proibido inserir qualquer string visível ou acessível em inglês**.

### 2. Proibição Estrita de Termos de Demonstração (Content Integrity)

* **Proibido em qualquer string visível ou componente injetado:** "mock", "fictício", "simulado", "demonstração", "prévia estática", "em construção", "em breve", "placeholder de teste".
* **Comportamento real obrigatório:** Todo componente adicionado, reconstruído ou modificado deve conectar-se integralmente à infraestrutura reativa existente (`State`, `ParamSchema`, `ProviderManager`, `ProjectContext`, `EnhancementHistory`, `Anim`).

### 3. Padrão de Estilização e Tokens de Design (`kpe-*`)

* **Proibido o uso de utilitários de terceiros externos ou classes sem prefixo.** Toda a estilização deve ser feita através das CSS Custom Properties declaradas no escopo `:where(.kpe-scope)` injetado via `GM_addStyle`.
* **Hierarquia de Tokens Obrigatória:**
* Superfícies: `var(--kpe-surface)`, `var(--kpe-surface-2)`, `var(--kpe-surface-3)`, `var(--kpe-surface-code)`
* Tipografia: `var(--kpe-font)`, `var(--kpe-mono)`, `var(--kpe-fs-sm)`, `var(--kpe-fs-md)`, `var(--kpe-lh-base)`
* Cores de Texto: `var(--kpe-text)`, `var(--kpe-text-muted)`, `var(--kpe-text-faint)`
* Bordas e Sombras: `var(--kpe-border)`, `var(--kpe-border-strong)`, `var(--kpe-shadow-1)`, `var(--kpe-shadow-2)`
* Cores de Ação/Destaque: `var(--kpe-accent)`, `var(--kpe-accent-soft)`, `var(--kpe-accent-border)`, `var(--kpe-accent-text)`
* Semântica: `var(--kpe-success)`, `var(--kpe-error)`, `var(--kpe-warning)`
* Curvas e Tempos: `var(--kpe-dur-fast)`, `var(--kpe-dur-base)`, `var(--kpe-ease-spring)`, `var(--kpe-ease-standard)`


* **Proibido hardcoding de cores hexadecimais, rgb ou hsl em nós DOM criados.**

### 4. Arquitetura DOM e Manipulação Nativa

* A interface é montada via Vanilla JavaScript imperativo utilizando as primitivas de `Atoms` (`Atoms.button`, `Atoms.buttonNode`, `Atoms.icon`) e `Molecules`.
* **Isolamento de Host:** Todo container, modal ou slot injetado deve conter a classe `.kpe-scope` e receber a blindagem de eventos contra o site hospedeiro via `Utils.shieldFromHost(el)`.
* **Acessibilidade WAI-ARIA:** Modais e painéis devem declarar `role="dialog"`, `aria-modal="true"` ou `"false"`, `aria-label`, foco gerenciado via teclado (`Tab` trapping e tecla `Escape`) e restauração do foco anterior (`previouslyFocused.focus()`).

### 5. Ícones e Animações

* **Zero Emojis:** Utilize exclusivamente SVGs do mapa `ICONS` através do helper `Atoms.icon(name, extraClass)`. O SVG deve manter atributos inline (`viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`).
* **Animações Fluidas com Respeito a `prefers-reduced-motion`:** Qualquer transição visual deve passar pelo helper `Anim` (`Anim.fadeIn`, `Anim.panelIn`, `Anim.panelOut`, `Anim.shake`, `Anim.toastIn`, etc.), respeitando automaticamente preferências de redução de movimento.

---

## Workflow em 4 Passos

### Passo 1 — Identificação do Módulo e Contrato de Dados

1. Identifique em qual módulo a alteração ou reconstrução se encaixa:
* Configurações e Parâmetros: `ParamSchema`, `SystemPromptManager`
* Conexão e Rotas: `ProviderManager`, `ProviderRegistry`, `ApiClient`
* Componentes Visuais Base: `Atoms`, `Molecules`, `gear.js`
* Telas e Diálogos: `settingsModal`, `guidedWizard`, `preview`, `contextPopover`


2. Mapeie as chaves de persistência envolvidas (`kpe_runs`, `kpe_params`, `pe_providers`, `pe_pinned_route`, `kpe_ctx_files`) e assegure que nenhum dado corrompa migrações existentes (`migration.js`).

### Passo 2 — Implementação da Lógica e Interação (Vanilla DOM)

1. Crie elementos utilizando `document.createElement`, compondo a estrutura com a classe de escopo `.kpe-scope`.
2. Para botões, utilize `Atoms.button` ou `Atoms.buttonNode`, configurando manipuladores de eventos (`click`, `input`, `change`) que atualizem os drafts ou despachem chamadas no `State`.
3. Adicione feedback reativo visual usando `Molecules.toast(mensagem, tipo, opcoes)` ou `Anim.pulseSuccess(elemento)`.

### Passo 3 — Entrega do Componente

O código final do componente ou refatoração deve ser estruturado em JavaScript modular idêntico ao padrão das seções do userscript (`// ===== Module: <name>.js =====`), contendo:

* Criação dos nós DOM com WAI-ARIA rigoroso.
* Tratamento de foco, fechamento e cancelamento.
* Bind reativo com `State` ou persistência local via `GM_getValue`/`GM_setValue`.

### Passo 4 — Mapa de Mudanças (Checklist do PR)

Finalize a entrega gerando a tabela técnica detalhando as inserções e modificações:

| # | Elemento / Função | Módulo de Origem | Tipo de Ação | Justificativa Técnica |
| --- | --- | --- | --- | --- |
| 1 | `renderProviderList()` | `settings-modal.js` | Modificado | Inclusão de indicador visual de fallback e badges semânticos |
| 2 | `ICONS.network` | `icons-atoms.js` | Adicionado | SVG inline para status de conexão dos nós de inferência |

---

## Gotchas & Falhas Silenciosas que a Skill Previne

* **Injetar classes de Tailwind ou cores fixas (`#fff`, `rgb(0,0,0)`):** A interface deve usar estritamente as custom properties `--kpe-*`.
* **Esquecer de blindar elementos injetados com `Utils.shieldFromHost`:** Sem isso, eventos de clique e digitação vazam para as caixas de chat hospedeiras (ChatGPT, Claude, DeepSeek).
* **Usar strings em inglês nos botões ou modais:** Viola o padrão de interface voltado para pt-BR.
* **Esquecer suporte a `prefers-reduced-motion`:** Sempre encadeie transições visuais pelo helper `Anim`.
* **Utilizar `alert()` ou `confirm()` nativo em fluxos críticos sem fallback de foco:** Prefira `Molecules.toast` para avisos e tratamentos assíncronos.