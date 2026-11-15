// ===== src/banner.js =====
// ==UserScript==
// @name         Prompt-Enhancer
// @name:pt-BR   Aprimorador de Prompt
// @name:en      Prompt-Enhancer
// @namespace    https://github.com/MaiconJh/Prompt-Enhancer
// @version      1.0.0
// @description  Modular prompt enhancement for LLM chat UIs. Free anonymous default API.
// @description:pt-BR  Aprimoramento modular de prompts em chats com LLM. API padrão gratuita e anônima.
// @description:en     Modular prompt enhancement for LLM chat UIs. Free anonymous default API.
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
// @grant        GM_unregisterMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @connect      openrouter.ai
// @connect      ai-gateway.kilo.ai
// @connect      gen.pollinations.ai
// @connect      keylessai.thryx.workers.dev
// @connect      api.groq.com
// @connect      oai.endpoints.kepler.ai.cloud.ovh.net
// @require      https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js#sha256=KAM+RJox68w5blvosTtjFSvwMJQoj7WGcDQyGSe84Ic=
// @noframes
// @run-at       document-idle
// ==/UserScript==
