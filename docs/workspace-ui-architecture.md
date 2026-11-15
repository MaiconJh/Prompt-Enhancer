# Workspace UI Architecture & Settings Refactor

**Status:** Proposed specification  
**Scope:** UI information architecture, interaction model, module boundaries and acceptance criteria  
**Baseline:** `main` after PR #14 (`73f4a78`)  
**Decision:** The Workspace is a first-class project knowledge manager. It is not another manual context source and must not be embedded as a small form inside the existing Context & Language view.

## 1. Goals

1. Separate global application preferences from project knowledge management.
2. Split the current **Context & Language** view into independent responsibilities without changing their underlying behavior unnecessarily.
3. Provide a dedicated Workspace manager for project selection, file discovery, text editing and AI-access controls.
4. Preserve the existing `ProjectContext` workflow as a distinct, user-managed context source.
5. Keep the AI integration read-only. UI actions may mutate Workspace data; Context Resolver and Context Composer may only read and compose it.
6. Reuse the current visual system, theme tokens, SVG atoms, modal shell and localization conventions.
7. Preserve the existing userscript runtime and manifest-driven application build while introducing a dedicated, locally bundled ESM build for Monaco and its workers.

## 2. Current baseline and constraints

The settings modal currently has five tabs: `params`, `context`, `systemPrompt`, `history` and `provider`. The `context` renderer currently combines:

- Active Workspace project selection and basic project creation.
- ProjectContext status and a link to its existing manager.
- UI language.
- Theme.
- Response language and response persona.

PR #7 has been merged into `main`. The active Workspace project is persisted through `Workspace.getActiveProjectId()` / `Workspace.setActiveProjectId()`, and the orchestration layer resolves and composes context from that project before enhancement.

### Existing public Workspace API

After `Workspace.init()`, the UI can use:

- `Workspace.projects.list()`, `get(id)`, `create(input)`, `update(id, changes)`, `remove(id)`.
- `Workspace.files.list(projectId)`, `get(projectId, fileId)`, `create(projectId, input)`, `update(projectId, fileId, changes)`, `remove(projectId, fileId)`.
- `Workspace.getActiveProjectId()` and `Workspace.setActiveProjectId(idOrNull)`.

The UI must use this public facade. It must not access IndexedDB, `WorkspaceStorage`, `ProjectManager` or `FileRegistry` directly.

### Existing data constraints

- Files are UTF-8 text, not binary assets.
- Maximum file size: 1 MiB.
- Maximum files per project: 250.
- Maximum total project file size: 20 MiB.
- File paths are relative, normalized, and may contain nested directories.
- Project instructions are limited to 20,000 characters.
- New files default to `aiAccess: 'denied'`.
- Project access modes are `none`, `selected` and `all`.

The UI should display useful limits and validate early, but the Workspace layer remains authoritative.

### Known API gap to resolve before access controls ship

The current `FileRegistry.update()` updates path, content and MIME type, but does not persist `aiAccess`. The current public facade therefore cannot safely support per-file permission editing yet.

Before implementing the permission control, extend the Workspace API with a narrowly validated operation, preferably `Workspace.files.setAccess(projectId, fileId, access)`, accepting only `allowed` or `denied`. Add tests for invalid values, wrong-project file IDs and successful updates. Do not silently treat a UI-only toggle as persisted permission.

## 3. Information architecture

Replace the single `context` settings tab with four tabs, each owning one responsibility.

| Tab key | Label | Responsibility |
| --- | --- | --- |
| `params` | Parameters | Generation parameters and presets |
| `workspace` | Workspace | Project and project-file management |
| `manualContext` | Manual context | Existing ProjectContext summary and management entry point |
| `response` | Response | Response language, persona and custom persona |
| `interface` | Interface | UI language and appearance/theme |
| `systemPrompt` | System Prompt | Global enhancement instructions and personal presets |
| `history` | History | Existing enhancement history |
| `provider` | Provider | Provider and model configuration |

The tab key `context` should no longer be the active key after migration. If the modal receives a stale persisted/in-memory tab key `context`, route it to `manualContext` or `workspace` according to the explicit navigation entry point; do not silently drop the user into an unrelated tab. Since the current active tab is local modal state, default fallback can remain `params`.

### Responsibility boundaries

**Workspace**
- Select and create projects.
- Rename and delete projects.
- Edit project description and project instructions.
- Configure project-wide AI access mode.
- Import and create text files.
- Browse paths as a derived directory tree.
- Edit file content and path.
- Configure per-file AI access.
- Delete files.

**Manual context**
- Show the existing ProjectContext enabled state, active-file count and size.
- Preserve the existing button that opens the current Composer context manager.
- Do not copy, migrate or merge ProjectContext files into Workspace.
- Do not change ProjectContext storage or injection behavior as part of this UI refactor.

