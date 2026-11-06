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