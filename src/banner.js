// ===== src/banner.js =====
// ==UserScript==
// @name         Prompt-Enhancer
// @name:pt-BR   Aprimorador de Prompt
// @namespace    https://github.com/EdgeTypE/better-deepseek
// @version      1.0.0
// @description  Modular prompt enhancement for LLM chat UIs. Free anonymous default API.
// @description:pt-BR  Aprimoramento modular de prompts em chats com LLM. API padrão gratuita e anônima.
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
// @connect      *
// @connect      openrouter.ai
// @connect      ai-gateway.kilo.ai
// @connect      gen.pollinations.ai
// @connect      keylessai.thryx.workers.dev
// @connect      api.groq.com
// @connect      oai.endpoints.kepler.ai.cloud.ovh.net
// @require      https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
// @run-at       document-idle
// ==/UserScript==