**Response**
- Own `response_language`, `response_persona` and `response_persona_custom`.
- Preserve existing ParamSchema validation, dirty-state handling and save semantics.

**Interface**
- Own UI language and theme.
- Preserve current I18n and Theme APIs and their immediate-application behavior.

**Parameters, System Prompt, History and Provider**
- Preserve current behavior. Any renderer extraction must not alter their data contracts.

## 4. Access points

### Primary entry point

Settings modal → **Workspace** tab.

This is the complete management interface. The tab should be visible in the settings navigation, not hidden behind the existing ProjectContext button.

### Secondary entry point

Composer action bar → dedicated **Workspace** quick-access control, placed near (but visually distinct from) the existing manual-context control.

The quick-access surface should show:
- Active project name, or an explicit “No active project” state.
- Project file count when available.
- Accessible file count when available.
- A clear action to open Settings directly on the Workspace tab.

The quick-access surface is informational and navigational. It must not become a second project/file editor. It must not reuse the manual-context button or imply that Workspace and ProjectContext are the same source.

If adding a new action-bar control would make the bar overcrowded on narrow host pages, use a compact menu item inside the existing settings/context overflow area rather than adding a permanently visible full-width control.

## 5. Workspace manager layout

The Workspace tab uses a dedicated three-region layout inside the existing modal content area.

### A. Project header

Contains:
- Project selector.
- Create project action.
- Project actions menu: rename, delete.
- Short project description or empty-state message.
- Project-level AI access mode.
- Optional project instructions editor, collapsible to avoid competing with file editing.

Project selection is global to the user and persists using the existing active-project API. Creating a project should select it only after creation succeeds.

Deleting the active project must:
1. Require explicit confirmation that project files will also be deleted.
2. Delete through `Workspace.projects.remove(id)`.
3. Clear the active selection through `Workspace.setActiveProjectId(null)`.
4. Refresh the project list and show the empty state.

### B. File explorer

Contains:
- A compact hierarchical tree.
- Directories derived from file paths; directories are not separate persisted entities.
- Create file and import text files actions.
- File name and extension.
- Visible per-file access indicator.
- Empty, loading and error states.

The explorer should sort folders before files, then sort names consistently. Selecting a file loads its content in the editor. The tree must not imply that empty directories persist.

Import behavior:
- Accept text files only.
- Read as text and validate with the Workspace file validation rules.
- Preserve relative paths only when the user explicitly chooses a directory structure or import mapping; otherwise import at the project root.
- Detect duplicate paths before submission and report conflicts clearly.
- Never execute imported content.
- Reject binary-like content and over-limit files with actionable errors.

### C. File editor and inspector

Contains:
- File path/name field.
- Text editor using the existing monospace token and code surface.
- File size and extension metadata.
- Explicit save action or a clearly communicated autosave model. For the first implementation, prefer explicit save to avoid accidental writes while typing.
- Delete action with confirmation.
- Per-file AI access control.

The editor should keep a local unsaved draft. Switching files while dirty must ask whether to save, discard, or cancel. A failed save must preserve the draft and display the error. Do not introduce snapshots, history, diffs, restore points or version-based conflict handling.

### Responsive behavior

- Desktop/wide modal: explorer and editor side by side; project header spans the content width.
- Narrow modal: explorer becomes a top section or collapsible pane, editor occupies the remaining width.
- Avoid horizontal overflow. The editor should have a usable minimum height and its own scroll area.
- Keep destructive actions in contextual menus or separated from primary save/create actions.

## 6. Permission model and explanation

The project-wide mode and per-file setting must be shown together because the effective permission is their combination.

| Project mode | File `aiAccess` | Effective Resolver access |
| --- | --- | --- |
| `none` | either value | Denied |
| `all` | either value | Allowed |
| `selected` | `allowed` | Allowed |
| `selected` | `denied` or missing | Denied |

Use user-facing labels:
- `none`: No files available to AI.
- `selected`: Only individually allowed files.
- `all`: All project files available to AI.

When mode is `none` or `all`, the per-file control may remain visible but must explain that the project-wide setting currently overrides it. Alternatively, disable the control with a clear explanation. Do not display a misleading enabled/disabled state.

The UI must reflect the Resolver's actual access behavior, not implement a second independent permission evaluator that can drift from it.

## 7. Visual and interaction system

The Workspace becomes a focused project-management workspace with four primary destinations:

1. **Overview** — active project identity, file totals, storage usage, access summary and recent state. This is a compact operational overview, not a dashboard full of decorative cards.
2. **Files** — hierarchical explorer, file operations and the editing environment.
3. **AI access** — project-wide mode, per-file permissions and effective-access explanations.
4. **Project settings** — project name, description and instructions.

