# Prompt Enhancer
## Especificação de Navegação e Composição das Interfaces

**Documento:** Arquitetura Visual e Comportamental  
**Escopo:** Projects Main, Workspace e sistema de navegação entre interfaces  
**Natureza:** Especificação de design, sem implementação técnica

---

## 1. Objetivo

Definir a organização visual, a navegação e o comportamento das duas interfaces principais do Prompt Enhancer:

- **Projects Main:** gerenciamento e acesso aos projetos.
- **Workspace:** ambiente operacional de um projeto específico.

As interfaces devem funcionar como experiências independentes, compartilhando um único contêiner externo de modal.

O objetivo é preservar a identidade e as responsabilidades de cada interface, evitando sobreposição de funcionalidades e excesso de elementos visuais.

## 2. Arquitetura geral

A experiência será composta por:

1. Um modal externo persistente.
2. Uma área de conteúdo contextual.
3. Duas interfaces independentes.
4. Um mecanismo de transição entre essas interfaces.

### 2.1. Modal externo

O modal será responsável por:

- Backdrop.
- Posicionamento e centralização.
- Dimensões responsivas.
- Abertura e fechamento.
- Transição dimensional.
- Contenção das interfaces internas.

O modal não será recriado durante a navegação entre Projects Main e Workspace.

### 2.2. Independência das interfaces

Cada interface terá:

- Header próprio.
- Estrutura interna própria.
- Controles específicos.
- Organização visual independente.
- Gerenciamento de rolagem próprio.

O compartilhamento do modal não implica compartilhamento dos headers ou dos componentes internos.

---

## 3. Projects Main

### 3.1. Responsabilidade

Projects Main é a interface principal de gerenciamento e acesso aos projetos.

Sua finalidade é permitir que o usuário visualize, pesquise, organize, crie e selecione projetos.

### 3.2. Estrutura visual

A composição definida no mock `mock-main-projects.html` contempla:

- Identidade Prompt Enhancer.
- Identificação da área de gerenciamento.
- Alternância de tema.
- Identificação da conta.
- Título e descrição da seção.
- Pesquisa de projetos.
- Criação de projetos.
- Ordenação.
- Grid de projetos.
- Menus contextuais.
- Estados vazios.
- Footer contextual.

Não devem ser introduzidos elementos operacionais internos do Workspace nesta interface.

### 3.3. Dimensões

Dimensão máxima de referência em desktop:

**1180 × 860 px**

As dimensões devem respeitar os limites disponíveis da viewport.

---

## 4. Workspace

### 4.1. Responsabilidade

O Workspace é o ambiente operacional de um único projeto selecionado.

Ele não é uma interface de gerenciamento de múltiplos projetos.

### 4.2. Estrutura visual

A composição definida no mock `mock-workspace.html` contempla:

- Header contextual do projeto.
- Toolbar.
- Activity Bar.
- Explorer.
- Editor.
- AI Access.
- Project Settings.
- Status Bar.
- Toasts.

Cada área mantém sua responsabilidade dentro do ambiente de trabalho.

### 4.3. Dimensões

Dimensão máxima de referência em desktop:

**1280 × 900 px**

A expansão em relação ao Projects Main deve proporcionar mais espaço para o ambiente operacional, sem alterar arbitrariamente sua organização interna.

---

## 5. Navegação entre interfaces

### 5.1. Abertura do Workspace

Ao selecionar um projeto em Projects Main:

1. O projeto selecionado é identificado.
2. O modal inicia sua expansão.
3. O conteúdo de Projects Main deixa de ser apresentado.
4. O Workspace correspondente é apresentado.
5. A navegação passa a pertencer ao contexto daquele projeto.

### 5.2. Retorno ao Projects Main

O Workspace disponibiliza a navegação de retorno aos projetos.

Ao utilizá-la:

- O modal reduz suas dimensões para o padrão de Projects Main.
- O conteúdo do Workspace deixa de ser apresentado.
- Projects Main retorna ao estado anterior.
- Pesquisa, ordenação e posição da rolagem são preservadas.
- O estado do Workspace permanece temporariamente preservado.

