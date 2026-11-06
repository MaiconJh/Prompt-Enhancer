# Prompt-Enhancer

> Refine prompts, not conversations.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Userscript](https://img.shields.io/badge/userscript-Tampermonkey%20%7C%20Greasemonkey-green.svg)](#installation)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](#)

A userscript that enhances prompts in LLM chat interfaces. It intercepts the
input field, rewrites the prompt through a language model, and returns the
improved version without leaving the page.

Works on **DeepSeek**, **ChatGPT**, **Claude**, **Gemini** and **Perplexity**.

> **Status:** v1.0.0 — stable base. New features will be added incrementally.

---

## Table of contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Architecture](#architecture)
- [Development](#development)
- [Roadmap](#roadmap)
- [Accessibility](#accessibility)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Features

### Prompt enhancement

- **Direct enhancement** — one click rewrites the prompt for clarity,
  specificity and structure, preserving the original intent.
- **Guided wizard** — the model proposes 3–5 clarification questions
  (free-form, single choice, or multi-choice). Answers are incorporated
  into the final prompt. Optional code attachment per question.
- **Preview before applying** — original vs enhanced, side by side, in an
  inline panel. Nothing is committed until you confirm.
- **Undo** — one-click revert to the original text.

### Project context

- Load `.md`, `.markdown`, `.mdc`, `.txt` files (or paste text) as project
  context. Common names like `AGENTS.md`, `CLAUDE.md`, `.cursorrules` are
  recognized.
- Multiple files per project, each toggleable independently.
- Context is injected as a delimited block, wrapped differently per host
  (`<project_context>` for Claude, `### CONTEXTO DO PROJETO ###` for
  OpenAI/Gemini, generic delimiters otherwise).
- Per-file limit 32 KB, total 32 KB, up to 5 files.
- Export context as JSON.

### System prompt

- Editable system prompt with live validation.
- Local presets — save, load, rename, delete and apply named variants
  (up to 20).
- Read-only reference of the default prompt.
- "Test locally" validation before saving.

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
| `response_persona` | auto, formal, casual, technical, friendly, concise | auto |

Presets: **Precise**, **Balanced**, **Creative**.

### Execution history

- Every enhancement run is recorded with its nested API calls.
- Each call captures the system prompt, messages, parameters, output,
  duration, streaming/fallback flags and error details.
- Expandable cards with per-call inspection.
- Last 5 runs kept locally (32 KB cap).

### Error handling and resilience

- **Typed errors** with 14+ codes: `NETWORK`, `PROVIDER_DOWN`,
  `PROVIDER_RATE_LIMIT`, `PROVIDER_QUOTA`, `TIMEOUT`, `NO_FIRST_BYTE`,
  `STALL`, `EMPTY_RESPONSE`, `BAD_JSON`, `ABORTED`, `OFFLINE`,
  `LOCAL_RATE_LIMIT`, `STREAM_PARSE_ERROR`, and more.
- **Selective retry** — only retryable codes trigger automatic retry
  (1 attempt, 2.5 s backoff).
- **Contextual actions** — error toasts offer "Retry", "Retry without
  context", "Retry without streaming" or "Open parameters" based on the
  failure type.
- **Local rate limit** — 10 requests per 60 s per host.
- **Adaptive timeout** — 30 s base, scaling with payload size up to 120 s.
- **Streaming watchdogs** — warn if no first byte arrives within 8 s or if
  the stream stalls for 5 s.

### Streaming feedback

- Live token counter and estimated throughput during streaming.
- Animated gear canvas that morphs through five states: connecting,
  waiting, streaming, finalizing, retrying.
- Expandable debug panel with metrics (model, endpoint, payload size,
  attempt, status, first-token latency, tokens, rate).
- Cancelable at any time.

### Cross-provider compatibility

- Automatically detects the host and wraps project context accordingly.
- Respects each chat interface's input model (`<textarea>`, `<input>`,
  `contenteditable`).
- Shields interactions from the host page's own event handlers.

---

## Installation

### Prerequisites

- A userscript manager: [Tampermonkey](https://www.tampermonkey.net/),
  [Greasemonkey](https://www.greasespot.net/) or
  [Violentmonkey](https://violentmonkey.github.io/).
- A supported chat interface (see [Features](#features)).

### From source

1. Clone the repository:
   ```bash
   git clone https://github.com/prompt-enhancer/prompt-enhancer.git
   cd prompt-enhancer
   ```
2. Build:
   ```bash
   npm run build
   ```
3. Open `dist/prompt-enhancer.user.js`, copy its contents, and paste into a
   new userscript in your userscript manager.
4. Save. The script activates on supported hosts.

No `npm install` is required — the build has no external dependencies.

---

## Usage

### Basic flow

1. Focus any prompt input on a supported chat.
2. A toolbar appears above the input: **Aprimorar · Guiado · Contexto ·
   Parâmetros · Config · Desfazer**.
3. Type your prompt.
4. Click **Aprimorar** to enhance directly, or **Guiado** to answer
   clarification questions first.
5. Review the inline preview and click **Aplicar** to commit.

### Adding project context

1. Click **Contexto** in the toolbar.
2. Upload a `.md`/`.txt` file or paste content directly.
3. Toggle files on or off; the master switch controls injection.
4. Context is appended to the system prompt for every subsequent enhancement.

### Editing the system prompt

1. Open **Config → System prompt**.
2. Edit the active prompt. Validation runs live.
3. Optionally save a named preset for reuse.
4. Click **Testar localmente** to validate composition (no API call).
5. Click **Salvar** to apply.

---

## Configuration

### Generation parameters

Open **Parâmetros** from the toolbar to configure temperature, max_tokens,
top_p, frequency_penalty, presence_penalty, seed, response language and
persona. Presets (**Precise**, **Balanced**, **Creative**) fill the fields
in one click — changes are only persisted when you click Save.

Stored locally in `kpe_params`.

### System prompt and presets

Editable system prompt, stored in `kpe_system_prompt_v1`. Local presets are
stored alongside the prompt and can be loaded, renamed or deleted
individually.

### Menu commands

Accessible from the userscript manager's menu:

- **Sobre** — version, context stats, history counts and current provider.
- **Configurações** — full settings modal (params, context, system prompt,
  history).
- **Limpar arquivos de contexto** — remove all project context files.
- **Gerenciar contexto** — open the context popover from the menu.
- **Histórico de erros** — list the last 20 errors with codes and messages.
- **Limpar histórico de erros** — reset the error history.
- **Limpar histórico de aprimoramentos** — reset the run history.

---

## Keyboard shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+Shift+E` | Enhance the current prompt |
| `Ctrl+Shift+P` | Open parameters modal |
| `Ctrl+Shift+S` | Open settings modal |
| `Esc` | Close preview or guided wizard |

Shortcuts are ignored when focus is inside the script's own UI.

---

## Architecture

The userscript is composed of ordered modules under `src/` that are
concatenated by `build.js` into a single installable file at
`dist/prompt-enhancer.user.js`.

```
src/
├── banner.js               UserScript metadata header
├── open.js                 IIFE open + 'use strict'
├── config.js               CONFIG and animation constants
├── host-shield.js          HostShield (event isolation)
├── utils.js                Utils and truncation helpers
├── providers-project-context.js Providers and ProjectContext (host detection, context and files)
├── migration.js            Legacy storage and history migration
├── network-errors.js       NetError and ErrorIndexer (catalog and history)
├── enhancement-history.js  EnhancementHistory (run history)
├── rate-limiter.js         RateLimiter (10 req / 60 s per host)
├── param-schema.js         ParamSchema (declarative definition + presets)
├── system-prompt-manager.js SystemPromptManager (validation + presets)
├── stream-parser-anim.js   StreamParser (SSE) and Anim (GSAP wrappers)
├── gear.js                 Loading gear states and canvas
├── styles.js               injectStyles (full CSS)
├── icons-atoms.js          ICONS and Atoms (SVG + button builders)
├── code-attachment.js      codeAttachment (paste + file attachment)
├── context-popover.js      contextPopover (anchored popover)
├── state.js                Shared state object
├── settings-modal.js       settingsModal (params, context, prompt, history)
├── overlay-events.js       wireOverlayToEvents (loading overlay events)
├── molecules.js            Molecules (toolbar, overlays, panels, wizard, toast)
├── api-client.js           ApiClient (HTTP client with streaming + history)
├── composer.js             Composer (toolbar mounting per input)
├── orchestration.js        Event handlers, flow orchestration, menu
├── bootstrap.js            DOMContentLoaded / init dispatch
└── close.js                IIFE close
```

The concatenation order of the 24 middle modules is controlled by the
root-level `manifest.json`; `banner.js`, `open.js` and `close.js` remain in
fixed structural positions.

**Composition order for every request:**

```
SYSTEM_PROMPT
  + language hint (if not auto)
  + persona hint (if not auto)
  + project context (if enabled)
  → messages[]
  → API call
```

**Storage keys** (via `GM_setValue` / `GM_getValue`):

| Key | Content |
| :--- | :--- |
| `kpe_ctx_files` | Project context files |
| `kpe_ctx_global_enabled` | Master toggle for context injection |
| `kpe_params` | Generation parameters |
| `kpe_system_prompt_v1` | System prompt and presets |
| `kpe_runs` | Enhancement history |
| `kpe_error_history` | Error catalog history (last 20) |

---

## Development

### Requirements

- Node.js ≥ 20.
- A userscript manager with developer mode enabled (for testing).

### Build

```bash
npm run build    # concatenates src/ into dist/prompt-enhancer.user.js
npm run check    # structural sanity check
npm test         # build + check
```

The build is a straight concatenation — no bundler, no transpiler, no
external dependencies.

### Editing workflow

1. Edit the relevant module in `src/`.
2. Run `npm run build`.
3. Paste the new `dist/prompt-enhancer.user.js` into your userscript
   manager.
4. Reload the target chat and test.

### Testing checklist

- [ ] Toolbar appears on all five supported hosts.
- [ ] Direct enhancement returns a preview with the original and enhanced
      text.
- [ ] Guided mode generates 3–5 questions with correct types.
- [ ] Project context is injected when enabled.
- [ ] Parameter changes are reflected in the debug panel.
- [ ] History records the run with nested calls.
- [ ] Errors trigger the correct action key (`retry`, `retry-no-context`,
      `retry-nostream`, `open-params`).
- [ ] Streaming watchdogs fire when the connection is artificially slowed.
- [ ] `prefers-reduced-motion` disables animations.

### Code style

- No build tools, no transpilation beyond concatenation.
- All modules share the same IIFE scope; no `import`/`export` between them.
- All user-facing strings in Portuguese (pt-BR); code comments and
  identifiers in English.

---

## Roadmap

### Known gaps

- The API endpoint and model are fixed at build time. Changing them requires
  editing `src/01-config.js` and rebuilding.
- Only OpenAI-compatible APIs are supported. Other providers need a
  dedicated adapter.
- Context files are text-only; binary or rich formats are not handled.

### Under consideration

- Model selection from the settings modal.
- API key configuration for custom endpoints.
- Multi-provider support (Anthropic, Gemini, custom OpenAI-compatible).
- Additional error codes and provider-specific handling.

### Long term

- Publish to GreasyFork with a CDN install URL.

---

## Accessibility

- Animations respect `prefers-reduced-motion`.
- The guided wizard uses semantic buttons with `aria-expanded` and
  `aria-controls`.
- Live regions announce streaming milestones and errors.
- Modals trap focus and restore it on close.
- The loading overlay exposes `role="status"` and a visible cancel button.

WCAG 2.2 AA compliance is a target, not a current guarantee. Accessibility
issues are tracked as bugs.

---

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`.
3. Make your changes. Keep the module structure consistent.
4. Run `npm test` and confirm it passes.
5. Test on at least two of the supported hosts.
6. Open a pull request with a clear description of the change, the
   rationale, and the test cases covered.

For bug reports, please include:

- The chat interface and browser version.
- The input prompt (redacted if sensitive).
- The error code shown in the toast (if any).
- A screenshot of the debug panel if streaming is involved.

---

## License

[MIT](LICENSE) — see the `LICENSE` file for details.

---

## Acknowledgments

- [GSAP](https://gsap.com/) for the animation library used in the loading
  overlay and transitions.
- [OpenRouter](https://openrouter.ai/) for the anonymous free API used as
  the default backend.
- The userscript community for the patterns and conventions that this
  project builds on.
