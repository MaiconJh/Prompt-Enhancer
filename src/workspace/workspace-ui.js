// ===== src/workspace/workspace-ui.js =====
const WorkspaceUI = (() => {
 const MARKUP = "\n<header class=\"pe-panel__header\">\n <button class=\"pe-back-link\" data-action=\"back\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"15 18 9 12 15 6\"/></svg><span class=\"back-label\">Voltar aos meus projetos</span></button>\n <div class=\"pe-modal__titles\"><h4 data-project-name></h4><p data-project-id></p></div>\n <div class=\"pe-modal__header-actions\"><span class=\"pe-header-dirty\" data-header-dirty hidden>Alterações não salvas</span><button class=\"pe-icon-btn\" data-action=\"theme\" aria-label=\"Alternar tema\"></button></div>\n</header>\n<div class=\"pe-panel__body\"><section class=\"pe-workspace\">\n <div class=\"pe-workspace__toolbar\"><div class=\"pe-workspace__toolbar-title\"><strong data-view-title></strong><span data-view-subtitle></span></div><div class=\"pe-workspace__toolbar-actions\">\n  <span class=\"pe-save-state\" data-save-state hidden></span>\n  <button class=\"pe-btn\" data-action=\"explorer\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><line x1=\"9\" y1=\"3\" x2=\"9\" y2=\"21\"/></svg><span class=\"btn-label\">Ocultar explorador</span></button>\n  <button class=\"pe-btn\" data-action=\"inspector\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><line x1=\"15\" y1=\"3\" x2=\"15\" y2=\"21\"/></svg><span class=\"btn-label\">Inspector</span></button>\n  <button class=\"pe-btn\" data-action=\"focus\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3\"/></svg><span class=\"btn-label\">Modo foco</span></button>\n </div></div>\n <div class=\"pe-workspace__layout\">\n  <nav class=\"pe-activity-bar\" aria-label=\"Navegação do workspace\">\n   <button class=\"pe-activity-btn is-active\" data-view=\"files\"><span><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z\"/></svg></span><span class=\"pe-activity-label\">Arquivos</span></button>\n   <button class=\"pe-activity-btn\" data-view=\"ai\"><span><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L13 10h-2l.25-.07A4.001 4.001 0 0 1 12 2z\"/><path d=\"M8 14a4 4 0 1 1 8 0\"/><path d=\"M5 22v-3a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3\"/></svg></span><span class=\"pe-activity-label\">Acesso à IA</span></button>\n   <button class=\"pe-activity-btn\" data-view=\"settings\"><span><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z\"/></svg></span><span class=\"pe-activity-label\">Configurações</span></button>\n  </nav>\n  <aside class=\"pe-explorer\" data-explorer><div class=\"pe-explorer__header\"><span class=\"pe-explorer__title\">Explorer</span><div class=\"pe-explorer__actions\">\n   <button class=\"pe-icon-btn\" data-action=\"new-file\" aria-label=\"Novo arquivo\" title=\"Novo arquivo\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/><line x1=\"12\" y1=\"18\" x2=\"12\" y2=\"12\"/><line x1=\"9\" y1=\"15\" x2=\"15\" y2=\"15\"/></svg></button><button class=\"pe-icon-btn\" data-action=\"new-folder\" aria-label=\"Nova pasta\" title=\"Nova pasta\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z\"/><line x1=\"12\" y1=\"11\" x2=\"12\" y2=\"17\"/><line x1=\"9\" y1=\"14\" x2=\"15\" y2=\"14\"/></svg></button><button class=\"pe-icon-btn\" data-action=\"import-files\" aria-label=\"Importar arquivos\" title=\"Importar arquivos\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"17 8 12 3 7 8\"/><line x1=\"12\" y1=\"3\" x2=\"12\" y2=\"15\"/></svg></button><button class=\"pe-icon-btn\" data-action=\"import-dir\" aria-label=\"Importar diretório\" title=\"Importar diretório\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z\"/><polyline points=\"12 10 12 16\"/><polyline points=\"9 13 12 10 15 13\"/></svg></button><button class=\"pe-icon-btn\" data-action=\"batch\" aria-label=\"Criar vários arquivos\" title=\"Criar vários arquivos\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/></svg></button>\n  </div></div><div class=\"pe-explorer__search\"><input class=\"pe-input\" data-search type=\"search\" placeholder=\"Pesquisar arquivos...\" /></div><div class=\"pe-tree-container\" data-tree role=\"tree\" tabindex=\"0\"></div><input data-file-input type=\"file\" multiple hidden /><input data-dir-input type=\"file\" webkitdirectory directory multiple hidden /></aside>\n  <main class=\"pe-editor\" data-view-panel=\"files\">\n   <div class=\"pe-editor__toolbar\" data-editor-toolbar hidden><div class=\"pe-editor__path\" data-breadcrumbs></div><div class=\"pe-editor__tools\"><span class=\"pe-readonly-badge\" data-readonly hidden><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" width=\"11\" height=\"11\"><rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/></svg>Somente leitura</span><button class=\"pe-btn pe-btn--primary\" data-action=\"save-file\" hidden><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z\"/><polyline points=\"17 21 17 13 7 13 7 21\"/><polyline points=\"7 3 7 8 15 8\"/></svg>Salvar</button><button class=\"pe-btn\" data-action=\"discard-file\" hidden>Descartar</button></div></div>\n   <div class=\"pe-editor__error\" data-save-error hidden></div><div class=\"pe-editor__area\" data-editor-area hidden><textarea class=\"pe-editor__textarea\" data-editor spellcheck=\"false\"></textarea></div>\n   <div class=\"pe-editor__empty\" data-editor-empty><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/></svg><span>Nenhum arquivo selecionado</span><span>Escolha um arquivo no explorador para começar</span></div>\n  </main>\n  <aside class=\"pe-inspector\" data-inspector hidden><div class=\"pe-inspector__header\"><span>Inspector</span><button class=\"pe-icon-btn\" data-action=\"close-inspector\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg></button></div><div class=\"pe-inspector__body\" data-inspector-body></div></aside>\n  <main class=\"pe-viewpage\" data-view-panel=\"ai\" hidden><div class=\"pe-viewpage__inner\">\n   <div class=\"pe-viewpage__head\"><h3>Acesso à IA</h3><p>Gerencie provedores, credenciais, modelos e permissões. O acesso efetivo combina as regras do projeto e de cada arquivo.</p></div>\n   <div class=\"pe-ai-grid\">\n    <section class=\"pe-card\"><h4>Provedores</h4><div class=\"pe-provider-list\" data-provider-list></div><p class=\"pe-card__hint\">Provedores disponíveis no catálogo.</p></section>\n    <section class=\"pe-card\"><h4>Credencial e modelo</h4><label class=\"pe-field\"><span class=\"pe-field-label\">Chave de API</span><span class=\"pe-input-row\"><input class=\"pe-input\" data-api-key type=\"password\" autocomplete=\"off\" placeholder=\"sk-...\" /><button class=\"pe-icon-btn\" data-action=\"toggle-key\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg></button></span><span class=\"pe-field-warning\" data-key-error hidden></span><span class=\"pe-field-hint\" data-key-hint></span></label><label class=\"pe-field\"><span class=\"pe-field-label\">Modelo</span><select class=\"pe-input\" data-model></select><span class=\"pe-field-warning\" data-model-error hidden></span></label></section>\n    <section class=\"pe-card\"><h4>Permissões do projeto</h4><div class=\"pe-segmented\" data-access-modes></div><p class=\"pe-card__hint\" data-access-hint></p></section>\n    <section class=\"pe-card\"><h4>Validação</h4><ul class=\"pe-validation\"><li data-validation-key></li><li data-validation-model></li><li data-validation-access></li></ul></section>\n    <section class=\"pe-card pe-card--wide\"><h4>Acesso efetivo por arquivo</h4><p class=\"pe-card__hint\" data-effective-summary></p><div class=\"pe-file-perms\" data-file-perms></div></section>\n   </div>\n  </div></main>\n  <main class=\"pe-viewpage\" data-view-panel=\"settings\" hidden><div class=\"pe-viewpage__inner\">\n   <div class=\"pe-viewpage__head\"><h3>Configurações do projeto</h3><p>Preferências e metadados do projeto selecionado.</p></div>\n   <section class=\"pe-card\"><h4>Geral</h4><div class=\"pe-form-grid\">\n    <label class=\"pe-field\"><span class=\"pe-field-label\">Nome do projeto</span><input class=\"pe-input\" data-setting=\"name\" /><span class=\"pe-field-warning\" data-setting-error=\"name\" hidden></span></label>\n    <label class=\"pe-field\"><span class=\"pe-field-label\">Descrição</span><input class=\"pe-input\" data-setting=\"description\" /><span class=\"pe-field-warning\" data-setting-error=\"description\" hidden></span></label>\n    <label class=\"pe-field pe-field--full\"><span class=\"pe-field-label\">Preferência de abertura</span><select class=\"pe-input\" data-setting=\"defaultView\"><option value=\"files\">Arquivos</option><option value=\"ai\">Acesso à IA</option><option value=\"settings\">Configurações</option></select></label>\n    <label class=\"pe-field pe-field--full\"><span class=\"pe-field-label\">Instruções do projeto <em data-instruction-count>0/20000</em></span><textarea class=\"pe-input\" data-setting=\"instructions\"></textarea><span class=\"pe-field-warning\" data-setting-error=\"instructions\" hidden></span></label>\n   </div></section>\n   <div class=\"pe-ai-grid\"><section class=\"pe-card\"><h4>Metadados</h4><dl class=\"pe-meta\" data-project-meta></dl></section><section class=\"pe-card\"><h4>Preferências</h4><dl class=\"pe-meta\" data-project-preferences></dl></section>\n    <section class=\"pe-card pe-card--wide\"><h4>Editor de configuração</h4><textarea class=\"pe-input pe-code\" data-setting=\"configText\" spellcheck=\"false\"></textarea><span class=\"pe-field-warning\" data-setting-error=\"config\" hidden></span><span class=\"pe-field-hint\">JSON de configurações do projeto.</span></section></div>\n   \n  </div></main>\n </div>\n <footer class=\"pe-workspace__status\"><span class=\"status-dot\" data-status-dot></span><span class=\"status-main\" data-status-text>Carregando</span><span class=\"sep\">|</span><span data-status-files>0 arquivos</span><span class=\"sep\">|</span><span data-status-size>0 B</span><span class=\"sep\">|</span><span data-status-selection>nenhum arquivo selecionado</span><span class=\"spacer\"></span><span data-status-pending hidden></span><span class=\"sep\">|</span><span data-status-project></span></footer>\n</section></div>\n<div class=\"pe-toasts\" data-toasts aria-live=\"polite\"></div>\n<div class=\"pe-dialog-backdrop\" data-dialog=\"pending\" role=\"dialog\" aria-modal=\"true\" hidden><div class=\"pe-dialog\"><h4>Alterações não salvas</h4><p>Você tem alterações que ainda não foram salvas. Escolha como continuar antes de navegar.</p><div class=\"pe-dialog__actions\"><button class=\"pe-btn\" data-action=\"cancel-pending\">Cancelar</button><button class=\"pe-btn pe-btn--danger\" data-action=\"discard-continue\">Descartar e continuar</button><button class=\"pe-btn pe-btn--primary\" data-action=\"save-continue\">Salvar e continuar</button></div></div></div>\n<div class=\"pe-dialog-backdrop\" data-dialog=\"delete\" role=\"dialog\" aria-modal=\"true\" hidden><div class=\"pe-dialog\"><h4 data-delete-title>Excluir item</h4><p data-delete-message></p><div class=\"pe-dialog__actions\"><button class=\"pe-btn\" data-action=\"cancel-delete\">Cancelar</button><button class=\"pe-btn pe-btn--danger\" data-action=\"confirm-delete\">Excluir</button></div></div></div>\n<div class=\"pe-dialog-backdrop\" data-dialog=\"batch\" role=\"dialog\" aria-modal=\"true\" hidden><div class=\"pe-dialog\"><h4>Criar vários arquivos</h4><p>Informe um caminho relativo por linha.</p><textarea class=\"pe-input\" data-batch-paths placeholder=\"src/app.js&#10;src/utils.js&#10;README.md\"></textarea><p data-batch-preview>Nenhum caminho informado.</p><div class=\"pe-dialog__actions\"><button class=\"pe-btn\" data-action=\"close-batch\">Cancelar</button><button class=\"pe-btn pe-btn--primary\" data-action=\"commit-batch\">Criar arquivos</button></div></div></div>\n";
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const bytes=s=>new TextEncoder().encode(String(s||'')).byteLength;
 const fmt=n=>{n=Math.max(0,Number(n)||0);return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';};
 const lang=name=>({md:'Markdown',json:'JSON',js:'JavaScript',ts:'TypeScript',tsx:'TypeScript React',jsx:'JavaScript React',html:'HTML',css:'CSS',py:'Python',java:'Java',yml:'YAML',yaml:'YAML',sh:'Shell',sql:'SQL'}[(String(name||'').split('.').pop()).toLowerCase()]||'Texto');
 const json=value=>{try{return JSON.stringify(value);}catch(_){return '';}};
 const date=value=>{const d=new Date(Number(value)||Date.now());return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR');};

function render(container,options={}){
   WorkspaceStyles.inject();
   const activeProjectId=Workspace.getActiveProjectId();
   const projectId=options.projectId??activeProjectId;
   if(projectId==null||projectId==='')throw new Error('Nenhum projeto foi selecionado.');
  const host=el('div','pe-workspace-host');host.style.cssText='display:flex;flex-direction:column;width:100%;height:100%;min-height:0;';host.innerHTML=MARKUP;container.appendChild(host);
  const $=s=>host.querySelector(s), $$=s=>[...host.querySelectorAll(s)];
  const on=(s,e,fn)=>$(s)?.addEventListener(e,fn);
  const toastHost=$('[data-toasts]');
  if(toastHost){
   toastHost.className='pe-workspace-toast-stack';
   document.body.appendChild(toastHost);
  }
  const tree=$('[data-tree]'),editor=$('[data-editor]'),fileInput=$('[data-file-input]'),dirInput=$('[data-dir-input]'),apiKeyInput=$('[data-api-key]');
  let project=null,files=[],folders=[],selectedFile=null,selectedFileId=null,inspectedNodeId=null,focusedNodeId=null;
  let activeView='files',collapsed=false,focusMode=false,inspectorOpen=false,searchQuery='',expandedPaths=new Set(),renderedEditorFileId=null,forceEditorSync=false;
  let editingNodeId=null,renameValue='',renameCommitInProgress=false,draftFiles=[],draftFolders=[],saveError=null;
  const contents=new Map(),originals=new Map(),dirty=new Set();
  let providerGroups=[],ai={providerId:'',modelId:'',apiKey:'',accessMode:'selected',fileAccess:{}},aiSaved='',showKey=false,aiErrors={};
  let settings={name:'',description:'',defaultView:'files',instructions:'',configText:'{}'},settingsSaved='';
  let pendingAction=null,pendingDelete=null,pendingResolver=null,resizeObserver=null,catalogPromise=null,destroyed=false;

  const fileById=id=>files.find(f=>f.id===id)||draftFiles.find(f=>f.id===id)||null;
  const folderById=id=>folders.find(f=>f.id===id)||draftFolders.find(f=>f.id===id)||null;
  const nodeById=id=>{
   const f=fileById(id);if(f)return{id:f.id,name:f.name,path:f.path,type:'file',file:f};
   const folder=folderById(id);if(folder)return{id:folder.id,name:folder.name,path:folder.path,type:'folder',folder};
   if(typeof id==='string'&&id.startsWith('folder:')){const path=id.slice(7);return{id,name:path.split('/').pop(),path,type:'folder',folder:null};}
   return null;
  };
  const inspected=()=>nodeById(inspectedNodeId);
  const parentPath=node=>!node?'':node.type==='folder'?node.path:node.path.split('/').slice(0,-1).join('/');
  const createParent=()=>parentPath(inspected());
  const dirtyFile=id=>dirty.has(id);
  const aiSnapshot=()=>({providerId:ai.providerId,modelId:ai.modelId,apiKey:ai.apiKey,accessMode:ai.accessMode,fileAccess:{...ai.fileAccess}});
  const aiDirty=()=>json(aiSnapshot())!==aiSaved;
  const settingsSnapshot=()=>({...settings});
  const settingsDirty=()=>json(settingsSnapshot())!==settingsSaved;
  const hasPending=()=>dirty.size>0||aiDirty()||settingsDirty();
  const totalSize=()=>files.reduce((n,f)=>n+(Number(f.size)||0),0);
  const effective=id=>ai.accessMode==='none'?'denied':ai.accessMode==='all'?'allowed':ai.fileAccess[id]==='allowed'?'allowed':'denied';
  const accessLabel=()=>ai.accessMode==='none'?'Nenhum arquivo disponível':ai.accessMode==='all'?'Todos os arquivos disponíveis':'Somente arquivos permitidos';

  function toast(message,type='info'){
   if(!toastHost)return;
   const n=el('div','pe-workspace-toast pe-workspace-toast--'+type,message);
   n.setAttribute('role',type==='error'?'alert':'status');
   n.setAttribute('aria-live',type==='error'?'assertive':'polite');
   const computed=getComputedStyle(host);
   for(let i=0;i<computed.length;i++){
    const name=computed.item(i);
    if(name.startsWith('--pe-'))n.style.setProperty(name,computed.getPropertyValue(name));
   }
   toastHost.appendChild(n);
   setTimeout(()=>n.remove(),3200);
  }
  function status(message,type=''){
   $('[data-status-text]').textContent=message;$('[data-status-dot]').style.background=type==='error'?'var(--pe-error)':type==='warning'?'var(--pe-warning)':'var(--pe-success)';
  }
  function dialog(name,visible){const d=$('[data-dialog="'+name+'"]');d.hidden=!visible;if(visible)d.querySelector('button')?.focus();}
  function updateHeader(){
   $('[data-project-name]').textContent=project?.name||'';$('[data-project-id]').textContent=project?'Workspace do projeto · '+project.id:'';
   $('[data-header-dirty]').hidden=!hasPending();
  }
  function updateLayout(){
   const layout=$('.pe-workspace__layout');
   layout.classList.toggle('is-explorer-collapsed',collapsed);layout.classList.toggle('is-focus-mode',focusMode);
   layout.classList.toggle('is-page-view',activeView!=='files');layout.classList.toggle('has-inspector',activeView==='files'&&inspectorOpen);
   for(const v of ['files','ai','settings']){$('[data-view="'+v+'"]').classList.toggle('is-active',activeView===v);$('[data-view="'+v+'"]').setAttribute('aria-current',activeView===v?'page':'false');$('[data-view-panel="'+v+'"]').hidden=activeView!==v;}
   $('[data-inspector]').hidden=activeView!=='files'||!inspectorOpen;$('[data-explorer]').hidden=activeView!=='files';
   $('[data-action="explorer"]').hidden=activeView!=='files'||focusMode;$('[data-action="inspector"]').hidden=activeView!=='files';$('[data-action="focus"]').hidden=activeView!=='files';
   $('[data-action="explorer"]').setAttribute('aria-pressed',String(!collapsed));$('[data-action="explorer"] .btn-label').textContent=collapsed?'Mostrar explorador':'Ocultar explorador';
   $('[data-action="inspector"]').setAttribute('aria-pressed',String(inspectorOpen));$('[data-action="focus"]').setAttribute('aria-pressed',String(focusMode));$('[data-action="focus"] .btn-label').textContent=focusMode?'Sair do foco':'Modo foco';
   $('[data-view-title]').textContent=activeView==='ai'?'Acesso à IA':activeView==='settings'?'Configurações':'Arquivos';
   $('[data-view-subtitle]').textContent=activeView==='ai'?'Provedores, credenciais, modelos e permissões':activeView==='settings'?'Preferências e metadados do projeto':project?.name||'';
   const save=$('[data-save-state]');save.hidden=activeView!=='files';save.className='pe-save-state'+(saveError?' is-error':selectedFileId&&dirtyFile(selectedFileId)?' is-dirty':'');save.textContent=saveError?'Erro ao salvar':selectedFileId&&dirtyFile(selectedFileId)?'Alterações não salvas':selectedFile?'Salvo':'Sem arquivo';
  }
  function renderTree(){
   WorkspaceExplorerView.render(tree,{files:files.concat(draftFiles),folders:folders.concat(draftFolders),expandedPaths,searchQuery,
    selectedFileId,inspectedNodeId,focusedNodeId,editingNodeId,renameValue,isDirty:dirtyFile,
    onSelect:selectFile,onInspect:r=>{inspectedNodeId=r.id;renderInspector();updateHeader();renderTree();},onFocus:r=>{focusedNodeId=r.id;},
    onStartRename:startRename,onRenameInput:v=>{renameValue=v;},onCommitRename:commitRename,onCancelRename:cancelRename,onDelete:prepareDelete});
  }
  function breadcrumbs(){
   const target=$('[data-breadcrumbs]');target.replaceChildren();if(!selectedFile)return;
   let path='';const parts=selectedFile.path.split('/');
   parts.forEach((part,i)=>{path=path?path+'/'+part:part;const crumb=el('span','crumb'+(i===parts.length-1?' last':''),part);crumb.addEventListener('click',()=>{if(i===parts.length-1)selectFile(selectedFile.id);else{const id=folders.find(f=>f.path===path)?.id||'folder:'+path;inspectedNodeId=id;focusedNodeId=id;renderTree();WorkspaceExplorerView.reveal(tree,path);renderInspector();}});target.append(crumb);if(i<parts.length-1)target.append(el('span','sep','/'));});
  }
  function renderEditor(){
   const has=!!selectedFile;$('[data-editor-toolbar]').hidden=!has;$('[data-editor-area]').hidden=!has;$('[data-editor-empty]').hidden=has;
   if(has){const value=contents.get(selectedFile.id)??selectedFile.content??'';if(forceEditorSync||renderedEditorFileId!==selectedFile.id||(editor.value!==value&&document.activeElement!==editor))editor.value=value;renderedEditorFileId=selectedFile.id;forceEditorSync=false;
    $('[data-readonly]').hidden=!selectedFile.readOnly;editor.readOnly=!!selectedFile.readOnly;
    $('[data-action="save-file"]').hidden=!dirtyFile(selectedFile.id);$('[data-action="discard-file"]').hidden=!dirtyFile(selectedFile.id);
    $('[data-save-error]').hidden=!(saveError&&saveError.id===selectedFile.id);$('[data-save-error]').textContent=saveError?.message||'';
   }else{editor.value='';editor.readOnly=false;renderedEditorFileId=null;forceEditorSync=false;$('[data-action="save-file"]').hidden=true;$('[data-action="discard-file"]').hidden=true;$('[data-save-error]').hidden=true;}
   breadcrumbs();
  }
  function nodeSize(node){return node.type==='file'?Number(node.file?.size)||bytes(contents.get(node.id)||originals.get(node.id)||''):files.filter(f=>f.path.startsWith(node.path+'/')).reduce((n,f)=>n+(Number(f.size)||0),0);}
  function renderInspector(){
   const target=$('[data-inspector-body]');target.replaceChildren();const node=inspected();
   if(!node){const empty=el('div','pe-inspector__empty');empty.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';empty.append(el('span','','Nenhuma seleção'),el('span','','Selecione um arquivo ou pasta para ver os detalhes.'));target.append(empty);return;}
   target.append(el('div','pe-inspector__path',node.path));
   const section=el('section','pe-inspector__section');section.append(el('h5','',node.type==='folder'?'Pasta':'Arquivo'));
   const row=(label,value)=>{const d=el('dl','pe-inspector__row');d.append(el('dt','',label),el('dd','',String(value)));section.append(d);};
   row('Nome',node.name);
   if(node.type==='file'){row('Extensão',node.name.includes('.')?'.'+node.name.split('.').pop():'sem extensão');row('Linguagem',lang(node.name));row('Tamanho',fmt(nodeSize(node)));row('Encoding','UTF-8');}
   else{const p=node.path;row('Itens',files.filter(f=>f.path.startsWith(p+'/')).length+folders.filter(f=>f.path.startsWith(p+'/')).length);row('Tamanho',fmt(nodeSize(node)));}
   target.append(section);
   if(node.type==='file'){const access=el('section','pe-inspector__section');access.append(el('h5','','Acesso à IA'));const r=el('div','pe-access-row');r.append(el('span','','Acesso efetivo'),el('span','pe-badge '+(effective(node.id)==='allowed'?'pe-badge--on':'pe-badge--off'),effective(node.id)==='allowed'?'Permitido':'Sem acesso'));access.append(r);
    const toggle=el('button','pe-btn',ai.fileAccess[node.id]==='allowed'?'Negar acesso do arquivo':'Permitir acesso do arquivo');toggle.disabled=ai.accessMode!=='selected';toggle.addEventListener('click',()=>toggleFileAccess(node.id));access.append(toggle);target.append(access);}
   const edit=el('section','pe-inspector__section');edit.append(el('h5','','Estado de edição'));const r=el('div','pe-access-row');r.append(el('span','','Alterações pendentes'),el('span','pe-badge '+(dirtyFile(node.id)?'pe-badge--warn':'pe-badge--ok'),dirtyFile(node.id)?'Não salvas':'Salvo'));edit.append(r);target.append(edit);
  }
  function updateFooter(){
    const visible=(activeView==='ai'&&aiDirty())||(activeView==='settings'&&settingsDirty());
    const save=activeView==='ai'?()=>saveAi():activeView==='settings'?()=>saveSettings():null;
    const discard=activeView==='ai'?resetAi:activeView==='settings'?resetSettings:null;
    options.onFooterChange?.({visible,save,discard});
  }
  function updateAll(){updateHeader();updateLayout();renderTree();renderEditor();renderInspector();updateStatus();renderAI();renderSettings();updateFooter();}
  function updateStatus(){
   $('[data-status-files]').textContent=files.length+' arquivos';$('[data-status-size]').textContent=fmt(totalSize());
   $('[data-status-selection]').textContent=selectedFile?selectedFile.name+' · '+lang(selectedFile.name)+' · UTF-8':'nenhum arquivo selecionado';
   $('[data-status-project]').textContent=project?.id||'';const p=$('[data-status-pending]');p.hidden=!dirty.size;p.replaceChildren();if(dirty.size){const dot=el('span','status-dot');dot.style.background='var(--pe-warning)';p.append(dot,document.createTextNode(dirty.size+' pendência(s)'));}
   status(saveError?'Erro ao salvar':dirty.size?'Alterações não salvas':'Pronto',saveError?'error':dirty.size?'warning':'');
  }
  function reconcileAiFileBaseline(){
   let baseline;try{baseline=JSON.parse(aiSaved||'{}');}catch(_){baseline={};}baseline.fileAccess=baseline.fileAccess||{};
   const ids=new Set(files.map(f=>f.id));for(const id of Object.keys(baseline.fileAccess))if(!ids.has(id))delete baseline.fileAccess[id];
   for(const f of files){if(!Object.prototype.hasOwnProperty.call(baseline.fileAccess,f.id))baseline.fileAccess[f.id]=f.aiAccess||'denied';if(!Object.prototype.hasOwnProperty.call(ai.fileAccess,f.id))ai.fileAccess[f.id]=f.aiAccess||'denied';}
   aiSaved=json(baseline);
  }
  async function refreshData(){
   files=await Workspace.files.list(project.id);folders=await Workspace.folders.list(project.id);
   for(const id of [...dirty])if(!files.some(f=>f.id===id))dirty.delete(id);
   if(selectedFileId){const f=await Workspace.files.get(project.id,selectedFileId);if(f)selectedFile=f;else{selectedFile=null;selectedFileId=null;}}
   reconcileAiFileBaseline();
   updateAll();
  }
  async function loadProject(){
   status('Carregando projeto');project=await Workspace.projects.get(projectId);if(!project)throw new Error('O projeto selecionado não existe mais.');
   files=await Workspace.files.list(project.id);folders=await Workspace.folders.list(project.id);
   settings={name:project.name,description:project.description||'',defaultView:project.settings?.defaultView||'files',instructions:project.settings?.instructions||'',configText:JSON.stringify(project.settings?.config||{includePatterns:[],maxContextBytes:49152},null,2)};
    settingsSaved=json(settings);ai.accessMode=project.settings?.aiAccessMode||'selected';ai.fileAccess=Object.fromEntries(files.map(f=>[f.id,f.aiAccess||'denied']));aiSaved=json(aiSnapshot());
    const pinned=ProviderManager.getPinned?.();const preferredModelId=project.settings?.aiProviderModelId||'';let model=preferredModelId?ProviderRegistry.get(preferredModelId):null;if(!model)model=pinned||ProviderRegistry.getCached()[0]||null;
    if(preferredModelId){try{await ensureCatalog();}catch(error){toast(error.message||'Falha ao carregar provedores.','error');}model=ProviderRegistry.get(preferredModelId)||null;}
   if(model){if(preferredModelId&&!ProviderManager.pin(model))toast('O modelo salvo não pôde ser ativado; revise o Acesso à IA.','warning');ai.providerId=model.providerId;ai.modelId=model.id;const currentPinned=ProviderManager.getPinned?.();const active=ProviderManager.getActive?.();ai.apiKey=currentPinned?.id===model.id?active?.apiKey||'':'';}
   else if(preferredModelId){ai.providerId='';ai.modelId=preferredModelId;ai.apiKey='';}
   aiSaved=json(aiSnapshot());activeView=['files','ai','settings'].includes(project.settings?.defaultView)?project.settings.defaultView:'files';
   expandedPaths=new Set(folders.filter(f=>!f.path.includes('/')).map(f=>f.path));if(!expandedPaths.size)for(const f of files)if(f.path.includes('/'))expandedPaths.add(f.path.split('/')[0]);
    if(files[0])await selectFileNow(files[0].id);if(activeView==='ai'){try{await ensureCatalog();}catch(error){toast(error.message||'Falha ao carregar provedores.','error');}}updateAll();status('Pronto');
  }
  async function selectFileNow(id){
   const file=await Workspace.files.get(project.id,id);if(!file)throw new Error('Arquivo não encontrado.');
   selectedFileId=id;selectedFile=file;inspectedNodeId=id;focusedNodeId=id;
   if(!originals.has(id))originals.set(id,file.content||'');if(!contents.has(id))contents.set(id,file.content||'');saveError=null;updateAll();
  }
  function requestAction(action){if(!hasPending()){executeAction(action);return;}pendingAction=action;dialog('pending',true);}
  function executeAction(action){if(!action)return;if(action.type==='select')selectFileNow(action.id).catch(e=>toast(e.message,'error'));else if(action.type==='view'){activeView=action.view;if(activeView!=='files')focusMode=false;if(activeView==='ai')ensureCatalog().catch(e=>toast(e.message||'Falha ao carregar provedores.','error'));updateAll();}else if(action.type==='back')options.onBack?.();else if(action.type==='delete')showDelete(action.node);}
  function selectFile(id){if(id===selectedFileId)return;requestAction({type:'select',id});}
  function startCreateFile(){const parent=createParent(),id='draft-file-'+Utils.uid('f'),name='novo-arquivo.md';draftFiles.push({id,name,path:parent?parent+'/'+name:name,size:0,aiAccess:'denied',draft:true});editingNodeId=id;renameValue=name;if(parent)expandedPaths.add(parent);renderTree();}
  function startCreateFolder(){const parent=createParent(),id='draft-folder-'+Utils.uid('d'),name='nova-pasta';draftFolders.push({id,name,path:parent?parent+'/'+name:name,draft:true});editingNodeId=id;renameValue=name;if(parent)expandedPaths.add(parent);renderTree();}
  function startRename(row){editingNodeId=row.id;renameValue=row.name;renderTree();}
  function cancelRename(){const id=editingNodeId;editingNodeId=null;if(id){draftFiles=draftFiles.filter(f=>f.id!==id);draftFolders=draftFolders.filter(f=>f.id!==id);}renderTree();}
  async function commitRename(){
   const id=editingNodeId,node=nodeById(id),name=String(renameValue||'').trim();if(!id||renameCommitInProgress)return;if(!node||!name){cancelRename();return;}renameCommitInProgress=true;
   const parent=node.path.split('/').slice(0,-1).join('/'),path=parent?parent+'/'+name:name;
   try{WorkspaceModel.normalizeFilePath(path);if(path===node.path){editingNodeId=null;renderTree();return;}
    if(node.type==='file'){if(node.file?.draft){const created=await Workspace.files.create(project.id,{path,content:''});draftFiles=draftFiles.filter(f=>f.id!==id);await refreshData();await selectFileNow(created.id);}
     else{const saved=await Workspace.files.get(project.id,id);await Workspace.files.update(project.id,id,{path,content:saved.content});await refreshData();}}
    else if(node.folder?.draft){const created=await Workspace.folders.create(project.id,path);draftFolders=draftFolders.filter(f=>f.id!==id);await refreshData();inspectedNodeId=created.id;}
    else{await Workspace.folders.rename(project.id,node.path,path);await refreshData();inspectedNodeId=folders.find(f=>f.path===path)?.id||'folder:'+path;focusedNodeId=inspectedNodeId;}
    editingNodeId=null;updateAll();toast('Item criado ou renomeado','success');
   }catch(e){toast(e.message||'Não foi possível renomear o item.','error');renderTree();}
   finally{renameCommitInProgress=false;}
  }
  function prepareDelete(row){const node=nodeById(row.id);if(!node)return;showDelete(node);}
  function showDelete(node){pendingDelete=node;$('[data-delete-title]').textContent='Excluir '+(node.type==='folder'?'pasta':'arquivo');$('[data-delete-message]').textContent='Excluir '+node.name+'? '+(node.type==='folder'?'Todo o conteúdo da pasta também será removido. ':'')+'Esta ação não pode ser desfeita.';dialog('delete',true);}
  function cancelDelete(){pendingDelete=null;dialog('delete',false);}
  async function confirmDelete(){
   const n=pendingDelete;if(!n)return;try{
    if(n.type==='folder'){if(n.folder?.draft){draftFolders=draftFolders.filter(f=>f.id!==n.id);draftFiles=draftFiles.filter(f=>!f.path.startsWith(n.path+'/'));}else await Workspace.folders.remove(project.id,n.path);for(const f of files.filter(f=>f.path.startsWith(n.path+'/'))){dirty.delete(f.id);contents.delete(f.id);originals.delete(f.id);delete ai.fileAccess[f.id];}if(selectedFile?.path.startsWith(n.path+'/')){selectedFile=null;selectedFileId=null;}if(inspectedNodeId!==n.id&&nodeById(inspectedNodeId)?.path.startsWith(n.path+'/'))inspectedNodeId=null;if(focusedNodeId!==n.id&&nodeById(focusedNodeId)?.path.startsWith(n.path+'/'))focusedNodeId=null;}
    else{if(n.file?.draft)draftFiles=draftFiles.filter(f=>f.id!==n.id);else await Workspace.files.remove(project.id,n.id);dirty.delete(n.id);contents.delete(n.id);originals.delete(n.id);delete ai.fileAccess[n.id];if(selectedFileId===n.id){selectedFile=null;selectedFileId=null;}}
    if(n.type==='folder'){draftFiles=draftFiles.filter(f=>!f.path.startsWith(n.path+'/'));draftFolders=draftFolders.filter(f=>f.id!==n.id&&!f.path.startsWith(n.path+'/'));}if(inspectedNodeId===n.id)inspectedNodeId=null;cancelDelete();await refreshData();toast('Item excluído','success');
   }catch(e){toast(e.message||'Não foi possível excluir o item.','error');}
  }
  async function saveFile(id){
   const f=await Workspace.files.get(project.id,id);if(!f)throw new Error('Arquivo não encontrado.');
   if(f.readOnly){saveError={id,message:'Arquivo somente leitura.'};updateAll();toast('Falha ao salvar: arquivo somente leitura','error');return false;}
   const content=contents.get(id)??f.content??'';
   try{
    const updated=await Workspace.files.update(project.id,id,{path:f.path,content});
    contents.set(id,content);originals.set(id,content);dirty.delete(id);if(selectedFileId===id)selectedFile={...f,...updated,content};saveError=null;
   }catch(e){saveError={id,message:e.message||'Falha ao salvar o arquivo.'};updateAll();toast('Falha ao salvar o arquivo','error');return false;}
   try{await refreshData();}catch(_){updateAll();toast('Arquivo salvo, mas a árvore não pôde ser atualizada.','warning');}
   toast('Arquivo salvo','success');return true;
  }
  function discardFile(id){if(!originals.has(id))return;contents.set(id,originals.get(id));dirty.delete(id);saveError=null;forceEditorSync=true;updateAll();toast('Alterações descartadas','info');}
  async function saveAllFiles(){let ok=true;for(const id of [...dirty])if(!await saveFile(id))ok=false;return ok;}
  function discardAllFiles(){for(const id of [...dirty]){if(originals.has(id))contents.set(id,originals.get(id));dirty.delete(id);}saveError=null;forceEditorSync=true;updateAll();}
  function editorInput(){if(!selectedFile)return;contents.set(selectedFile.id,editor.value);if(editor.value===(originals.get(selectedFile.id)||''))dirty.delete(selectedFile.id);else dirty.add(selectedFile.id);if(saveError?.id===selectedFile.id)saveError=null;updateHeader();updateLayout();renderTree();renderInspector();updateStatus();}
  function toggleFileAccess(id){if(ai.accessMode!=='selected')return;ai.fileAccess[id]=ai.fileAccess[id]==='allowed'?'denied':'allowed';renderAI();renderInspector();}
  function toggleExplorer(){collapsed=!collapsed;updateLayout();}
  function toggleInspector(){inspectorOpen=!inspectorOpen;if(inspectorOpen)focusMode=false;updateLayout();}
  function toggleFocus(){focusMode=!focusMode;if(focusMode)inspectorOpen=false;updateLayout();}
  function switchView(view){if(view!==activeView)requestAction({type:'view',view});}
  function back(){requestAction({type:'back'});}
  function cancelPending(){dialog('pending',false);const r=pendingResolver;pendingResolver=null;pendingAction=null;if(r)r(false);}
  function discardAndContinue(){if(dirty.size)discardAllFiles();if(aiDirty())resetAi();if(settingsDirty())resetSettings();dialog('pending',false);const a=pendingAction,r=pendingResolver;pendingAction=null;pendingResolver=null;if(a)executeAction(a);if(r)r(true);toast('Alterações descartadas','info');}
  async function saveAndContinue(){const a=await saveAllFiles(),b=aiDirty()?await saveAi(true):true,c=settingsDirty()?await saveSettings(true):true;if(a&&b&&c){dialog('pending',false);const action=pendingAction,resolver=pendingResolver;pendingAction=null;pendingResolver=null;if(action)executeAction(action);if(resolver)resolver(true);toast('Alterações salvas','success');}else toast('Não foi possível salvar todas as alterações','error');}
  function canLeave(){if(!hasPending())return Promise.resolve(true);return new Promise(resolve=>{pendingAction=null;pendingResolver=resolve;dialog('pending',true);});}

  async function ensureCatalog(){
   if(providerGroups.length)return Promise.resolve(providerGroups);
   if(catalogPromise)return catalogPromise;catalogPromise=(async()=>{try{await ProviderRegistry.hydrate();}catch(error){if(!ProviderRegistry.getCached().length)throw error;}providerGroups=ProviderRegistry.groupByProvider();let autoSelected=false;if(!ai.modelId&&providerGroups[0]?.entries[0]){ai.providerId=providerGroups[0].providerId;ai.modelId=providerGroups[0].entries[0].id;autoSelected=true;}if(autoSelected)aiSaved=json(aiSnapshot());renderAI();})().finally(()=>catalogPromise=null);return catalogPromise;
  }
  const model=()=>ProviderRegistry.get(ai.modelId);
  const group=()=>providerGroups.find(g=>g.providerId===ai.providerId)||null;
  const needsKey=e=>!!e&&e.auth?.type!=='none'&&e.auth?.key!=='anonymous';
  function configured(g){const p=ProviderManager.getPinned?.(),a=ProviderManager.getActive?.();if(!g)return false;if(g.providerId===ai.providerId){const entry=model();return !!entry&&(!needsKey(entry)||(p?.id===entry.id&&!!a?.apiKey));}return g.entries.some(e=>!needsKey(e)||(p?.id===e.id&&!!a?.apiKey));}
  function renderProviders(){const list=$('[data-provider-list]');list.replaceChildren();if(!providerGroups.length){list.append(el('div','pe-tree-empty','Nenhum provedor disponível no catálogo.'));return;}for(const g of providerGroups){const b=el('button','pe-provider'+(g.providerId===ai.providerId?' is-active':''));b.type='button';b.append(el('span','pe-provider__name',g.providerLabel),el('span','pe-provider__meta',g.entries.slice(0,3).map(x=>x.label).join(' · ')),el('span','pe-badge '+(configured(g)?'pe-badge--ok':'pe-badge--warn'),configured(g)?'Configurado':'Pendente'));b.addEventListener('click',()=>selectProvider(g.providerId));list.append(b);}}
  function selectProvider(id){const g=providerGroups.find(x=>x.providerId===id);if(!g)return;const prev=ai.providerId;ai.providerId=id;const pinned=ProviderManager.getPinned?.();const next=g.entries.find(e=>e.id===pinned?.id)||g.entries[0];ai.modelId=next?.id||'';if(prev!==id)ai.apiKey='';aiErrors={};showKey=false;renderAI();}
  function selectModel(id){const e=ProviderRegistry.get(id);if(!e)return;if(e.providerId!==ai.providerId)ai.apiKey='';ai.providerId=e.providerId;ai.modelId=e.id;aiErrors={};renderAI();}
  function renderAI(){
   renderProviders();const m=model(),g=group();
   const select=$('[data-model]');select.replaceChildren();for(const e of g?.entries||[]){const o=el('option','',e.label);o.value=e.id;select.append(o);}select.value=ai.modelId;
   apiKeyInput.type=showKey?'text':'password';if(apiKeyInput.value!==ai.apiKey&&document.activeElement!==apiKeyInput)apiKeyInput.value=ai.apiKey;$('[data-action="toggle-key"]').innerHTML=showKey?"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a20.7 20.7 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a20.7 20.7 0 0 1-3.06 4.06\"/><line x1=\"2\" y1=\"2\" x2=\"22\" y2=\"22\"/></svg>":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>";$('[data-action="toggle-key"]').setAttribute('aria-label',showKey?'Ocultar chave':'Mostrar chave');apiKeyInput.disabled=!needsKey(m);apiKeyInput.placeholder=needsKey(m)?'sk-...':'Este modelo não exige chave';
   $('[data-key-hint]').textContent=needsKey(m)?'Credenciais armazenadas nas configurações globais do provedor. A chave permanece mascarada.':'Este modelo não exige chave de API.';
   $('[data-key-error]').hidden=!aiErrors.key;$('[data-key-error]').textContent=aiErrors.key||'';$('[data-model-error]').hidden=!aiErrors.model;$('[data-model-error]').textContent=aiErrors.model||'';
   const modes=[['none','Nenhum'],['selected','Somente selecionados'],['all','Todos']];
   const modeBox=$('[data-access-modes]');modeBox.replaceChildren();for(const [id,label] of modes){const b=el('button',ai.accessMode===id?'is-active':'',label);b.type='button';b.addEventListener('click',()=>{ai.accessMode=id;renderAI();});modeBox.append(b);}
   const hint=ai.accessMode==='none'?'Nenhum arquivo fica disponível para a IA.':ai.accessMode==='all'?'Todos os arquivos ficam disponíveis, independentemente da permissão individual.':'Somente arquivos permitidos individualmente ficam disponíveis.';
   $('[data-access-hint]').textContent=hint;
   const perms=$('[data-file-perms]');perms.replaceChildren();let allowed=0;
   for(const f of files){const access=effective(f.id);if(access==='allowed')allowed++;const row=el('div','pe-file-perm'+(ai.accessMode!=='selected'?' is-disabled':''));row.append(el('span','pe-file-perm__path',f.path),el('span','pe-badge '+(access==='allowed'?'pe-badge--on':'pe-badge--off'),access==='allowed'?'Permitido':'Sem acesso'));const b=el('button','pe-btn',ai.fileAccess[f.id]==='allowed'?'Negar':'Permitir');b.disabled=ai.accessMode!=='selected';b.addEventListener('click',()=>toggleFileAccess(f.id));row.append(b);perms.append(row);}
   if(!files.length)perms.append(el('div','pe-tree-empty','Nenhum arquivo para configurar.'));
   $('[data-effective-summary]').textContent=allowed+' de '+files.length+' arquivo(s) com acesso efetivo.';
   updateFooter();
   const keyValid=!needsKey(m)||!!ai.apiKey.trim(),isConfigured=!needsKey(m)||(ProviderManager.getPinned?.()?.id===m?.id&&!!ProviderManager.getActive?.()?.apiKey);
   $('[data-validation-key]').className=keyValid&&isConfigured?'is-ok':keyValid||isConfigured?'is-warn':'is-error';$('[data-validation-key]').textContent=!needsKey(m)?'Este modelo não exige chave':isConfigured?'Credencial configurada':'Credencial pendente';
   $('[data-validation-model]').className=m?'is-ok':'is-error';$('[data-validation-model]').textContent=m?'Modelo selecionado: '+m.label:'Nenhum modelo selecionado';
   $('[data-validation-access]').className='is-ok';$('[data-validation-access]').textContent=accessLabel();
   updateHeader();
  }
  async function saveAi(silent=false){
   const entry=model(),errors={};if(!entry)errors.model='Selecione um modelo.';if(needsKey(entry)&&!ai.apiKey.trim())errors.key='Informe a chave de API.';
   aiErrors=errors;renderAI();if(Object.keys(errors).length){if(!silent)toast('Verifique os campos destacados','error');return false;}
   const previousActive=ProviderManager.getActive?.(),previousPinned=ProviderManager.getPinned?.(),oldProject=project,oldFileAccess=files.map(f=>({id:f.id,access:f.aiAccess||'denied'}));let projectWasSaved=false,permissionsSaved=false;
   try{
    if(!ProviderManager.pin(entry))throw new Error('Não foi possível selecionar o provedor.');
    const active=ProviderManager.getActive?.();if(needsKey(entry)&&!ProviderManager.update(active?.id,{apiKey:ai.apiKey.trim()}))throw new Error('Não foi possível salvar a credencial.');
    const updated=await Workspace.projects.update(project.id,{settings:{...project.settings,aiAccessMode:ai.accessMode,aiProviderModelId:entry.id}});projectWasSaved=true;
    await Workspace.files.setAccessMany(project.id,files.map(f=>({id:f.id,access:ai.fileAccess[f.id]==='allowed'?'allowed':'denied'})));permissionsSaved=true;
    project=updated;await refreshData();ai.fileAccess=Object.fromEntries(files.map(f=>[f.id,f.aiAccess||'denied']));aiSaved=json(aiSnapshot());aiErrors={};renderAI();if(!silent)toast('Configurações de acesso salvas','success');updateFooter();return true;
   }catch(e){try{if(permissionsSaved)await Workspace.files.setAccessMany(projectId,oldFileAccess);}catch(_){}try{if(projectWasSaved)await Workspace.projects.update(projectId,{settings:oldProject.settings});}catch(_){}try{if(previousPinned)ProviderManager.pin(previousPinned);else{ProviderManager.unpin?.();if(previousActive?.id)ProviderManager.setActive(previousActive.id);}}catch(_){}try{project=await Workspace.projects.get(projectId);}catch(_){}renderAI();updateFooter();toast(e.message||'Não foi possível salvar o acesso à IA.','error');return false;}
  }
  function resetAi(){const p=ProviderManager.getPinned?.(),a=ProviderManager.getActive?.(),id=project?.settings?.aiProviderModelId||p?.id||'',m=id?ProviderRegistry.get(id):p;ai.providerId=m?.providerId||'';ai.modelId=m?.id||'';ai.apiKey=p?.id===m?.id?a?.apiKey||'':'';ai.accessMode=project?.settings?.aiAccessMode||'selected';ai.fileAccess=Object.fromEntries(files.map(f=>[f.id,f.aiAccess||'denied']));aiErrors={};showKey=false;aiSaved=json(aiSnapshot());renderAI();updateFooter();}
  function settingsErrors(){const errors={};if(!settings.name.trim())errors.name='Informe o nome do projeto.';else if(settings.name.trim().length>100)errors.name='O nome deve ter no máximo 100 caracteres.';if(settings.description.length>500)errors.description='A descrição deve ter no máximo 500 caracteres.';if(settings.instructions.length>20000)errors.instructions='Limite de 20.000 caracteres.';let config;try{config=JSON.parse(settings.configText);WorkspaceModel.normalizeConfig(config);}catch(e){errors.config='JSON inválido: '+e.message;}return{errors,config};}
  function renderSettings(){
   for(const [selector,value] of [['[data-setting="name"]',settings.name],['[data-setting="description"]',settings.description],['[data-setting="defaultView"]',settings.defaultView],['[data-setting="instructions"]',settings.instructions],['[data-setting="configText"]',settings.configText]]){const input=$(selector);if(document.activeElement!==input&&input.value!==value)input.value=value;}$('[data-instruction-count]').textContent=settings.instructions.length+'/20000';
   const validation=settingsErrors();for(const k of ['name','description','instructions','config']){const n=$('[data-setting-error="'+k+'"]');n.hidden=!validation.errors[k];n.textContent=validation.errors[k]||'';}
      const meta=$('[data-project-meta]');meta.replaceChildren();for(const [k,v] of [['ID',project?.id||'—'],['Criado em',date(project?.createdAt)],['Atualizado em',date(project?.updatedAt)]]){const r=el('div');r.append(el('dt','',k),el('dd','',v));meta.append(r);}
   const prefs=$('[data-project-preferences]');prefs.replaceChildren();for(const [k,v] of [['Arquivos',files.length],['Tamanho',fmt(totalSize())],['Acesso à IA',accessLabel()]]){const r=el('div');r.append(el('dt','',k),el('dd','',String(v)));prefs.append(r);}
   updateFooter();
  }
  async function saveSettings(silent=false){const v=settingsErrors();if(Object.keys(v.errors).length){renderSettings();if(!silent)toast('Corrija os campos destacados','error');return false;}try{project=await Workspace.projects.update(project.id,{name:settings.name.trim(),description:settings.description,settings:{...project.settings,defaultView:settings.defaultView,instructions:settings.instructions,config:WorkspaceModel.normalizeConfig(v.config)}});settings.name=project.name;settings.description=project.description||'';settings.instructions=project.settings?.instructions||'';settingsSaved=json(settings);updateHeader();renderSettings();updateFooter();if(!silent)toast('Configurações salvas','success');return true;}catch(e){updateFooter();toast(e.message||'Falha ao salvar configurações.','error');return false;}}
  function resetSettings(){settings={name:project.name,description:project.description||'',defaultView:project.settings?.defaultView||'files',instructions:project.settings?.instructions||'',configText:JSON.stringify(project.settings?.config||{includePatterns:[],maxContextBytes:49152},null,2)};settingsSaved=json(settings);renderSettings();updateFooter();}

  async function importFiles(kind){const input=kind==='dir'?dirInput:fileInput,list=[...(input.files||[])];input.value='';if(!list.length)return;try{const created=await WorkspaceController.importFiles(project.id,list,createParent());await refreshData();toast(created.length+' arquivo(s) importado(s)','success');}catch(e){toast(e.message||'Falha ao importar.','error');}}
  function openBatch(){dialog('batch',true);$('[data-batch-paths]').value='';$('[data-batch-preview]').textContent='Nenhum caminho informado.';}
  async function commitBatch(){const paths=$('[data-batch-paths]').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!paths.length){toast('Informe ao menos um caminho','error');return;}try{const created=await WorkspaceController.createFiles(project.id,paths,createParent());dialog('batch',false);await refreshData();toast(created.length+' arquivo(s) criado(s)','success');}catch(e){toast(e.message||'Falha ao criar arquivos.','error');}}
  function updateThemeIcon(){$('[data-action="theme"]').innerHTML=Theme.resolved()==='dark'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';}
  function globalKey(event){
   if(!host.isConnected)return;const target=event.target,typing=target instanceof HTMLElement&&target.matches('input,textarea,select,[contenteditable="true"]'),inTree=target instanceof Element&&target.closest('.pe-tree-container'),mod=event.ctrlKey||event.metaKey;
   if(mod&&event.key.toLowerCase()==='s'){event.preventDefault();if(selectedFileId&&dirtyFile(selectedFileId))saveFile(selectedFileId);return;}
   if(typing||inTree)return;if(mod&&event.key.toLowerCase()==='n'&&event.shiftKey){event.preventDefault();startCreateFolder();}else if(mod&&event.key.toLowerCase()==='n'){event.preventDefault();startCreateFile();}else if(event.key==='F2'&&inspected())startRename(inspected());else if(event.key==='Delete'&&inspected())prepareDelete({id:inspectedNodeId});
  }
  on('[data-action="back"]','click',()=>requestAction({type:'back'}));on('[data-action="theme"]','click',()=>{Theme.cycle();updateThemeIcon();});
  on('[data-action="explorer"]','click',()=>{collapsed=!collapsed;updateLayout();});on('[data-action="inspector"]','click',()=>{inspectorOpen=!inspectorOpen;if(inspectorOpen)focusMode=false;updateLayout();});
  on('[data-action="close-inspector"]','click',()=>{inspectorOpen=false;updateLayout();});on('[data-action="focus"]','click',()=>{focusMode=!focusMode;if(focusMode)inspectorOpen=false;updateLayout();});
  on('[data-action="new-file"]','click',startCreateFile);on('[data-action="new-folder"]','click',startCreateFolder);on('[data-action="import-files"]','click',()=>fileInput.click());on('[data-action="import-dir"]','click',()=>dirInput.click());on('[data-action="batch"]','click',openBatch);
  on('[data-action="save-file"]','click',()=>selectedFileId&&saveFile(selectedFileId));on('[data-action="discard-file"]','click',()=>selectedFileId&&discardFile(selectedFileId));
  on('[data-action="toggle-key"]','click',()=>{showKey=!showKey;renderAI();});on('[data-action="reset-ai"]','click',resetAi);on('[data-action="save-ai"]','click',()=>saveAi());
  on('[data-action="reset-settings"]','click',resetSettings);on('[data-action="save-settings"]','click',()=>saveSettings());
  on('[data-action="cancel-pending"]','click',cancelPending);
  on('[data-action="discard-continue"]','click',discardAndContinue);
  on('[data-action="save-continue"]','click',saveAndContinue);
  on('[data-action="cancel-delete"]','click',()=>{pendingDelete=null;dialog('delete',false);});on('[data-action="confirm-delete"]','click',confirmDelete);
  on('[data-action="close-batch"]','click',()=>dialog('batch',false));on('[data-action="commit-batch"]','click',commitBatch);
  for(const v of ['files','ai','settings'])on('[data-view="'+v+'"]','click',()=>switchView(v));
  on('[data-search]','input',e=>{searchQuery=e.target.value;renderTree();});
  on('[data-editor]','input',()=>{if(!selectedFile)return;contents.set(selectedFile.id,editor.value);if(editor.value===(originals.get(selectedFile.id)||''))dirty.delete(selectedFile.id);else dirty.add(selectedFile.id);saveError=null;updateHeader();updateLayout();renderTree();renderInspector();updateStatus();});
  on('[data-api-key]','input',e=>{ai.apiKey=e.target.value;updateHeader();renderAI();});
  on('[data-model]','change',e=>{const m=ProviderRegistry.get(e.target.value);if(m){if(m.providerId!==ai.providerId)ai.apiKey='';ai.providerId=m.providerId;ai.modelId=m.id;renderAI();}});
  on('[data-setting="name"]','input',e=>{settings.name=e.target.value;renderSettings();});on('[data-setting="description"]','input',e=>{settings.description=e.target.value;renderSettings();});
  on('[data-setting="defaultView"]','change',e=>{settings.defaultView=e.target.value;renderSettings();});on('[data-setting="instructions"]','input',e=>{settings.instructions=e.target.value;renderSettings();});on('[data-setting="configText"]','input',e=>{settings.configText=e.target.value;renderSettings();});
  on('[data-batch-paths]','input',e=>{const n=e.target.value.split(/\r?\n/).filter(x=>x.trim()).length;$('[data-batch-preview]').textContent=n?n+' arquivo(s) serão criados.':'Nenhum caminho informado.';});
  fileInput.addEventListener('change',()=>importFiles('file'));dirInput.addEventListener('change',()=>importFiles('dir'));
  tree.addEventListener('dragover',e=>{e.preventDefault();$('[data-explorer]').classList.add('is-drop-target');});
  tree.addEventListener('dragleave',e=>{if(!tree.contains(e.relatedTarget))$('[data-explorer]').classList.remove('is-drop-target');});
  tree.addEventListener('drop',e=>{e.preventDefault();$('[data-explorer]').classList.remove('is-drop-target');if(e.dataTransfer?.files?.length)WorkspaceController.importFiles(project.id,e.dataTransfer.files,createParent()).then(async r=>{await refreshData();toast(r.length+' arquivo(s) importado(s)','success');}).catch(err=>toast(err.message,'error'));});
  window.addEventListener('keydown',globalKey);
  const init=async()=>{if(!Workspace.isInitialized())await Workspace.init();if(destroyed)return;await loadProject();if(destroyed)return;updateThemeIcon();if(window.innerWidth<=900){collapsed=true;inspectorOpen=false;updateLayout();}if(typeof ResizeObserver==='function'){resizeObserver=new ResizeObserver(()=>{if(!destroyed)renderTree();});resizeObserver.observe(tree);}};
  init().catch(e=>{status(e.message||'Falha ao carregar o projeto','error');toast(e.message||'Falha ao carregar o projeto','error');});
  return {root:host,getProjectId:()=>project?.id||projectId,canLeave,refresh:init,destroy(){destroyed=true;window.removeEventListener('keydown',globalKey);resizeObserver?.disconnect();WorkspaceExplorerView.destroy(tree);toastHost?.remove();host.remove();}};
 }
 return Object.freeze({render});
})();
