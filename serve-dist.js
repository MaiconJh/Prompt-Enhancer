import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const bundlePath = join(root, 'dist', 'prompt-enhancer.user.js');
const sourceDir = join(root, 'src');
const manifestPath = join(root, 'manifest.json');
const HOST = '127.0.0.1';
const DEFAULT_HTTP_PORT = 8787;
const DEFAULT_WS_PORT = 8788;
const DEBOUNCE_RELOAD_MS = 200;
const DEBOUNCE_BUILD_MS = 150;

function resolvePort(envName, fallback) {
    const value = Number(process.env[envName]);
    return Number.isFinite(value) ? value : fallback;
}

const reloadClients = new Set();

function broadcast(message) {
    const payload = `data: ${JSON.stringify(message)}\n\n`;
    for (const client of reloadClients) {
        try {
            client.write(payload);
        } catch (error) {
            reloadClients.delete(client);
        }
    }
}

function createHttpServer(port) {
    return createServer(async (req, res) => {
        const url = new URL(req.url, `http://${HOST}:${port}`);
        if (req.method !== 'GET' || url.pathname !== '/prompt-enhancer.user.js') {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('não encontrado');
            return;
        }
        try {
            const body = await readFile(bundlePath, 'utf8');
            res.writeHead(200, {
                'Content-Type': 'text/javascript; charset=utf-8',
                'Cache-Control': 'no-store'
            });
            res.end(body);
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('bundle indisponível');
        }
    });
}

function createReloadServer(port) {
    return createServer((req, res) => {
        const url = new URL(req.url, `http://${HOST}:${port}`);
        if (req.method === 'GET' && url.pathname === '/__reload') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-store',
                Connection: 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });
            res.write('\n');
            reloadClients.add(res);
            const cleanup = () => {
                reloadClients.delete(res);
                res.removeListener('close', cleanup);
                res.removeListener('error', cleanup);
            };
            res.on('close', cleanup);
            res.on('error', cleanup);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('não encontrado');
        }
    });
}

let reloadTimer = null;
let reloadWatcher = null;

function startReloadWatcher() {
    if (!existsSync(bundlePath)) {
        console.log('[serve] dist/prompt-enhancer.user.js não encontrado; watch de reload adiado até o primeiro build');
        return;
    }
    reloadWatcher = watch(bundlePath, (eventType, filename) => {
        if (eventType !== 'change') return;
        clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
            console.log(`[serve] mudança detectada em ${filename}; notificando clientes de reload`);
            broadcast({ type: 'reload', ts: Date.now(), file: filename });
        }, DEBOUNCE_RELOAD_MS);
    });
}

let buildTimer = null;
let buildChild = null;

function runDevBuild() {
    if (buildChild && !buildChild.exitCode && !buildChild.killed) return;
    buildChild = spawn(process.execPath, [join(root, 'build.js'), '--dev'], { stdio: 'inherit' });
    buildChild.on('exit', (code) => {
        console.log(code === 0 ? '[dev] rebuild concluído' : `[dev] rebuild falhou (código ${code})`);
        buildChild = null;
    });
}

function startBuildWatch() {
    watch(sourceDir, { recursive: true }, runDevBuild);
    watch(manifestPath, runDevBuild);
}

export function startServers({ httpPort, wsPort, watchBuild = false } = {}) {
    const hPort = resolvePort('PE_PORT', httpPort ?? DEFAULT_HTTP_PORT);
    const wPort = resolvePort('PE_WS_PORT', wsPort ?? DEFAULT_WS_PORT);

    const httpServer = createHttpServer(hPort).listen(hPort, HOST);
    const reloadServer = createReloadServer(wPort).listen(wPort, HOST);

    startReloadWatcher();
    if (watchBuild) {
        startBuildWatch();
        console.log('[dev] watch-build ativo sobre src/ e manifest.json (debounce 150 ms)');
    }

    function stopClients() {
        for (const client of reloadClients) {
            try {
                client.destroy();
            } catch (error) {
                // ignorar erros de fechamento de clientes já encerrados
            }
        }
        reloadClients.clear();
    }

    async function stop() {
        if (reloadWatcher) reloadWatcher.close();
        clearTimeout(reloadTimer);
        clearTimeout(buildTimer);
        if (buildChild) buildChild.kill('SIGTERM');
        stopClients();
        return new Promise((resolve) => {
            httpServer.close(() => {
                reloadServer.close(() => resolve());
            });
        });
    }

    async function handleShutdown(signal) {
        console.log(`[serve] ${signal} recebido; encerrando servidores...`);
        await stop();
        process.exit(0);
    }

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    console.log(`[serve] HTTP escutando em http://${HOST}:${hPort}/prompt-enhancer.user.js`);
    console.log(`[serve] reload (SSE) escutando em http://${HOST}:${wPort}/__reload`);
    console.log('[serve] escutando exclusivamente em 127.0.0.1; Ctrl+C encerra');

    return { httpServer, reloadServer, stop };
}

const isDirect = pathToFileURL(process.argv[1]).href === import.meta.url;
if (isDirect) {
    const watchBuild = process.argv.includes('--watch-build');
    startServers({ watchBuild });
}
