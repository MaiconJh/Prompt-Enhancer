// ===== src/workspace/storage-adapter.js =====
const WorkspaceStorage = (() => {
    const DB_NAME = 'prompt-enhancer-workspace';
    const DB_VERSION = 1;
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
            const tx = db.transaction(['projects', 'files'], 'readwrite');
            const projects = tx.objectStore('projects');
            const files = tx.objectStore('files');
            const projectRequest = projects.get(file.projectId);
            const filesRequest = files.index('byProject').getAll(IDBKeyRange.only(file.projectId));
            let project;
            let projectReady = false;
            let projectFiles;
            let filesReady = false;
            let failure = null;
            let savedFile = null;

            const abort = error => {
                if (failure) return;
                failure = error;
                try { tx.abort(); } catch (_) { reject(error); }
            };

            const commit = () => {
                if (!projectReady || !filesReady || failure) return;
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
                if (mode === 'create' && existing.some(item => item.path === file.path)) {
                    const error = new Error('Já existe um arquivo com esse caminho no projeto.');
                    error.code = 'file-exists';
                    return abort(error);
                }
                if (mode === 'create' && existing.length >= maxFiles) {
                    const error = new Error(`O projeto atingiu o limite de ${maxFiles} arquivos.`);
                    error.code = 'project-file-limit';
                    return abort(error);
                }
                if (existing.some(item => item.id !== file.id && item.path === file.path)) {
                    const error = new Error('Já existe um arquivo com esse caminho no projeto.');
                    error.code = 'file-exists';
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
            filesRequest.onsuccess = () => { projectFiles = filesRequest.result; filesReady = true; commit(); };
            projectRequest.onerror = () => abort(projectRequest.error || new Error('Não foi possível validar o projeto.'));
            filesRequest.onerror = () => abort(filesRequest.error || new Error('Não foi possível consultar os arquivos do projeto.'));
            tx.oncomplete = () => resolve(savedFile);
            tx.onerror = () => reject(failure || tx.error || new Error('Não foi possível salvar o arquivo.'));
            tx.onabort = () => reject(failure || tx.error || new Error('A gravação do arquivo foi cancelada.'));
        }));
    }

    function deleteProject(projectId) {
        return transaction(['projects', 'files'], 'readwrite', tx => {
            tx.objectStore('projects').delete(projectId);
            const cursorRequest = tx.objectStore('files').index('byProject').openCursor(IDBKeyRange.only(projectId));
            cursorRequest.onsuccess = () => {
                const cursor = cursorRequest.result;
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
        getFile: id => read('files', id),
        listFiles: projectId => readAll('files', 'byProject', projectId),
        putFile: value => write('files', value),
        deleteFile: id => remove('files', id),
        saveFile,
        deleteProjectFile
    };
})();
