# Prompt Enhancer
## Matriz de Responsabilidades e Requisitos do Workspace

**Documento:** Referência funcional para implementação  
**Escopo:** Workspace — responsabilidades, dependências, estados, fluxos e critérios de conclusão  
**Natureza:** Especificação funcional derivada do mock visual, sem reconstrução visual  
**Baseline visual:** `mocks/mock-workspace.html`  
**Documentos de origem:** `docs/workspace-ui-architecture.md`, `docs/projects-workspace-navigation-spec.md`  
**Implementação de referência:** PR #26 (`feat/projects-workspace-navigation`)

---

## 0. Posicionamento

Este documento refina o primeiro mock do Workspace (`mocks/mock-workspace.html`) e a especificação de navegação (`docs/projects-workspace-navigation-spec.md`), convertendo a definição visual em uma **matriz de responsabilidades e requisitos**.

Ele é a referência funcional que orienta a implementação do PR #26. Cada componente passa a ter:

- Responsabilidade delimitada.
- Dependências de serviços explícitas.
- Critérios objetivos de conclusão.

**Regra fundamental:** componentes visuais não implementam diretamente regras de persistência. Eles solicitam operações ao **Workspace Controller** ou aos **serviços**, recebem o resultado e atualizam a apresentação.

---

## 1. Arquitetura funcional

A hierarquia entre as partes do Workspace é:

**Project Workspace**
- Contexto do projeto selecionado.

**Workspace Shell**
- Header · Toolbar · Activity Bar · Status Bar.

**Workspace Controller**
- Estado · Navegação · Ciclo de vida.

**Files**
- Explorer, Editor e Inspector.

**AI Access**
- Provedores, modelos e permissões.

**Settings**
- Configurações do projeto.

**Serviços e infraestrutura**
- Arquivos · Persistência · Permissões · Configurações · Sessões.

**Regra arquitetural:** os componentes visuais não implementam diretamente as regras de persistência. Eles solicitam operações ao controlador ou aos serviços, recebem o resultado e atualizam a apresentação.

---

## 2. Matriz de responsabilidades

### 2.1. Workspace Shell

Responsabilidade estrutural.

| Elemento | Responsabilidade | Critério de aceitação |
| --- | --- | --- |
| Header | Identificar o projeto atual | Nome e identificador corretos |
| Back Navigation | Retornar ao Projects Main | Preservar a sessão e respeitar alterações pendentes |
| Theme Control | Alternar tema | Aplicação consistente em todos os componentes |
| Toolbar | Expor controles de visualização | Estados visuais sincronizados |
| Activity Bar | Navegar entre as três áreas | Seção ativa corretamente identificada |
| Status Bar | Exibir estado operacional | Informações reais, sem valores fictícios |

**Não deve:** administrar arquivos, executar salvamentos ou implementar regras de permissões diretamente.

### 2.2. Files

Área principal do Workspace.

| Componente | Responsabilidades |
| --- | --- |
| Explorer | Exibir estrutura hierárquica de arquivos e diretórios |
| Tree Navigation | Gerenciar seleção, foco, expansão e recolhimento |
| Search | Pesquisar nomes e destacar correspondências |
| File Creation | Criar arquivos |
| Folder Creation | Criar diretórios |
| Rename | Renomear arquivos e diretórios |
| Delete | Excluir arquivos e diretórios com confirmação |
| Import | Importar arquivos e diretórios locais |
| Batch Creation | Criar múltiplos arquivos em uma operação |
| Editor | Editar conteúdo do arquivo selecionado |
| Breadcrumbs | Apresentar e permitir navegação pela localização |
| Dirty State | Detectar alterações não salvas |
| Save / Discard | Salvar ou descartar alterações |
| Inspector | Apresentar informações e controles contextuais |

#### 2.2.1. Regras específicas do Explorer

- A hierarquia deve refletir a estrutura real do projeto.
- Pastas devem ser navegáveis independentemente de arquivos.
- A pesquisa não deve destruir o estado de expansão original.
- A seleção deve permanecer consistente durante atualizações da árvore.
- Operações de renomeação e exclusão devem atualizar referências relacionadas.
- A navegação por teclado deve respeitar a hierarquia.
- A virtualização deve preservar foco, seleção e acessibilidade.
- Ações de criação e importação devem respeitar o diretório de destino.

