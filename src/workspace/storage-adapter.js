// ===== src/workspace/storage-adapter.js =====
const WorkspaceStorage = (() => {
    const DB_NAME = 'prompt-enhancer-workspace';
    const DB_VERSION = 2;
    let databasePromise = null;

    function open() {
        if (databasePromise) return databasePromise;
        if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB não está disponível neste ambiente.'));
        databasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('files')) {
                    const files = db.createObjectStore('files', { keyPath: 'id' });
                    files.createIndex('byProject', 'projectId', { unique: false });
                    files.createIndex('byProjectPath', ['projectId', 'path'], { unique: true });
                }
                if (!db.objectStoreNames.contains('folders')) {
                    const folders = db.createObjectStore('folders', { keyPath: 'id' });
                    folders.createIndex('byProject', 'projectId', { unique: false });
                    folders.createIndex('byProjectPath', ['projectId', 'path'], { unique: true });
                }
            };
            request.onsuccess = () => {
                const db = request.result;
                db.onversionchange = () => { db.close(); databasePromise = null; };
                resolve(db);
            };
            request.onerror = () => { databasePromise = null; reject(request.error || new Error('Não foi possível abrir o banco Workspace.')); };
            request.onblocked = () => console.warn('[PE Workspace] A atualização do banco está bloqueada por outra aba.');
        });
        return databasePromise;
    }

    function transaction(storeNames, mode, operation) {
        return open().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(storeNames, mode);
            let result;
            try { result = operation(tx); }
            catch (error) { try { tx.abort(); } catch (_) {} reject(error); return; }
            tx.oncomplete = () => resolve(result);
            tx.onerror = () => reject(tx.error || new Error('Transação IndexedDB falhou.'));
            tx.onabort = () => reject(tx.error || new Error('Transação IndexedDB foi cancelada.'));
        }));
    }

    function requestResult(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Operação IndexedDB falhou.'));
        });
    }

    async function read(storeName, key) {
        const db = await open();
        return requestResult(db.transaction(storeName, 'readonly').objectStore(storeName).get(key));
    }

    async function readAll(storeName, indexName, key) {
        const db = await open();
        const store = db.transaction(storeName, 'readonly').objectStore(storeName);
        return requestResult(indexName ? store.index(indexName).getAll(key) : store.getAll());
    }

    const write = (storeName, value) => transaction([storeName], 'readwrite', tx => tx.objectStore(storeName).put(value));
    const add = (storeName, value) => transaction([storeName], 'readwrite', tx => tx.objectStore(storeName).add(value));
    const remove = (storeName, key) => transaction([storeName], 'readwrite', tx => tx.objectStore(storeName).delete(key));

    function updateProject(projectId, changes) {
        return open().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction('projects', 'readwrite');
            const store = tx.objectStore('projects');
            const request = store.get(projectId);
            let updated = null;
            let failure = null;
            request.onsuccess = () => {
                if (!request.result) {
                    failure = new Error('Projeto não encontrado.');
                    failure.code = 'project-not-found';
                    try { tx.abort(); } catch (_) { reject(failure); }
                    return;
                }
                try {
                    updated = changes(request.result);
                    store.put(updated);
                } catch (error) {
                    failure = error;
                    try { tx.abort(); } catch (_) { reject(error); }
                }
            };
            request.onerror = () => {
                failure = request.error || new Error('Não foi possível consultar o projeto.');
                try { tx.abort(); } catch (_) { reject(failure); }
            };
            tx.oncomplete = () => resolve(updated);
            tx.onerror = () => reject(failure || tx.error || new Error('Não foi possível atualizar o projeto.'));
            tx.onabort = () => reject(failure || tx.error || new Error('A atualização do projeto foi cancelada.'));
        }));
    }

    function saveFile(file, { maxFiles, maxBytes, mode = 'create' } = {}) {
        return open().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(['projects', 'files', 'folders'], 'readwrite');
            const projects = tx.objectStore('projects');
            const files = tx.objectStore('files');
            const folders = tx.objectStore('folders');
            const projectRequest = projects.get(file.projectId);
            const filesRequest = files.index('byProject').getAll(IDBKeyRange.only(file.projectId));
            const foldersRequest = folders.index('byProject').getAll(IDBKeyRange.only(file.projectId));
            let project, projectFiles = [], projectFolders = [];
            let projectReady = false, filesReady = false, foldersReady = false;
            let failure = null, savedFile = null;
            const abort = error => {
                if (failure) return;
                failure = error;
                try { tx.abort(); } catch (_) { reject(error); }
            };
            const commit = () => {
                if (!projectReady || !filesReady || !foldersReady || failure) return;
                if (!project) return abort(new Error('Projeto não encontrado.'));
                const existing = projectFiles || [];
                const current = existing.find(item => item.id === file.id) || null;
                if (mode === 'create' && current) {
                    const error = new Error('O identificador do arquivo já está em uso.');
                    error.code = 'file-exists';
                    return abort(error);
                }
                if (mode === 'update' && !current) {
                    const error = new Error('O arquivo não existe mais neste projeto.');
                    error.code = 'file-not-found';
                    return abort(error);
                }
                if (mode === 'create' && existing.length >= maxFiles) {
                    const error = new Error(\`O projeto atingiu o limite de \${maxFiles} arquivos.\`);
                    error.code = 'project-file-limit';
                    return abort(error);
                }
                const pathConflict = existing.some(item => item.id !== file.id && (
                    item.path === file.path || item.path.startsWith(file.path + '/') || file.path.startsWith(item.path + '/')
                )) || projectFolders.some(folder =>
                    folder.path === file.path || folder.path.startsWith(file.path + '/')
                );
                if (pathConflict) {
                    const error = new Error('O caminho do arquivo conflita com outro arquivo ou pasta do projeto.');
                    error.code = 'path-conflict';
                    return abort(error);
                }
                const totalBytes = existing.reduce((sum, item) => sum + (Number(item.size) || 0), 0)
                    - (current ? Number(current.size) || 0 : 0) + file.size;
                if (totalBytes > maxBytes) {
                    const error = new Error('O projeto excede o limite total de armazenamento.');
                    error.code = 'project-size-limit';
                    return abort(error);
                }
                savedFile = file;
                files.put(file);
                projects.put({ ...project, updatedAt: Date.now() });
            };
            projectRequest.onsuccess = () => { project = projectRequest.result; projectReady = true; commit(); };
            filesRequest.onsuccess = () => { projectFiles = filesRequest.result || []; filesReady = true; commit(); };
            foldersRequest.onsuccess = () => { projectFolders = foldersRequest.result || []; foldersReady = true; commit(); };
            projectRequest.onerror = () => abort(projectRequest.error || new Error('Não foi possível validar o projeto.'));
            filesRequest.onerror = () => abort(filesRequest.error || new Error('Não foi possível consultar os arquivos do projeto.'));
            foldersRequest.onerror = () => abort(foldersRequest.error || new Error('Não foi possível consultar as pastas do projeto.'));
            tx.oncomplete = () => resolve(savedFile);
            tx.onerror = () => reject(failure || tx.error || new Error('Não foi possível salvar o arquivo.'));
            tx.onabort = () => reject(failure || tx.error || new Error('A gravação do arquivo foi cancelada.'));
        }));
    }

    function saveFiles(batch, { maxFiles, maxBytes } = {}) {
        if (!Array.isArray(batch) || batch.length === 0) {
            return Promise.reject(new TypeError('O lote de arquivos está vazio ou é inválido.'));
        }
        return open().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(['projects', 'files', 'folders'], 'readwrite');
            const projects = tx.objectStore('projects');
            const files = tx.objectStore('files');
            const folders = tx.objectStore('folders');
            const projectId = batch[0]?.projectId;
            const projectRequest = projects.get(projectId);
            const filesRequest = files.index('byProject').getAll(IDBKeyRange.only(projectId));
            const foldersRequest = folders.index('byProject').getAll(IDBKeyRange.only(projectId));
            let project, projectFiles = [], projectFolders = [];
            let projectReady = false, filesReady = false, foldersReady = false;
            let failure = null, savedFiles = [];
            const abort = error => {
                if (failure) return;
                failure = error;
                try { tx.abort(); } catch (_) { reject(error); }
            };
            const commit = () => {
                if (!projectReady || !filesReady || !foldersReady || failure) return;
                if (!project) {
                    const error = new Error('Projeto não encontrado.');
                    error.code = 'project-not-found';
                    return abort(error);
                }
                const existing = projectFiles || [];
                const ids = new Set(existing.map(file => file.id));
                const incomingIds = new Set();
                const incomingPaths = [];
                let incomingBytes = 0;
                for (const file of batch) {
                    if (!file || file.projectId !== projectId || typeof file.id !== 'string' || typeof file.path !== 'string') {
                        const error = new Error('O lote contém um arquivo inválido.');
                        error.code = 'invalid-input';
                        return abort(error);
                    }
                    if (ids.has(file.id) || incomingIds.has(file.id)) {
                        const error = new Error('O identificador de um arquivo já está em uso.');
                        error.code = 'file-exists';
                        return abort(error);
                    }
                    const conflictsWithExistingFile = existing.some(item =>
                        item.path === file.path || item.path.startsWith(file.path + '/') || file.path.startsWith(item.path + '/')
                    );
                    const conflictsWithFolder = projectFolders.some(folder =>
                        folder.path === file.path || folder.path.startsWith(file.path + '/')
                    );
                    const conflictsWithBatch = incomingPaths.some(path =>
                        path === file.path || path.startsWith(file.path + '/') || file.path.startsWith(path + '/')
                    );
                    if (conflictsWithExistingFile || conflictsWithFolder || conflictsWithBatch) {
                        const error = new Error('O lote contém caminhos duplicados ou incompatíveis com arquivos e pastas existentes.');
                        error.code = 'path-conflict';
                        return abort(error);
                    }
                    const size = Number(file.size);
                    if (!Number.isFinite(size) || size < 0) {
                        const error = new Error('O tamanho de um arquivo do lote é inválido.');
                        error.code = 'invalid-input';
                        return abort(error);
                    }
                    incomingIds.add(file.id);
                    incomingPaths.push(file.path);
                    incomingBytes += size;
                }
                if (existing.length + batch.length > maxFiles) {
                    const error = new Error(\`O projeto excede o limite de \${maxFiles} arquivos.\`);
                    error.code = 'project-file-limit';
                    return abort(error);
                }
                const existingBytes = existing.reduce((sum, file) => sum + (Number(file.size) || 0), 0);
                if (existingBytes + incomingBytes > maxBytes) {
                    const error = new Error('O projeto excede o limite total de armazenamento.');
                    error.code = 'project-size-limit';
                    return abort(error);
                }
                try {
                    for (const file of batch) files.add(file);
                    projects.put({ ...project, updatedAt: Date.now() });
                    savedFiles = batch;
                } catch (error) { abort(error); }
            };
            projectRequest.onsuccess = () => { project = projectRequest.result; projectReady = true; commit(); };
            filesRequest.onsuccess = () => { projectFiles = filesRequest.result || []; filesReady = true; commit(); };
            foldersRequest.onsuccess = () => { projectFolders = foldersRequest.result || []; foldersReady = true; commit(); };
            projectRequest.onerror = () => abort(projectRequest.error || new Error('Não foi possível validar o projeto.'));
            filesRequest.onerror = () => abort(filesRequest.error || new Error('Não foi possível consultar os arquivos do projeto.'));
            foldersRequest.onerror = () => abort(foldersRequest.error || new Error('Não foi possível consultar as pastas do projeto.'));
            tx.oncomplete = () => resolve(savedFiles);
            tx.onerror = () => reject(failure || tx.error || new Error('Não foi possível salvar o lote de arquivos.'));
            tx.onabort = () => reject(failure || tx.error || new Error('A gravação do lote foi cancelada.'));
        }));
    }

    function deleteProject(projectId) {
        return transaction(['projects', 'files', 'folders'], 'readwrite', tx => {
            tx.objectStore('projects').delete(projectId);
            const cursorRequest = tx.objectStore('files').index('byProject').openCursor(IDBKeyRange.only(projectId));
            cursorRequest.onsuccess = () => {
                const cursor = cursorRequest.result;
                if (cursor) { cursor.delete(); cursor.continue(); }
            };
            const folderCursor = tx.objectStore('folders').index('byProject').openCursor(IDBKeyRange.only(projectId));
            folderCursor.onsuccess = () => {
                const cursor = folderCursor.result;
                if (cursor) { cursor.delete(); cursor.continue(); }
            };
        });
    }

    function deleteProjectFile(projectId, fileId) {
        return open().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(['projects', 'files'], 'readwrite');
            const projects = tx.objectStore('projects');
            const files = tx.objectStore('files');
            const projectRequest = projects.get(projectId);
            const fileRequest = files.get(fileId);
            let projectReady = false;
            let fileReady = false;
            let project;
            let file;
            let removed = false;
            let failure = null;
            const abort = error => {
                if (failure) return;
                failure = error;
                try { tx.abort(); } catch (_) { reject(error); }
            };
            const commit = () => {
                if (!projectReady || !fileReady || failure) return;
                if (!file || file.projectId !== projectId) return;
                files.delete(fileId);
                if (project) projects.put({ ...project, updatedAt: Date.now() });
                removed = true;
            };
            projectRequest.onsuccess = () => { project = projectRequest.result; projectReady = true; commit(); };
            fileRequest.onsuccess = () => { file = fileRequest.result; fileReady = true; commit(); };
            projectRequest.onerror = () => abort(projectRequest.error || new Error('Não foi possível consultar o projeto.'));
            fileRequest.onerror = () => abort(fileRequest.error || new Error('Não foi possível consultar o arquivo.'));
            tx.oncomplete = () => resolve(removed);
            tx.onerror = () => reject(failure || tx.error || new Error('Não foi possível excluir o arquivo.'));
            tx.onabort = () => reject(failure || tx.error || new Error('A exclusão do arquivo foi cancelada.'));
        }));
    }


    function createProjectFolder(folder) {
        return open().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(['projects', 'files', 'folders'], 'readwrite');
            const projects = tx.objectStore('projects');
            const files = tx.objectStore('files');
            const folders = tx.objectStore('folders');
            const projectRequest = projects.get(folder.projectId);
            const fileRequest = files.index('byProject').getAll(IDBKeyRange.only(folder.projectId));
            const folderRequest = folders.index('byProject').getAll(IDBKeyRange.only(folder.projectId));
            let projectReady = false, filesReady = false, foldersReady = false;
            let project = null, projectFiles = [], projectFolders = [];
            let saved = null, failure = null;
            const abort = error => {
                if (failure) return;
                failure = error;
                try { tx.abort(); } catch (_) { reject(error); }
            };
            const commit = () => {
                if (!projectReady || !filesReady || !foldersReady || failure) return;
                if (!project) {
                    const error = new Error('Projeto não encontrado.');
                    error.code = 'project-not-found';
                    return abort(error);
                }
                if (projectFolders.some(item => item.path === folder.path)) {
                    const error = new Error('A pasta já existe neste projeto.');
                    error.code = 'folder-exists';
                    return abort(error);
                }
                if (projectFiles.some(file => folder.path === file.path || folder.path.startsWith(file.path + '/'))) {
                    const error = new Error('O caminho da pasta conflita com um arquivo existente.');
                    error.code = 'path-conflict';
                    return abort(error);
                }
                try {
                    folders.add(folder);
                    projects.put({ ...project, updatedAt: Date.now() });
                    saved = folder;
                } catch (error) { abort(error); }
            };
            projectRequest.onsuccess = () => { project = projectRequest.result; projectReady = true; commit(); };
            fileRequest.onsuccess = () => { projectFiles = fileRequest.result || []; filesReady = true; commit(); };
            folderRequest.onsuccess = () => { projectFolders = folderRequest.result || []; foldersReady = true; commit(); };
            projectRequest.onerror = () => abort(projectRequest.error || new Error('Não foi possível consultar o projeto.'));
            fileRequest.onerror = () => abort(fileRequest.error || new Error('Não foi possível consultar os arquivos.'));
            folderRequest.onerror = () => abort(folderRequest.error || new Error('Não foi possível consultar as pastas.'));
            tx.oncomplete = () => resolve(saved);
            tx.onerror = () => reject(failure || tx.error || new Error('Não foi possível criar a pasta.'));
            tx.onabort = () => reject(failure || tx.error || new Error('A criação da pasta foi cancelada.'));
        }));
    }

    function renameProjectFolder(projectId, sourcePath, targetPath) {
        return open().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(['projects', 'files', 'folders'], 'readwrite');
            const projects = tx.objectStore('projects');
            const files = tx.objectStore('files');
            const folders = tx.objectStore('folders');
            const projectRequest = projects.get(projectId);
            const fileRequest = files.index('byProject').getAll(IDBKeyRange.only(projectId));
            const folderRequest = folders.index('byProject').getAll(IDBKeyRange.only(projectId));
            let projectReady = false, filesReady = false, foldersReady = false;
            let project = null, projectFiles = [], projectFolders = [];
            let renamedFiles = [], renamedFolders = [], failure = null;
            const abort = error => {
                if (failure) return;
                failure = error;
                try { tx.abort(); } catch (_) { reject(error); }
            };
            const commit = () => {
                if (!projectReady || !filesReady || !foldersReady || failure) return;
                if (!project) {
                    const error = new Error('Projeto não encontrado.');
                    error.code = 'project-not-found';
                    return abort(error);
                }
                if (targetPath === sourcePath) { renamedFiles = []; renamedFolders = []; return; }
                if (targetPath.startsWith(sourcePath + '/') || sourcePath.startsWith(targetPath + '/')) {
                    const error = new Error('A pasta de destino não pode estar dentro ou acima da pasta original.');
                    error.code = 'invalid-path';
                    return abort(error);
                }
                const affectedFiles = projectFiles.filter(file => file.path === sourcePath || file.path.startsWith(sourcePath + '/'));
                const affectedFolders = projectFolders.filter(folder => folder.path === sourcePath || folder.path.startsWith(sourcePath + '/'));
                if (!affectedFiles.length && !affectedFolders.length) {
                    const error = new Error('A pasta não existe neste projeto.');
                    error.code = 'folder-not-found';
                    return abort(error);
                }
                const fileIds = new Set(affectedFiles.map(file => file.id));
                const folderIds = new Set(affectedFolders.map(folder => folder.id));
                const nextFiles = affectedFiles.map(file => {
                    const path = targetPath + file.path.slice(sourcePath.length);
                    const name = path.split('/').pop();
                    const dot = name.lastIndexOf('.');
                    return { ...file, path, name, extension: dot > 0 ? name.slice(dot + 1).toLowerCase() : '', updatedAt: Date.now() };
                });
                const nextFolders = affectedFolders.map(folder => {
                    const path = targetPath + folder.path.slice(sourcePath.length);
                    return { ...folder, path, name: path.split('/').pop(), updatedAt: Date.now() };
                });
                if (!affectedFolders.some(folder => folder.path === sourcePath)) {
                    nextFolders.push({
                        id: WorkspaceModel.createId('folder'),
                        projectId,
                        path: targetPath,
                        name: targetPath.split('/').pop(),
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    });
                }
                const outsideFiles = projectFiles.filter(file => !fileIds.has(file.id));
                const outsideFolders = projectFolders.filter(folder => !folderIds.has(folder.id));
                if (outsideFiles.some(file => file.path === targetPath || file.path.startsWith(targetPath + '/'))
                    || outsideFolders.some(folder => folder.path === targetPath || folder.path.startsWith(targetPath + '/'))) {
                    const error = new Error('O destino já contém arquivos ou pastas e não pode receber esta renomeação.');
                    error.code = 'file-exists';
                    return abort(error);
                }
                const nextFilePaths = new Set();
                const nextFolderPaths = new Set();
                for (const file of nextFiles) {
                    if (nextFilePaths.has(file.path)
                        || outsideFiles.some(other => other.path === file.path || other.path.startsWith(file.path + '/'))
                        || outsideFolders.some(folder => folder.path === file.path)) {
                        const error = new Error('A pasta não pode ser renomeada porque o destino contém caminhos já utilizados.');
                        error.code = 'file-exists';
                        return abort(error);
                    }
                    nextFilePaths.add(file.path);
                }
                for (const folder of nextFolders) {
                    if (nextFolderPaths.has(folder.path)
                        || outsideFolders.some(other => other.path === folder.path || other.path.startsWith(folder.path + '/'))
                        || outsideFiles.some(file => file.path === folder.path || folder.path.startsWith(file.path + '/'))) {
                        const error = new Error('A pasta não pode ser renomeada porque o destino contém caminhos já utilizados.');
                        error.code = 'file-exists';
                        return abort(error);
                    }
                    nextFolderPaths.add(folder.path);
                }
                for (const file of nextFiles) {
                    if (nextFolders.some(folder => folder.path === file.path || folder.path.startsWith(file.path + '/'))) {
                        const error = new Error('O destino cria uma colisão entre arquivo e pasta.');
                        error.code = 'path-conflict';
                        return abort(error);
                    }
                }
                try {
                    nextFiles.forEach(file => files.put(file));
                    nextFolders.forEach(folder => folders.put(folder));
                    projects.put({ ...project, updatedAt: Date.now() });
                    renamedFiles = nextFiles;
                    renamedFolders = nextFolders;
                } catch (error) { abort(error); }
            };
            projectRequest.onsuccess = () => { project = projectRequest.result; projectReady = true; commit(); };
            fileRequest.onsuccess = () => { projectFiles = fileRequest.result || []; filesReady = true; commit(); };
            folderRequest.onsuccess = () => { projectFolders = folderRequest.result || []; foldersReady = true; commit(); };
            projectRequest.onerror = () => abort(projectRequest.error || new Error('Não foi possível consultar o projeto.'));
            fileRequest.onerror = () => abort(fileRequest.error || new Error('Não foi possível consultar os arquivos.'));
            folderRequest.onerror = () => abort(folderRequest.error || new Error('Não foi possível consultar as pastas.'));
            tx.oncomplete = () => resolve({ files: renamedFiles, folders: renamedFolders });
            tx.onerror = () => reject(failure || tx.error || new Error('Não foi possível renomear a pasta.'));
            tx.onabort = () => reject(failure || tx.error || new Error('A renomeação da pasta foi cancelada.'));
        }));
    }

    function deleteProjectFolder(projectId, folderPath) {
        return open().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(['projects', 'files', 'folders'], 'readwrite');
            const projects = tx.objectStore('projects');
            const files = tx.objectStore('files');
            const folders = tx.objectStore('folders');
            const projectRequest = projects.get(projectId);
            const fileRequest = files.index('byProject').getAll(IDBKeyRange.only(projectId));
            const folderRequest = folders.index('byProject').getAll(IDBKeyRange.only(projectId));
            let projectReady = false, filesReady = false, foldersReady = false;
            let project = null, projectFiles = [], projectFolders = [], removed = 0, failure = null;
            const abort = error => {
                if (failure) return;
                failure = error;
                try { tx.abort(); } catch (_) { reject(error); }
            };
            const commit = () => {
                if (!projectReady || !filesReady || !foldersReady || failure) return;
                if (!project) {
                    const error = new Error('Projeto não encontrado.');
                    error.code = 'project-not-found';
                    return abort(error);
                }
                const affectedFiles = projectFiles.filter(file => file.path === folderPath || file.path.startsWith(folderPath + '/'));
                const affectedFolders = projectFolders.filter(folder => folder.path === folderPath || folder.path.startsWith(folderPath + '/'));
                if (!affectedFiles.length && !affectedFolders.length) {
                    const error = new Error('A pasta não existe neste projeto.');
                    error.code = 'folder-not-found';
                    return abort(error);
                }
                affectedFiles.forEach(file => files.delete(file.id));
                affectedFolders.forEach(folder => folders.delete(folder.id));
                projects.put({ ...project, updatedAt: Date.now() });
                removed = affectedFiles.length + affectedFolders.length;
            };
            projectRequest.onsuccess = () => { project = projectRequest.result; projectReady = true; commit(); };
            fileRequest.onsuccess = () => { projectFiles = fileRequest.result || []; filesReady = true; commit(); };
            folderRequest.onsuccess = () => { projectFolders = folderRequest.result || []; foldersReady = true; commit(); };
            projectRequest.onerror = () => abort(projectRequest.error || new Error('Não foi possível consultar o projeto.'));
            fileRequest.onerror = () => abort(fileRequest.error || new Error('Não foi possível consultar os arquivos.'));
            folderRequest.onerror = () => abort(folderRequest.error || new Error('Não foi possível consultar as pastas.'));
            tx.oncomplete = () => resolve(removed);
            tx.onerror = () => reject(failure || tx.error || new Error('Não foi possível excluir a pasta.'));
            tx.onabort = () => reject(failure || tx.error || new Error('A exclusão da pasta foi cancelada.'));
        }));
    }

    function setFileAccessMany(projectId, changes) {
        if (!Array.isArray(changes)) return Promise.reject(new TypeError('A lista de permissões é inválida.'));
        if (!changes.length) return Promise.resolve([]);
        return open().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(['projects', 'files'], 'readwrite');
            const projects = tx.objectStore('projects');
            const files = tx.objectStore('files');
            const projectRequest = projects.get(projectId);
            const filesRequest = files.index('byProject').getAll(IDBKeyRange.only(projectId));
            let projectReady = false, filesReady = false, project = null, projectFiles = [];
            let updated = [], failure = null;
            const abort = error => {
                if (failure) return;
                failure = error;
                try { tx.abort(); } catch (_) { reject(error); }
            };
            const commit = () => {
                if (!projectReady || !filesReady || failure) return;
                if (!project) {
                    const error = new Error('Projeto não encontrado.');
                    error.code = 'project-not-found';
                    return abort(error);
                }
                const ids = new Set();
                for (const change of changes) {
                    if (!change || typeof change.id !== 'string' || !['allowed', 'denied'].includes(change.access) || ids.has(change.id)) {
                        const error = new Error('A lista contém uma permissão inválida ou duplicada.');
                        error.code = 'invalid-ai-access';
                        return abort(error);
                    }
                    ids.add(change.id);
                }
                const byId = new Map(projectFiles.map(file => [file.id, file]));
                const replacements = [];
                for (const change of changes) {
                    const current = byId.get(change.id);
                    if (!current) {
                        const error = new Error('Um arquivo da lista não existe neste projeto.');
                        error.code = 'file-not-found';
                        return abort(error);
                    }
                    replacements.push({ ...current, aiAccess: change.access, updatedAt: Date.now() });
                }
                try {
                    replacements.forEach(file => files.put(file));
                    projects.put({ ...project, updatedAt: Date.now() });
                    updated = replacements;
                } catch (error) { abort(error); }
            };
            projectRequest.onsuccess = () => { project = projectRequest.result; projectReady = true; commit(); };
            filesRequest.onsuccess = () => { projectFiles = filesRequest.result || []; filesReady = true; commit(); };
            projectRequest.onerror = () => abort(projectRequest.error || new Error('Não foi possível consultar o projeto.'));
            filesRequest.onerror = () => abort(filesRequest.error || new Error('Não foi possível consultar os arquivos.'));
            tx.oncomplete = () => resolve(updated);
            tx.onerror = () => reject(failure || tx.error || new Error('Não foi possível atualizar as permissões.'));
            tx.onabort = () => reject(failure || tx.error || new Error('A atualização das permissões foi cancelada.'));
        }));
    }

    return {
        open,
        close() {
            const pending = databasePromise;
            databasePromise = null;
            if (pending) pending.then(db => db.close()).catch(() => {});
        },
        getProject: id => read('projects', id),
        listProjects: () => readAll('projects'),
        putProject: value => write('projects', value),
        addProject: value => add('projects', value),
        updateProject,
        deleteProject,
        getFile: id => read('files', id),
        listFiles: projectId => readAll('files', 'byProject', projectId),
        getFolder: id => read('folders', id),
        listFolders: projectId => readAll('folders', 'byProject', projectId),
        createProjectFolder,
        renameProjectFolder,
        deleteProjectFolder,
        setFileAccessMany,
        putFile: value => write('files', value),
        deleteFile: id => remove('files', id),
        saveFile,
        saveFiles,
        deleteProjectFile
    };
})();