O retorno não deve provocar a reinicialização da interface anterior.

### 5.3. Troca de projeto

Quando o usuário retorna ao Projects Main e seleciona outro projeto:

- O Workspace anterior permanece associado ao seu respectivo projeto.
- O novo Workspace recebe exclusivamente o contexto do projeto selecionado.
- Os estados internos dos projetos não devem ser compartilhados.
- A navegação deve respeitar eventuais alterações não salvas antes de abandonar o Workspace anterior.

---

## 6. Comportamento dimensional do modal

### 6.1. Dimensões de referência

O modal possui dois padrões dimensionais, determinados pela interface atualmente apresentada.

| Interface | Largura máxima | Altura máxima |
|---|---:|---:|
| Projects Main | 1180 px | 860 px |
| Workspace | 1280 px | 900 px |

Esses valores representam dimensões máximas de referência para desktop, não dimensões obrigatórias em todos os dispositivos.

### 6.2. Expansão

Ao abrir o Workspace de um projeto selecionado, o modal deve expandir de 1180 × 860 px para 1280 × 900 px, respeitando os limites da viewport.

A expansão deve:

- Acontecer a partir do modal já aberto.
- Manter o alinhamento central.
- Preservar o backdrop.
- Utilizar uma transição suave.
- Evitar deslocamentos bruscos.
- Disponibilizar espaço adicional para a estrutura do Workspace.

O conteúdo não deve ser apresentado inicialmente comprimido para depois sofrer um redimensionamento abrupto.

### 6.3. Redução

Ao retornar ao Projects Main, o modal deve reduzir suas dimensões para o padrão de 1180 × 860 px.

A redução deve seguir o mesmo princípio visual da expansão, mantendo consistência na direção, duração e suavidade da animação.

### 6.4. Animação dimensional

Parâmetros de referência:

- Duração aproximada: 250 ms.
- Curva de aceleração e desaceleração suave.
- Redimensionamento centralizado.
- Ausência de oscilações ou saltos dimensionais.
- Backdrop estável durante toda a transição.

A animação deve respeitar a preferência `prefers-reduced-motion`, reduzindo ou removendo movimentos não essenciais.

### 6.5. Responsividade

As dimensões máximas não podem provocar cortes ou ultrapassar os limites visíveis da tela.

O comportamento esperado é:

**Desktop**
- Projects Main utiliza até 1180 × 860 px.
- Workspace utiliza até 1280 × 900 px.
- Ambos permanecem centralizados.

**Tablet**
- As dimensões são adaptadas à viewport disponível.
- O Workspace prioriza a preservação de sua estrutura operacional.
- Nenhum componente essencial pode ficar inacessível por causa do redimensionamento.

**Mobile**
- Ambas as interfaces ocupam a tela inteira.
- A navegação acontece pela substituição do conteúdo, sem expansão dimensional perceptível.
- Cada interface utiliza sua própria adaptação responsiva.
- A navegação do Workspace deve continuar acessível, mesmo quando Activity Bar e Explorer precisarem de uma apresentação adaptada.

### 6.6. Integridade dimensional

A expansão não deve modificar a identidade visual ou a hierarquia interna das interfaces.

O espaço adicional deve ser aproveitado pelo Workspace conforme sua própria composição, sem introduzir novos controles ou funcionalidades apenas para preencher a área disponível.

---

## 7. Transição de conteúdo

A troca entre Projects Main e Workspace deve acontecer dentro da área de conteúdo do mesmo modal.

### 7.1. Entrada no Workspace

1. O conteúdo de Projects Main inicia uma transição de saída.
2. O modal inicia sua expansão.
3. O Workspace é apresentado com uma transição suave de opacidade e deslocamento vertical discreto.
4. A interação é liberada quando a transição termina.

### 7.2. Retorno ao Projects Main

O processo ocorre inversamente:

1. O Workspace inicia a transição de saída.
2. O modal reduz suas dimensões.
3. Projects Main reaparece com seu estado anterior.
4. A interação é liberada ao término da transição.

### 7.3. Regras visuais

- Os conteúdos não devem ficar visualmente sobrepostos.
- Os headers são específicos de cada interface.
- O header anterior desaparece junto com seu conteúdo.
- O novo header aparece com sua respectiva interface.
- O backdrop permanece estável.
- Não deve existir um segundo modal ou backdrop durante a navegação.

---

## 8. Preservação de estado

Enquanto o modal permanecer aberto, cada interface deve preservar seu próprio contexto.

### 8.1. Projects Main

Preservar:

- Pesquisa.
- Ordenação.
- Posição da rolagem.
- Estado visual da listagem.

### 8.2. Workspace

Preservar:

- Arquivo selecionado.
- Pastas expandidas.
- Conteúdo editado.
- Alterações não salvas.
- Posição da rolagem.
- Activity Bar selecionada.
- Visibilidade do Explorer.
- Modo foco.

### 8.3. Independência entre projetos

Cada projeto possui seu próprio contexto de Workspace.

A troca de projeto não pode transferir arquivos selecionados, alterações pendentes, configurações visuais ou estados de navegação de um projeto para outro.

---

## 9. Proteção contra perda de alterações

Quando houver alterações não salvas, o sistema deve solicitar uma decisão antes de abandonar o Workspace ou encerrar o modal.

O diálogo deve apresentar três ações:

**Salvar e continuar**
- Salva as alterações antes de prosseguir.

**Descartar e continuar**
- Descarta as alterações pendentes e prossegue.

**Cancelar**
- Interrompe a navegação e mantém o usuário no Workspace atual.

A proteção deve ser aplicada tanto ao retorno ao Projects Main quanto à troca de projeto e ao fechamento do modal.

Nenhuma alteração pendente deve ser descartada silenciosamente.

---

## 10. Fechamento e reabertura

### 10.1. Fechamento

Ao solicitar o fechamento do modal:

- Sem alterações pendentes, o modal pode ser fechado diretamente.
- Com alterações pendentes, deve ser apresentada a confirmação correspondente.
- Após o fechamento, os estados temporários de navegação são encerrados.
- Os dados efetivamente salvos permanecem preservados.

### 10.2. Reabertura

Ao abrir novamente:

- Projects Main é apresentado inicialmente.
- Os projetos são carregados com seus dados persistidos.
- Os estados temporários da sessão anterior não precisam ser recuperados.
- Ao selecionar um projeto, seu Workspace é inicializado a partir dos dados persistidos.

A persistência dos dados do projeto não deve ser confundida com a persistência da sessão visual.

---

## 11. Princípios de design

Toda evolução visual dessas interfaces deve respeitar os seguintes princípios:

1. **Separação de responsabilidades:** Projects Main gerencia projetos; Workspace opera dentro de um projeto.
2. **Independência visual:** cada interface possui composição e hierarquia próprias.
3. **Contêiner compartilhado:** um único modal externo controla dimensões e navegação.
4. **Transição contextual:** a mudança de interface deve parecer contínua.
5. **Preservação de contexto:** retornar não deve destruir o estado temporário de trabalho.
6. **Proteção de dados:** alterações pendentes nunca devem ser descartadas silenciosamente.
7. **Responsividade:** dimensões máximas devem respeitar a viewport.
8. **Simplicidade:** não adicionar elementos sem uma responsabilidade funcional clara.

---

## 12. Referências visuais

Mocks de referência:

- `mocks/mock-main-projects.html` — Projects Main.
- `mocks/mock-workspace.html` — Workspace.

Esses arquivos representam as referências visuais e conceituais das respectivas interfaces.

A presente especificação consolida o comportamento esperado da navegação e do modal, sem substituir a identidade visual já estabelecida nos mocks.

**Escopo encerrado:** arquitetura visual, dimensional e comportamental da navegação entre Projects Main e Workspace.