#### 2.2.2. Regras específicas do Editor

- O conteúdo exibido deve corresponder ao arquivo selecionado.
- Alterações devem ser detectadas em relação à última versão salva.
- Salvar deve atualizar a persistência real.
- Descartar deve restaurar a última versão salva.
- Trocar de arquivo não pode descartar alterações silenciosamente.
- Erros de salvamento devem preservar o conteúdo editado.
- O indicador de alterações deve refletir o estado real do arquivo.

### 2.3. AI Access

Área a completar. O mock apresenta a existência da área, mas não define sua implementação.

| Componente funcional | Responsabilidade |
| --- | --- |
| Provider Management | Apresentar provedores de IA disponíveis |
| API Credentials | Gerenciar credenciais de acesso |
| Model Selection | Gerenciar modelos disponíveis |
| Project Permissions | Configurar permissões de utilização |
| File Permissions | Configurar permissões por arquivo |
| Effective Access | Exibir permissões efetivamente aplicadas |
| Validation | Validar configurações e credenciais |
| Persistence | Salvar e recuperar configurações |

**Regras:**

- Não exibir chaves secretas integralmente após o armazenamento.
- Diferenciar permissões herdadas de permissões explícitas.
- Não confundir configuração de acesso com autorização efetiva.
- Alterações inválidas não podem substituir configurações válidas.
- A interface deve apresentar claramente os estados de validação.

### 2.4. Project Settings

Área a completar.

| Componente funcional | Responsabilidade |
| --- | --- |
| General Settings | Configurações gerais do projeto |
| Project Metadata | Informações e identificação |
| Preferences | Preferências específicas |
| Configuration Editor | Editar configurações |
| Validation | Validar valores |
| Save | Persistir alterações |
| Reset / Cancel | Restaurar ou cancelar alterações locais |

**Regras:**

- As configurações pertencem ao projeto selecionado.
- Alterações devem possuir estado próprio.
- O salvamento deve ser explícito quando necessário.
- A navegação entre áreas deve respeitar alterações pendentes.
- Valores inválidos devem apresentar erros compreensíveis.

### 2.5. Inspector

Componente contextual.

O Inspector não deve se tornar uma quarta seção da Activity Bar. Sua responsabilidade é apresentar informações relacionadas ao contexto atual.

| Contexto | Informações esperadas |
| --- | --- |
| Arquivo selecionado | Nome, caminho, extensão e propriedades |
| Pasta selecionada | Nome, localização e informações estruturais |
| Permissões | Acesso efetivo e regras aplicadas |
| Estado de edição | Alterações pendentes |
| Ausência de seleção | Estado vazio apropriado |

O Inspector deve acompanhar a seleção sem assumir o controle dela.

---

## 3. Matriz de estados e persistência

| Estado | Proprietário | Persistência |
| --- | --- | --- |
| Projeto selecionado | Workspace Controller | Sessão |
| Área ativa | Workspace Controller | Sessão |
| Explorer expandido/recolhido | Workspace UI | Preferência de sessão |
| Modo foco | Workspace UI | Preferência de sessão |
| Pastas expandidas | Explorer | Sessão |
| Arquivo selecionado | Explorer | Sessão |
| Conteúdo editado | Editor | Estado local até salvar |
| Alterações pendentes | Editor / Controller | Estado local |
| Conteúdo salvo | File Service | Persistente |
| Permissões | Permission Service | Persistente |
| Configurações | Project Settings Service | Persistente |
| Tema | Sistema de aparência | Preferência |
| Estado operacional | Workspace Controller | Temporário |

**Cuidado:** preservar a sessão não significa necessariamente persistir tudo em armazenamento permanente. O conteúdo ainda não salvo, por exemplo, precisa de um tratamento próprio para evitar perdas.

---

## 4. Matriz de operações e fluxos

