// ==UserScript==
// @name         Prompt-Enhancer Dev Reloader
// @name:pt-BR   Prompt-Enhancer — Recarregador de Dev
// @name:en      Prompt-Enhancer Dev Reloader
// @namespace    https://github.com/EdgeTypE/prompt-enhancer-dev
// @version      1.0.0
// @description  Conecta ao servidor de reload local e recarrega a página após cada build de dev.
// @description:pt-BR  Conecta ao servidor de reload local e recarrega a página após cada build de dev.
// @description:en     Connects to the local reload server and reloads the page after each dev build.
// @author       MaiconJh
// @license      MIT
// @match        *://chat.deepseek.com/*
// @match        *://chatgpt.com/*
// @match        *://chat.openai.com/*
// @match        *://claude.ai/*
// @match        *://gemini.google.com/*
// @match        *://*.perplexity.ai/*
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    const HOST = '127.0.0.1';
    const PORT = 8788;
    const WS_URL = `ws://${HOST}:${PORT}/`;
    const SSE_URL = `http://${HOST}:${PORT}/__reload`;
    const MIN_BACKOFF_MS = 1000;
    const MAX_BACKOFF_MS = 30000;

    let backoffMs = MIN_BACKOFF_MS;
    let timer = null;
    let socket = null;
    let eventSource = null;
    let socketOpened = false;
    let sseAttempted = false;

    function log(message) {
        console.debug(`[pe-dev-reloader] ${message}`);
    }

    function clear() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        if (socket) {
            socket.close();
            socket = null;
        }
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
    }

    function handleMessage(data) {
        let message;
        try {
            message = JSON.parse(data);
        } catch (error) {
            return;
        }
        if (message && message.type === 'reload') {
            log('recarregando página após notificação de build');
            location.reload();
        }
    }

    function connectWebSocket() {
        try {
            socket = new WebSocket(WS_URL);
            socket.onopen = () => {
                socketOpened = true;
                backoffMs = MIN_BACKOFF_MS;
                sseAttempted = false;
                log('WebSocket conectado ao servidor de reload');
            };
            socket.onmessage = (event) => handleMessage(event.data);
            socket.onclose = () => {
                socket = null;
                handleDisconnect();
            };
            socket.onerror = () => {
                if (!socketOpened && !sseAttempted) {
                    sseAttempted = true;
                    log('WebSocket indisponível; tentando EventSource');
                    connectEventSource();
                } else {
                    handleDisconnect();
                }
            };
        } catch (error) {
            log(`WebSocket indisponível: ${error.message}`);
            connectEventSource();
        }
    }

    function connectEventSource() {
        try {
            eventSource = new EventSource(SSE_URL);
            eventSource.onopen = () => {
                backoffMs = MIN_BACKOFF_MS;
                log('EventSource conectado ao servidor de reload');
            };
            eventSource.onmessage = (event) => handleMessage(event.data);
            eventSource.onerror = () => {
                eventSource.close();
                eventSource = null;
                scheduleReconnect();
            };
        } catch (error) {
            log(`EventSource indisponível: ${error.message}`);
            scheduleReconnect();
        }
    }

    function handleDisconnect() {
        if (socketOpened) {
            scheduleReconnect();
        } else if (!sseAttempted) {
            sseAttempted = true;
            connectEventSource();
        } else {
            scheduleReconnect();
        }
    }

    function scheduleReconnect() {
        if (timer) return;
        log(`reconectando em ${backoffMs / 1000} s`);
        timer = setTimeout(() => {
            timer = null;
            backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
            connectWebSocket();
        }, backoffMs);
    }

    connectWebSocket();

    window.addEventListener('beforeunload', clear);
})();
