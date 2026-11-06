// ===== src/00-banner.js =====
// ==UserScript==
// @name         Prompt-Enhancer
// @name:pt-BR   Aprimorador de Prompt Kilo
// @namespace    https://github.com/EdgeTypE/better-deepseek
// @version      1.0.0
// @description  Transparent prompt bar + guided wizard with collapsible questions, inline progress, prompt base chip, flat option lists, inline in-flow panel, optional code context, multi-file project context popover, typed network errors and selective retry, ErrorIndexer, generation parameters, user-managed system prompt with local presets and validation, enhancement run history, and streaming with adaptive feedback. Free anonymous Kilo Code API.
// @description:pt-BR  Barra de prompt transparente + assistente guiado, contexto de código opcional, erros de rede tipados, ErrorIndexer, parâmetros de geração, system prompt editável com presets locais e validação, histórico de aprimoramentos e streaming com feedback adaptativo. API gratuita e anônima do Kilo Code.
// @author       MaiconJh
// @license      MIT
// @match        *://chat.deepseek.com/*
// @match        *://chatgpt.com/*
// @match        *://chat.openai.com/*
// @match        *://claude.ai/*
// @match        *://gemini.google.com/*
// @match        *://*.perplexity.ai/*
// @exclude      *://*.bank*/*
// @exclude      *://*.banco*/*
// @exclude      *://*.gov*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @connect      api.kilo.ai
// @require      https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
// @run-at       document-idle
// ==/UserScript==