The file editing environment is a dedicated workspace state within Files. It should prioritize editor space and may collapse or temporarily replace the explorer on narrow layouts. Create/import/rename/delete actions should open contextual dialogs or compact panels instead of permanently occupying the editor surface.

Reuse the existing design tokens, modal shell, theme support, SVG atoms, toast patterns and localization. Do not introduce a second design system or a new application framework.

### Monaco Editor

Use the ESM distribution of `monaco-editor`, not the deprecated AMD/RequireJS distribution. Monaco must be bundled at build time and shipped locally inside the userscript. Runtime CDN loading, remote workers and external script injection are not acceptable.

The integration must provide:
- Language selection based on the file extension, with a safe plaintext fallback.
- Syntax highlighting, line numbers, indentation, bracket matching, editor search and replace, keyboard shortcuts and configurable themes.
- A visible dirty/saved state and explicit save action.
- A minimum usable editor height, responsive resizing and editor-owned scrolling.
- Optional minimap, disabled by default in narrow layouts.
- Proper disposal of editor instances, models and listeners when files or views are changed.
- Lazy initialization when the user first opens a file, not during userscript startup.
- Worker bundles that are local and compatible with the userscript execution environment.

Monaco's undo/redo stack is session-local editor behavior only. Do not persist edit history, snapshots, diffs, restore points or version-based conflict handling.

### Monaco build boundary

The existing application build concatenates manifest modules and is not an ESM bundler. Do not attempt to concatenate Monaco's ESM source directly into that pipeline.

Introduce a dedicated build step for the Monaco entry point and worker bundles. The main build should consume generated, version-controlled-source-derived build artifacts from the local dependency tree and embed them into the final userscript. The generated artifacts belong in `dist/`, never in `src/` or the manifest module list. The build must fail clearly if Monaco assets or worker bundles are missing.

The exact bundler and worker transport must be validated against the userscript runtime before implementation is considered complete. No runtime CDN or separately hosted worker files may be assumed.

Accessibility:
- Use semantic controls and accessible names.
- Keep keyboard focus visible and preserve predictable focus when opening/closing dialogs.
- Announce loading, save success and errors through the existing accessible feedback mechanism.
- Do not rely on color alone for permission or dirty-state indicators.
- Provide a usable keyboard path between explorer, editor and inspector.

## 8. Module boundaries

The repository remains a manifest-driven JavaScript userscript. Every runtime source module under `src/` must be registered in `manifest.json`; tests and build scripts remain outside the production module list.

Use pragmatic separation by responsibility:

- `workspace/workspace-ui.js`: composition root, navigation between Workspace destinations and lifecycle of the active view.
- `workspace/workspace-controller.js`: state and transitions, project/file operations, dirty-draft decisions, error normalization and calls to the public Workspace facade.
- `workspace/workspace-overview-view.js`: overview rendering and summary states.
- `workspace/workspace-explorer-view.js`: tree rendering, selection and file actions.
- `workspace/workspace-editor-view.js`: Monaco lifecycle, editor options, model synchronization and editor events.
- `workspace/workspace-access-view.js`: global and per-file AI access controls, including effective-access explanations.
- `workspace/workspace-project-settings-view.js`: project metadata and instructions.

Do not create a separate module for every button, dialog or helper. Views should render and emit intent; the controller owns mutations and state transitions. Keep the controller independent of Monaco APIs. The editor view receives the selected file, current draft and callbacks, and must never access IndexedDB or mutate Workspace data directly.

All data reads and writes must use the public `Workspace` facade. UI code must not access IndexedDB, `WorkspaceStorage`, `ProjectManager` or `FileRegistry`. The AI-facing Context Resolver and Composer remain read-only.

The existing `settings-modal.js` remains responsible for the modal shell and tab routing. It should mount `WorkspaceUI` and not own Workspace project/file state.

### Persistence ownership

- Workspace projects/files: IndexedDB through Workspace API.
- Active project ID: existing userscript preference key and Workspace selection API.
- UI language: I18n API.
- Theme: Theme API.
- Response preferences and generation parameters: existing ParamSchema/configuration storage.
- Manual context: existing ProjectContext storage.

Do not consolidate these stores as part of the visual refactor.

## 9. State model and user feedback

The Workspace view must explicitly model:
- `initializing`
- `loading-projects`
- `no-projects`
- `project-ready`
- `loading-files`
- `no-files`
- `file-selected-clean`
- `file-selected-dirty`
- `saving`
- `operation-error`

These are UI states, not new persisted Workspace statuses.

Important transitions:
- Workspace initialization failure: show retry; do not silently show an empty project list.
- No active project: show project creation/selection empty state.
- Project has no files: show import/create guidance.
- File selected: load full file via `Workspace.files.get()`; metadata from list is not enough to populate editor content.
- Save success: replace the selected metadata/content with the returned persisted result and clear dirty state.
- Save failure: retain draft and dirty state.
- File delete success: clear selection and refresh tree.
- Project delete success: clear selection and active project if applicable.

