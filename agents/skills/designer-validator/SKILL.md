---
name: designer-validator
description: Audita interfaces digitais, ícones, espaçamentos e consistência de design systems, produzindo relatórios priorizados com evidências visuais e técnicas. Use ao revisar craft visual, acessibilidade, responsividade ou aderência a tokens antes da entrega, ou quando for necessário classificar achados por gravidade e recomendar correções.
---

# Designer Validator

Avalia a qualidade percebida e a consistência sistêmica de uma interface com base em evidências, não em preferência estética. Produz um relatório acionável que separa falhas bloqueadoras de riscos toleráveis, permitindo que líderes de design decidam com clareza se a entrega está pronta.

## Quando usar

- Antes de aprovar uma entrega de UI para desenvolvimento ou produção.
- Ao revisar um componente ou fluxo recém-implementado contra o spec de design.
- Quando for necessário auditar consistência de ícones, espaçamentos, tipografia ou tokens.
- Ao verificar acessibilidade básica (contraste, foco, alvos de toque) sem substituir uma auditoria WCAG completa.

## Princípios de operação

**Evidência sobre opinião.** Todo achado deve apontar para um local visível, um valor medido ou um critério objetivo. Evite "parece errado" sem screenshot, medição ou referência ao token.

**Priorize por impacto no usuário e no produto.** Um desalinhamento de 1px em uma tela secundária não é bloqueador. Contraste insuficiente em um botão primário é.

**Não invente regras.** Se o design system não define um valor, registre como "não especificado" e recomende decisão, em vez de penalizar como desvio.

**Verifique o que é verificável no escopo.** Não faça auditoria de código profunda nem testes de usabilidade completos; concentre-se no que a interface renderizada e o spec permitem validar.

## Processo de validação

1. **Colete evidências.** Registre capturas de tela em viewports representativos (ex.: 375px, 768px, 1440px). Anote a origem do spec (Figma, Storybook, documentação de tokens).

2. **Valide fundamentos de UI.** Tipografia, cores, espaçamento, grid, ícones e hierarquia visual. Compare cada elemento com a fonte de verdade disponível.

3. **Valide UX e acessibilidade.** Contraste, foco visível, rótulos, estados de erro, ordem de leitura e tamanho de alvos de toque.

4. **Valide sistema e engenharia.** Uso de tokens versus valores avulsos, consistência de componentes, estados documentados e comportamento responsivo.

5. **Classifique a gravidade.** Atribua bloqueador, alto, médio ou baixo com base na escala abaixo. Um bloqueador impede a entrega; os demais entram no backlog com prazo proporcional.

6. **Produza o relatório.** Use o formato de saída abaixo. Inclua veredito final: `Ship`, `Ship com correções` ou `Precisa de trabalho`.

## Checklist de auditoria

### Tipografia
- [ ] Tamanhos e pesos correspondem à escala tipográfica definida.
- [ ] Entrelinhas e espaçamentos entre parágrafos seguem o padrão.
- [ ] Não há fontes fora do sistema ou fallbacks inconsistentes.
- [ ] Hierarquia entre título, corpo e rótulos é perceptível sem esforço.

### Cores e contraste
- [ ] Cores usam tokens ou variáveis, não valores hexadecimais avulsos.
- [ ] Cores semânticas (erro, sucesso, alerta) são aplicadas corretamente.
- [ ] Contraste de texto atende ao mínimo aplicável (4.5:1 para corpo; 3:1 para texto grande).
- [ ] Informação não é transmitida apenas por cor.

### Espaçamento e layout
- [ ] Margens, paddings e gaps são múltiplos da escala definida (ex.: 4px/8px).
- [ ] Alinhamento entre elementos vizinhos é consistente.
- [ ] O grid é respeitado nos breakpoints principais.
- [ ] Não há overflow, corte de conteúdo ou sobreposição inesperada.

### Ícones e elementos gráficos
- [ ] Ícones pertencem à mesma família e espessura de traço.
- [ ] Tamanhos de ícones seguem o padrão do sistema.
- [ ] Alinhamento óptico de ícones com texto está correto.
- [ ] Estados de ícone (hover, ativo, desabilitado) estão implementados.

### Acessibilidade e interação
- [ ] Foco de teclado é visível e segue ordem lógica.
- [ ] Botões e links têm rótulos acessíveis.
- [ ] Alvos de toque têm no mínimo 44×44px no mobile.
- [ ] Mensagens de erro identificam o campo e orientam a correção.
- [ ] `prefers-reduced-motion` é respeitado em animações.

### Design system e engenharia
- [ ] Componentes reutilizam variantes oficiais em vez de recriações ad hoc.
- [ ] Estados documentados (default, hover, focus, disabled, loading, erro) existem e estão implementados.
- [ ] Tokens de raio, sombra e borda são aplicados de forma consistente.
- [ ] A implementação corresponde ao spec validado, sem divergências silenciosas.

## Escala de gravidade

| Nível | Critério | Ação recomendada |
|---|---|---|
| **Bloqueador** | Impede uso, viola acessibilidade crítica ou quebra confiança de forma evidente. Ex.: contraste abaixo do mínimo em ação primária, modal sem foco preso. | Corrigir antes da entrega. |
| **Alto** | Compromete a experiência ou a consistência sistêmica de forma perceptível. Ex.: espaçamento fora da escala em toda uma seção, ícones de famílias misturadas. | Corrigir na mesma release ou na release imediata. |
| **Médio** | Desvio localizado que não impede a tarefa, mas reduz polimento. Ex.: peso tipográfico ligeiramente diferente em um rótulo secundário. | Agendar no backlog com prazo definido. |
| **Baixo** | Detalhe cosmético de baixo impacto. Ex.: alinhamento óptico de um ícone em uma tela de configurações. | Registrar para melhoria contínua; não bloqueia. |

## Formato de saída

```
# Relatório de validação — [nome da interface ou fluxo]

**Veredito:** Ship | Ship com correções | Precisa de trabalho
**Evidências:** [links ou nomes dos arquivos de captura]
**Escopo:** [telas, componentes e viewports avaliados]

## Bloqueadores
- **[Componente/tela]** — [achado objetivo]. **Evidência:** [medida ou captura]. **Recomendação:** [correção].

## Riscos altos
- ...

## Achados médios
- ...

## Achados baixos
- ...

## Observações sem especificação
- [Item sem regra definida no sistema; recomendar decisão de design.]
```

## Anti-padrões a evitar

- Listar preferências pessoais (“eu teria escolhido outro tom”) sem vínculo com spec, token ou critério de acessibilidade.
- Tratar todo desvio como bloqueador; isso destrói a credibilidade do relatório e paralisa a entrega.
- Auditar apenas a aparência estática ignorando estados, foco e comportamento responsivo.
- Apontar um problema sem indicar a correção esperada ou a referência que foi violada.