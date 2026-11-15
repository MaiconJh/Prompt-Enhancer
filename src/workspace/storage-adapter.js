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
            request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); databasePromise = null; }; resolve(db); };
            request.onerror = () => { databasePromise = null; reject(request.error || new Error('Não foi possível abrir o banco Workspace.')); };
            request.onblocked = () => console.warn('[PE Workspace] A atualização do banco está bloqueada por outra aba.');
        });
        return databasePromise;
    }
    function transaction(storeNames, mode, operation) {
        return open().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(storeNames, mode);
            let result;
            try { result = operation(tx); } catch (error) { tx.abort(); reject(error); return; }
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
    const remove = (storeName, key) => transaction([storeName], 'readwrite', tx => tx.objectStore(storeName).delete(key));
    function deleteProject(projectId) {
        return transaction(['projects', 'files'], 'readwrite', tx => {
            tx.objectStore('projects').delete(projectId);
            const cursorRequest = tx.objectStore('files').index('byProject').openCursor(IDBKeyRange.only(projectId));
            cursorRequest.onsuccess = () => { const cursor = cursorRequest.result; if (cursor) { cursor.delete(); cursor.continue(); } };
        });
    }
    return {
        open, close() { if (databasePromise) databasePromise.then(db => db.close()).catch(() => {}); databasePromise = null; },
        getProject: id => read('projects', id), listProjects: () => readAll('projects'),
        putProject: value => write('projects', value), deleteProject,
        getFile: id => read('files', id), listFiles: projectId => readAll('files', 'byProject', projectId),
        putFile: value => write('files', value), deleteFile: id => remove('files', id)
    };
})();