| Operação | Sequência esperada |
| --- | --- |
| Abrir projeto | Seleção → carregamento → Workspace |
| Selecionar arquivo | Explorer → resolução → Editor → Inspector |
| Criar arquivo | Solicitação → validação → persistência → atualização da árvore |
| Renomear arquivo | Solicitação → validação → persistência → atualização das referências |
| Excluir pasta | Confirmação → exclusão → atualização da árvore e seleção |
| Importar diretório | Seleção local → leitura → validação → criação |
| Salvar arquivo | Editor → validação → persistência → atualização do dirty-state |
| Descartar alterações | Editor → restauração → atualização do estado |
| Alterar permissão | Configuração → validação → persistência → recálculo do acesso efetivo |
| Alterar configuração | Edição → validação → salvamento → atualização |
| Alternar área | Verificação de pendências → troca de contexto |
| Retornar aos projetos | Verificação de pendências → restauração do Projects Main |

---

## 5. Requisitos transversais

Estes requisitos não pertencem exclusivamente a uma seção. Devem ser respeitados pelo Workspace inteiro.

1. **Integridade:** nenhuma operação pode deixar a árvore, o editor e a persistência em estados contraditórios.
2. **Consistência:** a mesma informação deve apresentar o mesmo estado em todos os componentes.
3. **Proteção de dados:** alterações pendentes não podem desaparecer silenciosamente.
4. **Acessibilidade:** navegação por teclado, foco visível e identificação semântica.
5. **Responsividade:** adaptação de layout sem eliminar operações importantes.
6. **Feedback:** todas as operações devem informar sucesso, falha ou progresso quando aplicável.
7. **Isolamento:** dados e estados de um projeto não podem contaminar outro.
8. **Recuperação:** falhas operacionais devem preservar dados locais ainda não persistidos.

---

## 6. Critérios de conclusão

Para evitar que uma implementação seja declarada pronta apenas porque os componentes aparecem na tela, são definidos cinco níveis de validação.

### Nível 1: Estrutural — Obrigatório

A composição visual corresponde ao mock, incluindo dimensões, hierarquia, painéis, espaçamentos, estados e responsividade.

### Nível 2: Interativo — Obrigatório

Botões, menus, navegação, atalhos, seleção e controles executam seus comportamentos esperados.

### Nível 3: Funcional — Obrigatório

As operações utilizam serviços reais, validam dados e atualizam corretamente os estados.

### Nível 4: Integridade — Obrigatório

Persistência, permissões, isolamento entre projetos e proteção contra perda de dados são testados.

### Nível 5: Validação visual — Obrigatório

Comparação visual com o mock em condições equivalentes, incluindo diferentes estados e dimensões.

---

## 7. Ordem de implementação proposta

A recomendação é não desenvolver as três áreas simultaneamente. Isso aumentaria a quantidade de dependências e dificultaria identificar regressões.

| Fase | Escopo | Resultado |
| --- | --- | --- |
| 01 | Workspace Shell | Estrutura visual e navegação |
| 02 | Files / Explorer | Árvore e operações reais |
| 03 | Editor | Edição, salvamento e dirty-state |
| 04 | Inspector | Contexto e permissões |
| 05 | AI Access | Configurações e acesso efetivo |
| 06 | Project Settings | Configurações persistentes |
| 07 | Integração | Sessões, navegação e proteção de dados |
| 08 | Validação | Testes funcionais e visuais |

---

## 8. Registro das decisões

Antes de tratar esta matriz como especificação definitiva, três decisões de arquitetura merecem destaque:

- **AI Access:** será uma área de gerenciamento de acesso e permissões, não apenas uma tela para cadastrar chaves.
- **Inspector:** será contextual e integrado ao Files, sem ocupar uma posição própria na Activity Bar.
- **Workspace Shell:** será independente das áreas internas, preservando a navegação e o estado ao alternar entre elas.

A matriz acima estabelece a base funcional.

---

## 9. Encaminhamento

O cruzamento foi concluído com base nos módulos reais em `src/workspace/`. Legenda: **E** = já existe; **A** = existe e precisa ser adaptado; **D** = precisa ser desenvolvido.

### 9.1. Mapa por área

