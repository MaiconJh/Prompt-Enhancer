# Prompt-Enhancer

> Refine prompts, not conversations.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Userscript](https://img.shields.io/badge/userscript-Tampermonkey%20%7C%20Greasemonkey-green.svg)](#installation)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](#)

A userscript that enhances prompts in LLM chat interfaces. It intercepts the
input field, rewrites the prompt through a language model, and returns the
improved version without leaving the page.

Works on **DeepSeek**, **ChatGPT**, **Claude**, **Gemini**, and **Perplexity**.

> **Status:** v1.0.0 — stable base. Features are added incrementally.

---

## Table of contents

- [Quick start](#quick-start)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Architecture](#architecture)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Privacy & Security](#privacy--security)
- [Roadmap](#roadmap)
- [Accessibility](#accessibility)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Quick start

1. **Install a userscript manager** — [Tampermonkey](https://www.tampermonkey.net/), [Greasemonkey](https://www.greasespot.net/), or [Violentmonkey](https://violentmonkey.github.io/).
2. **Build and install the script**:
   ```bash
   git clone https://github.com/MaiconJh/Prompt-Enhancer.git
   cd Prompt-Enhancer
   npm install
   npm run build
   ```
   Open `dist/prompt-enhancer.user.js`, copy its contents, and paste it into a
   new userscript in your manager.
3. **Use it** — Open a supported chat, type a prompt, and press `Ctrl+Shift+E`
   or click **Aprimorar**. Review the preview and click **Aplicar**.

Default provider: **Kilo AI Gateway**
(`https://ai-gateway.kilo.ai/api/v1/chat/completions`, model
`cohere/north-mini-code:free`, header `X-KILOCODE-EDITORNAME: PromptEnhancer`).
You can pin a catalog route or use a fallback in **Configurações → Provider**.

---

## Features

### Prompt enhancement

- **Direct enhancement** — rewrites a prompt for clarity, specificity, and
  structure while preserving the original intent.
- **Guided wizard** — the model proposes 1–5 clarification questions
  (free-form, single choice, or multi-choice). Answers are incorporated into
  the final prompt. Optional code attachment per question.
- **Preview before applying** — original vs. enhanced in an inline panel.
  Nothing is committed until you confirm.
- **Undo** — one-click revert to the original text.

### Project context

- Load `.md`, `.markdown`, `.mdc`, `.txt` files (or paste text) as project
  context. Common names like `AGENTS.md`, `CLAUDE.md`, and `.cursorrules` are
  recognized.
- Multiple files per project, each toggleable independently.
- Context is injected as a delimited block, wrapped per host
  (`<project_context>` for Claude, `### CONTEXTO DO PROJETO ###` for
  OpenAI/Gemini, generic delimiters otherwise).
- Limits: 32 KB per file, 32 KB total, up to 5 files.
- Export context as JSON.

### System prompt

- Editable system prompt with live validation.
- Local presets — save, load, rename, delete, and apply named variants (up to
  20).
- Read-only reference of the default prompt.
- Local simulation before saving (no API call).

### Generation parameters

| Parameter | Range | Default |
| :--- | :--- | :--- |
| `temperature` | 0 – 2 | 0.7 |
| `max_tokens` | 64 – 8192 | 2048 |
| `top_p` | 0 – 1 | 1.0 |
| `frequency_penalty` | −2 – 2 | 0.0 |
| `presence_penalty` | −2 – 2 | 0.0 |
| `seed` | 0 – 2147483647 | random |
| `response_language` | auto, pt-BR, en, es, fr, de, it, ja, zh | auto |
| `response_persona` | auto, formal, casual, technical, friendly, concise, custom | auto |
| `response_persona_custom` | Free-form style, up to 200 characters | empty |

Presets: **Precise**, **Balanced**, **Creative**. Preset values fill the form;
changes are persisted only when you save.

### Provider catalog and routing

- Browse curated model entries and models discovered from supported providers.
- Search by model/provider and filter by provider, keyless access, and streaming
  capability.
- **Pin** a route to use it for API calls. Models requiring a key prompt for it
  when pinned.
- Optional **fallback** route; virtual fallback can route after HTTP 429 or 5xx
  (when eligible).
- Catalog discovery is cached locally (`CATALOG_CACHE_TTL_MS`: 5 minutes). Use
  the userscript menu to refresh the catalog.
- Legacy `pe_api_url` / `pe_model` / `pe_api_key` settings are migrated into the
  provider system.

### Interface language (i18n)

The userscript UI supports `pt-BR` and `en`.

Resolution order:
1. Explicit choice in `pe_ui_language` (`pt-BR` or `en`) — always respected.
2. `auto` (default on first run) — `navigator.language` starting with `pt`
   resolves to `pt-BR`; otherwise `en`.

Change it via **Parameters → Interface language** or the menu
**🌐 Idioma / Language**.

Scope notes:
- `CONFIG.SYSTEM_PROMPT`, question/enhance-with-answers system prompts, model
  continuation/answer messages, and the editable `pe_system_prompt_v1` are
  prompt content (not UI chrome) and are kept as designed.
- `response_language` controls the **model's response language** and is
  independent from UI language.
- `scripts/check-i18n.sh` flags accented PT-BR literals in user-facing calls.

### Execution history

- Each enhancement run is recorded with nested API calls.
- Calls capture system prompt/messages, parameters, output, duration, streaming
  flags, and error details.
- Expandable cards with per-call inspection.
- Last 5 runs kept locally (32 KB cap, per-run/call truncation limits).

### Error handling and resilience

- **Typed errors**: `NETWORK`, `PROVIDER_DOWN`, `PROVIDER_RATE_LIMIT`,
  `PROVIDER_QUOTA`, `TIMEOUT`, `NO_FIRST_BYTE`, `STALL`, `EMPTY_RESPONSE`,
  `OUTPUT_TRUNCATED`, `BAD_JSON`, `ABORTED`, `OFFLINE`, `LOCAL_RATE_LIMIT`,
  `STREAM_PARSE_ERROR`, and HTTP client errors.
- **Selective retry** — retryable codes trigger automatic retry (1 attempt,
  2.5 s backoff).
- **Truncated output** — when a provider ends with `finish_reason: length`, the
  client requests up to two continuations; if still incomplete, it reports
  `OUTPUT_TRUNCATED` instead of returning a partial result as successful.
- **Contextual actions** — error toasts can offer retry, retry without context,
  retry without streaming, or open parameters (based on failure type).
- **Local rate limit** — 10 requests per 60 s per host.
- **Adaptive timeout** — 30 s base, scaled by payload size and attached
  context/code, up to 120 s.
- **Streaming watchdogs** — warn if no first byte arrives within 8 s or if the
  stream stalls for 5 s.

### Streaming feedback

- Live token counter and estimated throughput.
- Animated gear canvas (connecting, waiting, streaming, finalizing, retrying).
- Expandable debug panel (model, endpoint, payload size, attempt, status,
  first-token latency, tokens, rate).
- Cancelable at any time.

### Cross-provider compatibility

- Detects the host and wraps project context appropriately.
- Supports `<textarea>`, `<input>`, and `contenteditable` inputs.
- `HostShield` isolates script interactions from host-page event handlers.

---

## Installation

### Prerequisites

- A userscript manager: [Tampermonkey](https://www.tampermonkey.net/),
  [Greasemonkey](https://www.greasespot.net/), or
  [Violentmonkey](https://violentmonkey.github.io/).
- Node.js ≥ 20 (to build from source).

### From source

```bash
git clone https://github.com/MaiconJh/Prompt-Enhancer.git
cd Prompt-Enhancer
npm install
npm run build
```

Open `dist/prompt-enhancer.user.js`, copy its contents, and paste it into a new
userscript. Save — the script activates on supported hosts.

`playwright` is installed as a dependency for test/tooling support. Runtime is a
single concatenated userscript with no bundler/transpiler.

---

## Usage

### Basic flow

1. Focus a prompt input on a supported chat.
2. Use the toolbar: **Aprimorar · Guiado · Contexto · Parâmetros · Config ·
   Desfazer**.
3. Type your prompt.
4. Click **Aprimorar** (direct) or **Guiado** (clarification questions).
5. Review the inline preview and click **Aplicar**.

### Adding project context

1. Click **Contexto**.
2. Upload a `.md`/`.txt` file or paste content.
3. Toggle files and/or the master injection switch.
4. Enabled context is appended to the composed system prompt.

### Editing the system prompt

1. Open **Config → System prompt**.
2. Edit the active prompt (live validation).
3. Optionally save a named preset.
4. Use local simulation to validate composition.
5. Save to apply.

---

## Configuration

### Generation parameters

Open **Parâmetros** to configure generation settings and UI/response language
preferences. Use presets (**Precise**, **Balanced**, **Creative**) to fill
values, then save. Stored in `pe_params`.

### System prompt and presets

Editable system prompt stored in `pe_system_prompt_v1`. Presets are managed in
settings and persisted with prompt data.

### Provider

Open **Configurações → Provider** to search/filter the catalog, pin a route,
configure fallback behavior, and manage API keys for models that require them.
Catalog state is cached locally; routing is stored separately.

### Menu commands

Accessible from the userscript manager menu:

- **Sobre / About** — version, context stats, history counts, provider, runtime
  details.
- **Configurações / Settings** — parameters, context, system prompt, history,
  provider.
- **Limpar arquivos de contexto / Clear context files**.
- **Gerenciar contexto / Manage context**.
- **Histórico de erros / Error history**.
- **Limpar histórico de erros / Clear error history**.
- **Limpar histórico de aprimoramentos / Clear enhancement history**.
- **Idioma / Language** — toggle UI language (`pt-BR`/`en`).
- **Atualizar catálogo de provedores / Refresh provider catalog**.

---

## Keyboard shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+Shift+E` | Enhance the current prompt |
| `Ctrl+Shift+P` | Open parameters/settings (parameters flow) |
| `Ctrl+Shift+S` | Open settings modal |
| `Esc` | Close preview or guided wizard |

Shortcuts are ignored when focus is inside the script's own UI.

---

## Architecture

The userscript is built from ordered modules under `src/` and concatenated by
`build.js` into `dist/prompt-enhancer.user.js`.

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

Build/manifest facts:
- `manifest.json` defines **29 modules** in concatenation order (middle).
- `banner.js`, `open.js`, and `close.js` are fixed structural files.
- Each manifest module includes `description`, `interfaces` (`provides` /
  `consumes`), and `interactions`. `manifest-schema.js` validates this metadata.
- `build.js` writes module metadata blocks before each module in the bundle.
- `check.js` verifies `src/` ↔ `manifest.json` consistency, required markers,
  banner/metadata presence, key symbols, and `node --check` syntax.

Composition order for requests:

```
system prompt
  + language hint (if not auto)
  + persona hint (if applicable)
  + project context (if enabled)
  → messages[]
  → API call (streaming or non-stream fallback path)
```

### Storage keys

Managed via `GM_getValue` / `GM_setValue` / `GM_deleteValue`:

| Key | Purpose |
| :--- | :--- |
| `pe_ctx_files` | Project context files |
| `pe_ctx_global_enabled` | Master toggle for context injection |
| `pe_params` | Generation parameters |
| `pe_system_prompt_v1` | System prompt and presets |
| `pe_runs` | Enhancement run history |
| `pe_error_history` | Error history (last 20) |
| `pe_ui_language` | UI language preference (`auto`/`pt-BR`/`en`) |
| `pe_pinned_route` | Selected catalog route |
| `pe_provider_catalog_cache` | Cached catalog entries |
| `pe_virtual_fallback_enabled` | Virtual fallback enabled flag |
| `pe_providers` | Provider manager provider list |
| `pe_active_provider` | Active provider id |
| `pe_fallback_provider` | Fallback provider id |
| `pe_providers_migrated` | Provider migration marker |
| `pe_kilo_gateway_migrated` | Kilo gateway migration marker |

Legacy keys `pe_api_url`, `pe_model`, and `pe_api_key` are read/migrated by the
provider system and removed during migration when applicable.

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
2. If module boundaries/behavior contracts change, update the corresponding
   `manifest.json` entry (`description`, `interfaces`, `interactions`).
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
- UI strings should go through `I18n.t(...)` (both `pt-BR` and `en` keys).
- Do not add unnecessary comments or unrelated refactors.

---

## Troubleshooting

| Issue | Solution |
| :--- | :--- |
| Toolbar doesn't appear | Reload the page. Confirm the userscript is enabled and the host matches supported URLs. |
| Rate limited / 429 | Wait (local limit: 10 req/60 s per host). Consider fallback/another pinned route. |
| Timeout / slow response | Reduce context, disable streaming, or adjust parameters. Check network/provider status. |
| `OUTPUT_TRUNCATED` | The client requests continuations automatically; if still truncated, simplify the request or increase relevant limits. |
| Context not injected | Check **Contexto** master toggle and file toggles. Limits: 32 KB/file, 32 KB total, max 5 files. |
| Provider key/auth issues | Re-pin the route and provide the required key; verify provider authentication type. |
| Catalog looks stale | Use **Atualizar catálogo de provedores / Refresh provider catalog**. |

---

## Privacy & Security

- **Local-first** — settings, context, presets, and history are stored locally
  via userscript storage APIs.
- **No telemetry** — no analytics/tracking is built in.
- **API calls** — prompt/context/system data is sent only to the configured
  provider endpoint when you trigger enhancement flows.
- **API keys** — stored locally in userscript manager storage; sent only to the
  configured provider as required.
- **Sensitive data** — avoid placing secrets/tokens in prompts or context files.
- **Host isolation** — `HostShield` reduces interference from host-page event
  handling.

---

## Roadmap

### Known gaps

- Provider behavior can vary by endpoint/model; not every OpenAI-compatible edge
  case is normalized.
- Context files are text-only.
- Some prompt templates sent to the model remain pt-BR by design.

### Under consideration

- Broader provider normalization and diagnostics.
- Additional catalog/discovery sources and health signals.
- UX refinements for provider routing and history inspection.

### Long term

- Publish to GreasyFork with a stable install/update URL.

---

## Accessibility

- Animations respect `prefers-reduced-motion`.
- Guided wizard uses semantic controls and ARIA attributes where applicable.
- Streaming/error states are surfaced in the UI with status feedback.
- Modals manage focus and provide close/cancel controls.
- Loading overlay exposes status and a visible cancel action.

WCAG 2.2 AA is a target, not a guaranteed certification. Accessibility issues
should be reported as bugs.

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
- [Kilo AI Gateway](https://ai-gateway.kilo.ai/) — default backend route.
- The userscript ecosystem and community patterns this project builds on.
