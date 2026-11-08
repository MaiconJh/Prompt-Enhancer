# Prompt-Enhancer

> Refine prompts, not conversations.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Userscript](https://img.shields.io/badge/userscript-Tampermonkey%20%7C%20Greasemonkey%20%7C%20Violentmonkey-green.svg)](#installation)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](#)

A userscript that enhances prompts inside LLM chat interfaces. It intercepts the input field, rewrites the prompt through a language model, and returns the improved version without leaving the page.

Works on **DeepSeek**, **ChatGPT**, **Claude**, and **Gemini** via dedicated site adapters. Other hosts (including **Perplexity**) are supported through the generic adapter fallback.

> **Status:** v1.0.0 — stable base. Features are added incrementally.

---

## Table of Contents

- [Why Prompt-Enhancer?](#why-prompt-enhancer)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Architecture](#architecture)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Privacy & Security](#privacy--security)
- [Accessibility](#accessibility)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Why Prompt-Enhancer?

LLM chat interfaces often require detailed, well-structured prompts to produce good results, but writing them manually is time-consuming. Prompt-Enhancer automates the refinement step: it uses a language model to rewrite your draft, preserving your original intent while adding clarity, structure, and specificity.

**Perfect for:**
- Users who want better LLM responses without mastering prompt engineering.
- Developers who need consistent, well-formed prompts for coding tasks.
- Anyone who wants to iterate quickly on a prompt without leaving the chat UI.

---

## Features

- **Direct enhancement** — rewrites a prompt for clarity, specificity, and structure while preserving the original intent.
- **Guided wizard** — the model proposes 1–5 clarification questions (free-form, single choice, or multi-choice). Answers are incorporated into the final prompt. Optional code attachment per question.
- **Preview before applying** — original vs. enhanced comparison in an inline panel. Nothing is committed until you confirm.
- **Undo** — one-click revert to the original text.
- **Project context** — load `.md`, `.markdown`, `.mdc`, `.txt` files (or paste text) as additional context. Limits: 32 KB per file, 32 KB total, up to 5 files.
- **Editable system prompt** — customize base instructions and save named presets (up to 20).
- **Generation parameters** — temperature, `max_tokens`, `top_p`, penalties, seed, response language, and persona.
- **Provider catalog** — browse curated free/local models (Kilo, OVHcloud, Pollinations, Groq, Gemini, Mistral, Ollama, OpenRouter, Cloudflare). Pin a primary route and configure a fallback.
- **Execution history** — every enhancement run is recorded with nested API calls, parameters, and outputs.
- **Resilient error handling** — typed errors, automatic retries, and contextual actions.
- **Interface internationalization** — English and Portuguese (BR).
- **Streaming feedback** — live token counter, estimated throughput, and visual progress.

---

## Installation

### Prerequisites

- A userscript manager: [Tampermonkey](https://www.tampermonkey.net/), [Greasemonkey](https://www.greasespot.net/), or [Violentmonkey](https://violentmonkey.github.io/).
- Node.js ≥ 20 (to build from source).

### From source

```bash
git clone https://github.com/MaiconJh/Prompt-Enhancer.git
cd Prompt-Enhancer
npm install
npm run build
```

Open `dist/prompt-enhancer.user.js`, copy its contents, and paste it into a new userscript in your manager. Save — the script activates on supported hosts.

> **Note:** `playwright` is installed as a dependency for test/tooling support. The runtime is a single concatenated userscript with no bundler/transpiler.

---

## Usage

### Basic flow

1. Focus a prompt input on a supported chat.
2. Use the toolbar: **Enhance · Guided · Context · Parameters · Settings · Undo**.
3. Type your prompt.
4. Click **Enhance** (direct) or **Guided** (clarification questions).
5. Review the inline preview and click **Apply**.

### Adding project context

1. Click **Context**.
2. Upload a `.md`/`.txt` file or paste content.
3. Toggle files and/or the master injection switch.
4. Enabled context is appended to the composed system prompt.

### Editing the system prompt

1. Open **Settings → System prompt**.
2. Edit the active prompt (live validation).
3. Optionally save a named preset.
4. Use local simulation to validate composition.
5. Save to apply.

---

## Configuration

### Generation parameters

Open **Parameters** to configure generation settings and UI/response language preferences. Use presets (**Precise**, **Balanced**, **Creative**) to fill values, then save. Stored in `pe_params`.

### System prompt and presets

The editable system prompt is stored in `pe_system_prompt_v1` via `localStorage` (browser storage, not userscript manager storage). Presets are managed in settings and persisted with prompt data.

### Provider

Open **Settings → Provider** to search/filter the catalog, pin a route, configure fallback behavior, and manage API keys for models that require them. Catalog state is cached locally; routing is stored separately.

### Menu commands

Accessible from the userscript manager menu:

- **About** — version, context stats, history counts, provider, runtime details.
- **Settings** — parameters, context, system prompt, history, provider.
- **Clear context files**.
- **Manage context**.
- **Error history**.
- **Clear error history**.
- **Clear enhancement history**.
- **Language** — toggle UI language (`en`/`pt-BR`).
- **Refresh provider catalog**.

Menu commands are automatically re-registered when the UI language changes (`pe:i18n-changed` event), ensuring labels reflect the selected language.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+Shift+E` | Enhance the current prompt |
| `Ctrl+Shift+P` | Open parameters/settings (parameters flow) |
| `Ctrl+Shift+S` | Open settings modal |
| `Esc` | Close preview or guided wizard |

Shortcuts are ignored when focus is inside the script's own UI.

---

## Architecture

The userscript is built from ordered modules under `src/` and concatenated by `build.js` into `dist/prompt-enhancer.user.js`.

```
src/
├── banner.js                   UserScript metadata header
├── open.js                     IIFE open + 'use strict'
├── config.js                   Defaults, CONFIG, animation constants
├── provider-catalog.js         Curated free/local provider model entries
├── provider-discovery.js       Cross-origin model catalog discovery
├── provider-registry.js        Cache/normalize/filter/merge catalog entries
├── host-shield.js              Host event/UI isolation
├── utils.js                    Shared DOM/text/timing/format helpers
├── i18n.js                     UI i18n dictionaries and helpers
├── providers-project-context.js Host detection + project context/files
├── migration.js                Legacy storage/history migrations
├── provider-manager.js         Provider settings, pinned route, fallback
├── network-errors.js           Typed errors and error history
├── enhancement-history.js      Run/call history persistence
├── rate-limiter.js             Local rate limiting per host
├── param-schema.js             Parameter schema, presets, validation
├── system-prompt-manager.js    System prompt validation and presets
├── stream-parser-anim.js       SSE parsing and animation helpers
├── gear.js                     Loading gear canvas states
├── styles.js                   Injected UI styles
├── icons-atoms.js              SVG icons and primitive UI controls
├── code-attachment.js          Guided-mode code/file attachments
├── context-popover.js          Project-context popover UI
├── state.js                    Shared runtime state
├── settings-modal.js           Settings UI (params/context/prompt/history/provider)
├── overlay-events.js           Wire API events to loading overlay
├── molecules.js                Composite UI (toolbar, overlays, wizard, toasts)
├── api-client.js               Request building, streaming, retries, history capture
├── composer.js                 Detect/mount toolbar on supported inputs
├── orchestration.js            Enhancement flows and action handlers
├── bootstrap.js                Init, observers, migrations, menu commands
└── close.js                    IIFE close
```

**Composition order for requests:**

```
system prompt
  + language hint (if not auto)
  + persona hint (if applicable)
  + project context (if enabled)
  → messages[]
  → API call (streaming or non-stream fallback path)
```

### Storage keys

Managed via `GM_getValue` / `GM_setValue` / `GM_deleteValue`, except `pe_system_prompt_v1` which uses `localStorage`:

| Key | Purpose |
| :--- | :--- |
| `pe_ctx_files` | Project context files |
| `pe_ctx_global_enabled` | Master toggle for context injection |
| `pe_params` | Generation parameters |
| `pe_system_prompt_v1` | System prompt and presets |
| `pe_runs` | Enhancement run history |
| `pe_error_history` | Error history (last 20) |
| `pe_ui_language` | UI language preference (`auto`/`en`/`pt-BR`) |
| `pe_pinned_route` | Selected catalog route |
| `pe_provider_catalog_cache` | Cached catalog entries |
| `pe_virtual_fallback_enabled` | Virtual fallback enabled flag |
| `pe_providers` | Provider manager provider list |
| `pe_active_provider` | Active provider id |
| `pe_fallback_provider` | Fallback provider id |
| `pe_providers_migrated` | Provider migration marker |
| `pe_kilo_gateway_migrated` | Gateway migration marker |

Legacy keys `pe_api_url`, `pe_model`, and `pe_api_key` are read/migrated by the provider system and removed during migration when applicable.

---

## Development

### Requirements

- Node.js ≥ 20.
- Userscript manager with developer mode (for manual testing).

### Commands

```bash
npm run build     # Build dist/prompt-enhancer.user.js from manifest order
npm run check     # Structural checks + i18n literal check
npm run test      # check + node --test src/tests/*-tests.js
npm run test:api  # PE_API_SMOKE=1 integration smoke tests
npm run sandbox   # Local sandbox helper (sandbox.cjs)
```

### Editing workflow

1. Edit modules in `src/`.
2. If module boundaries/behavior contracts change, update the corresponding `manifest.json` entry (`description`, `interfaces`, `interactions`).
3. Run `npm run build`.
4. Paste `dist/prompt-enhancer.user.js` into your userscript manager.
5. Reload the target chat and test.

### Test coverage (current)

Unit/integration-style Node tests under `src/tests/`:
- `provider-default-tests.js`
- `provider-catalog-tests.js`
- `provider-api-tests.js`
- `provider-api-integration-tests.js` (smoke; gated by `PE_API_SMOKE=1`)

### Manual testing checklist

- [ ] Toolbar appears on supported hosts (DeepSeek, ChatGPT, Claude, Gemini, Perplexity).
- [ ] Direct enhancement returns a preview (original/enhanced).
- [ ] Guided mode generates valid questions and produces a final prompt.
- [ ] Project context injection works when enabled.
- [ ] Parameter/system prompt/provider changes are persisted and reflected.
- [ ] History records runs and nested calls.
- [ ] Error actions behave correctly (`retry`, no-context/no-stream, params).
- [ ] Streaming watchdogs and cancellation behave as expected.
- [ ] UI language toggle works; `npm run check:i18n` passes.
- [ ] `prefers-reduced-motion` reduces animation.

### Code style

- No runtime bundler/transpilation; modules share the same IIFE scope.
- Keep module metadata in `manifest.json` accurate.
- UI strings should go through `I18n.t(...)` (both `en` and `pt-BR` keys).
- Do not add unnecessary comments or unrelated refactors.

---

## Troubleshooting

| Issue | Solution |
| :--- | :--- |
| Toolbar doesn't appear | Reload the page. Confirm the userscript is enabled and the host matches supported URLs. |
| Rate limited / 429 | Wait (local limit: 10 req/60 s per host). Consider fallback/another pinned route. |
| Timeout / slow response | Reduce context, disable streaming, or adjust parameters. Check network/provider status. |
| `OUTPUT_TRUNCATED` | The client requests continuations automatically; if still truncated, simplify the request or increase relevant limits. |
| Context not injected | Check **Context** master toggle and file toggles. Limits: 32 KB/file, 32 KB total, max 5 files. |
| Provider key/auth issues | Re-pin the route and provide the required key; verify provider authentication type. |
| Catalog looks stale | Use **Refresh provider catalog**. |

---

## Privacy & Security

- **Local-first** — settings, context, presets, and history are stored locally via userscript storage APIs.
- **No telemetry** — no analytics/tracking is built in.
- **API calls** — prompt/context/system data is sent only to the configured provider endpoint when you trigger enhancement flows.
- **API keys** — stored locally in userscript manager storage; sent only to the configured provider as required.
- **Sensitive data** — avoid placing secrets/tokens in prompts or context files.
- **Host isolation** — `HostShield` reduces interference from host-page event handling.

---

## Accessibility

- Animations respect `prefers-reduced-motion`.
- Guided wizard uses semantic controls and ARIA attributes where applicable.
- Streaming/error states are surfaced in the UI with status feedback.
- Modals manage focus and provide close/cancel controls.
- Loading overlay exposes status and a visible cancel action.

WCAG 2.2 AA is a target, not a guaranteed certification. Accessibility issues should be reported as bugs.

---

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`.
3. Make focused changes (keep module boundaries clear).
4. Run `npm test`.
5. Test on at least two supported hosts.
6. Open a pull request with rationale and test coverage.

For bug reports, include:
- Host chat and browser version.
- Reproduction steps and prompt/context shape (redacted if sensitive).
- Error code/toast details.
- Debug/streaming details if relevant.

---

## License

[MIT](LICENSE)

---

## Acknowledgments

- [GSAP](https://gsap.com/) — animation library used in the UI.
- [Default API Gateway](https://ai-gateway.kilo.ai/) — default backend route.
- The userscript ecosystem and community patterns this project builds on.