| Área / requisito | Módulos reais | Situação | Observações |
| --- | --- | --- | --- |
| Shell, Activity Bar e navegação entre views | `workspace-ui.js` (render, `setActiveView`), `workspace-editor-view.js` (callbacks `onToggleExplorer`/`onToggleFocus`/`onToggleInspector`), `workspace-panel-layout.js` | A | Shell já troca de view sem perder estado; falta a reconstrução visual e o alinhamento responsivo com o mock. |
| Explorer: árvore, expand/collapse, busca | `workspace-explorer-view.js`, `workspace-tree-model.js` | A | Árvore e visibilidade existem; busca com destaque (`pe-match`) e expansão por descendente ainda não existem. |
| Editor: breadcrumbs, dirty, save/discard, read-only, erro de save | `workspace-editor-view.js`, `workspace-ui.js` (`updateEditorState`, `saveFile`) | A | `fileDirty`, `updateEditorState` e `saveFile` existem; falta o estado visual de erro preservando conteúdo e o layout de rodapé. |
| Inspector contextual (arquivo/pasta/permissões/vazio) | `workspace-inspector-view.js` (seções genéricas), `workspace-ui.js` (`inspectorDetails`, `toggleInspector`) | A | O painel já é contextual por seções; falta a composição de permissões e o estado vazio/oculto por padrão. |
| AI Access: provedor, chave, modelo, permissões | `file-registry.js` (`setAccess`), `workspace-model.js` (`aiAccessMode`), `context-resolver.js`, `api-client.js` | A/D | Permissões por arquivo (`allowed`/`denied`) e modos `all`/`selected`/`none` existem; cadastro de provedor/chave/modelo como view própria não existe. |
| Project Settings: nome, descrição, view padrão, instruções, config | `workspace-model.js` (`normalizeProject`), `workspace-ui.js` (`saveProjectSettings`, `resetProjectSettings`) | A/D | Nome, descrição, `instructions` e `aiAccessMode` existem; `defaultView` e validação de config JSON ainda não existem. |
| Operações: criar/renomear/excluir/importar/lote | `workspace-controller.js` (`createFiles`, `createFolder`, `importFiles`), `file-registry.js` (`create`, `createMany`, `update`, `remove`), `workspace-ui.js` (`openBatchComposer`, `importFiles`) | A | Operações existem; falta o fluxo de lote com diálogo, importação por estrutura de diretórios e confirmação de exclusão. |
| Estados e persistência | `storage-adapter.js`, `project-manager.js`, `file-registry.js` | E | `IndexedDB` com limites (`maxFiles`, `maxBytes`), `updatedAt` e exclusão de arquivos existem. |
| Fluxos com salvamento pendente | `workspace-ui.js` (`askChoice`, `saveDrafts`, `confirmLeave`, `confirmLeaveFile`) | E | Guard de navegação já implementado com `cancel`/`discard`/`save`; alinhar textos e foco ao mock. |
| Responsividade, tema e acessibilidade | `src/styles.js` (CSS do workspace ~linhas 4307–4550), `workspace-panel-layout.js` | A | Layout em grid e painel redimensionável existem; faltam os estados responsivos do mock (navtabs com scroll, project bar em duas linhas) e validação de contraste/foco. |

### 9.2. Dependências

1. `workspace-model.js` precisa ser estendido com `defaultView` e validação de config JSON antes de a view de Settings ser implementada.
2. A view de AI Access depende de uma camada de provedores (hoje apenas `api-client.js`) e do contrato de permissões já existente em `file-registry.js`.
3. A busca e o inspector dependem de `workspace-tree-model.js` e `workspace-explorer-view.js`, respectivamente; nenhum dos dois deve ser reescrito do zero.
4. A reconstrução visual depende do CSS em `src/styles.js`; o mock não deve ditar novos tokens fora do sistema.

### 9.3. Restrição de sequência

A reconstrução visual está liberada **apenas para as áreas marcadas como A**, e ainda assim de forma incremental sobre os módulos existentes. As áreas D (AI Access provider/key/model, `defaultView`, config JSON) exigem decisão de contrato antes de qualquer UI definitiva.