Avoid treating failed reads as proof that a project or file does not exist.

## 10. API and security requirements

- All user-triggered writes originate in UI controls and call the public Workspace API.
- Resolver and Composer remain read-only.
- Do not expose create/update/remove methods to any AI-facing tool or prompt.
- Treat imported file contents as untrusted reference data.
- Escape metadata in generated markup; prefer DOM APIs and `textContent`.
- Validate path and text constraints in the Workspace layer even when the UI pre-validates.
- Ensure file operations always include the selected project ID and cannot cross project boundaries.
- Confirm destructive project/file deletion.
- Do not add versioning, snapshots, diffs, restore, rollback or history features.

## 11. Delivery sequence

### Phase 1 — Workspace shell and navigation
- Replace the monolithic always-visible form with the four destinations: Overview, Files, AI access and Project settings.
- Add clear empty, loading, error and no-active-project states.
- Keep the active project selector accessible from the shell.
- Preserve all existing project/file operations and dirty-draft protections during the transition.
- Add tests for navigation, view mounting and state preservation.

### Phase 2 — Controller and view boundaries
- Move project/file state transitions and mutations into `WorkspaceController`.
- Extract overview, explorer, access and project-settings views.
- Keep view modules focused on rendering and user intent.
- Keep the controller independent of Monaco and the UI framework.

### Phase 3 — Monaco build integration
- Add a pinned `monaco-editor` dependency and a dedicated build dependency.
- Implement the dedicated ESM build and worker packaging.
- Embed the editor runtime and worker sources into the generated userscript without runtime network access.
- Verify the final userscript runs in the supported userscript manager environment.
- Add build assertions for editor and worker artifacts.

### Phase 4 — Monaco editor experience
- Replace the textarea with Monaco.
- Add extension-based language detection, themes, dirty-state integration, explicit save and editor disposal.
- Preserve draft contents on failed save, file switching and project switching.
- Keep file path and metadata editing outside the Monaco text model.
- Keep undo/redo local to the editor session; do not add persistent history.

### Phase 5 — Explorer and contextual interactions
- Refine tree navigation, keyboard behavior and selected-file states.
- Move create/import/rename/delete operations into contextual dialogs or panels.
- Improve file metadata, empty states and responsive behavior.
- Verify project and file destructive operations retain confirmation and dirty-draft protection.

### Phase 6 — Access inspector and refinement
- Present global and per-file permissions together.
- Explain effective access and disabled/overridden states.
- Refine responsive layout, focus management, light/dark themes and localization.

### Phase 7 — Verification
- Workspace unit and UI tests.
- Build/manifest validation, including Monaco worker packaging.
- CI on supported Node versions (currently Node 22 and 24).
- Manual verification in the actual userscript runtime, light/dark themes, narrow/wide layouts, and representative text/code file types.

Each phase should be independently reviewable. Create draft PRs for substantial phases and do not merge without explicit authorization.

## 12. Acceptance criteria

The refactor is ready when:

1. No Workspace project selector or project-creation form remains inside Manual Context.
2. UI language and theme exist only in Interface.
3. Response language and persona exist only in Response.
4. ProjectContext remains independent and its existing manager still opens correctly.
5. Workspace has a dedicated settings entry and a usable project/file manager.
6. Users can create, import, edit, save and delete supported text files.
7. The UI can change project-level access mode and per-file access, with effective access matching ContextResolver.
8. Active project selection persists across modal reopen/reload.
9. A missing or inaccessible file is reported accurately and never represented as an empty file without explanation.
10. All UI mutations use the public Workspace facade.
11. Resolver/Composer remain read-only.
12. No versioning, snapshots, diffs or restore mechanisms are introduced.
13. PT-BR and EN are complete for every new label, status, validation and error.
14. Monaco is bundled locally with its required workers and does not load runtime assets from a CDN.\n15. The Monaco editor is created lazily, disposed when no longer needed and keeps unsaved drafts after failed saves.\n16. Editor undo/redo remains session-local; no persistent history or snapshots are introduced.\n17. Build and CI pass on Node 22 and Node 24.

## 13. Explicit non-goals

- Cloud synchronization or remote project storage.
- Git integration.
- Binary assets, image preview or arbitrary file execution.
- AI-generated file modifications.
- Automatic project discovery from the host page.
- Multiple simultaneously active projects.
- File version history, snapshots, diff or restore.
- Persistent editor undo history or restore points.
- Replacing ProjectContext with Workspace.
- Runtime CDN loading or remote Monaco workers.
- Introducing a new UI framework or unrelated design system.
