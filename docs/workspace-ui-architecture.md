# Workspace UI Architecture & Settings Refactor

**Status:** Proposed specification  
**Scope:** UI information architecture, interaction model, module boundaries and acceptance criteria  
**Baseline:** `main` after PR #7 (`8c2df35`)  
**Decision:** The Workspace is a first-class project knowledge manager. It is not another manual context source and must not be embedded as a small form inside the existing Context & Language view.

## 1. Goals

1. Separate global application preferences from project knowledge management.
2. Split the current **Context & Language** view into independent responsibilities without changing their underlying behavior unnecessarily.
3. Provide a dedicated Workspace manager for project selection, file discovery, text editing and AI-access controls.
4. Preserve the existing `ProjectContext` workflow as a distinct, user-managed context source.
5. Keep the AI integration read-only. UI actions may mutate Workspace data; Context Resolver and Context Composer may only read and compose it.
6. Reuse the current visual system, theme tokens, SVG atoms, modal shell and localization conventions.
7. Keep the design compatible with the repository's manifest-driven concatenated build.

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

Reuse:
- Existing modal shell and tab primitives.
- Existing `--pe-*` design tokens for surfaces, borders, typography, spacing, radii, focus and semantic feedback.
- Existing light/dark theme support.
- `Atoms.icon()` and `Atoms.button()` for consistent SVG controls.
- `Utils.escapeHtml()` or DOM `textContent` for untrusted file names and project metadata.
- Existing toast and confirmation patterns where suitable.

Do not add a new UI framework, external editor dependency or unrelated design system in this phase.

Visual hierarchy:
1. Project identity and active status.
2. File navigation and selected file.
3. Editing surface.
4. Access inspector and secondary metadata.

Avoid oversized dashboard cards. The Workspace is a practical file-management surface; prioritize density, clear selection, readable text and low-friction editing.

Accessibility requirements:
- Use semantic buttons and labels.
- Provide accessible names for icon-only controls.
- Expose tree/list selection and expanded state with appropriate ARIA attributes.
- Preserve visible keyboard focus.
- Support keyboard navigation between tree items and editor controls.
- Announce loading, save success and errors through the existing accessible feedback mechanism.
- Do not rely on color alone for permission status.

## 8. Module boundaries

The current repository is a manifest-driven concatenated JavaScript application. New source modules must be registered in `manifest.json` with accurate `provides`, `consumes` and `interactions` metadata, and tests must remain outside the production module list.

Recommended initial decomposition:

- `settings-modal.js`: modal shell, tab definitions, navigation, shared footer and lifecycle only.
- `settings-views.js` (or equivalent): focused renderers for Parameters, Manual Context, Response and Interface. Existing System Prompt, History and Provider renderers can remain where they are initially, then be extracted only if the refactor materially simplifies the shell.
- `workspace/workspace-ui.js`: Workspace view composition and state lifecycle.
- `workspace/workspace-project-view.js` and `workspace/workspace-file-view.js`: introduce only if the manager module becomes difficult to maintain; do not split into many tiny modules preemptively.

Workspace UI should receive or use only the public `Workspace` facade plus shared UI primitives. It must not access storage internals. Keep DOM state local to the view and refresh it from the facade after successful mutations.

The action-bar quick-access entry should be integrated through the existing Composer/action-bar extension points, not by making the settings modal depend on Composer internals.

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

### Phase 1 — Settings information architecture
- Replace the `context` tab with `workspace`, `manualContext`, `response` and `interface`.
- Move existing controls without changing their behavior or persistence.
- Update PT-BR and EN translations.
- Preserve active-tab navigation, footer semantics and modal accessibility.
- Add tests or focused verification for the tab routing and existing setting callbacks.

### Phase 2 — Workspace API permission support
- Add validated per-file access mutation.
- Add tests for allowed/denied values, invalid values, missing files and cross-project IDs.
- Keep the Resolver as the source of effective access behavior.

### Phase 3 — Workspace manager shell
- Project selector and project actions.
- Project-level instructions and access mode.
- File explorer with derived folders.
- Loading, empty and error states.

### Phase 4 — File operations
- Create and import text files.
- Load and edit content.
- Save path/content.
- Delete files and projects with confirmation.
- Dirty-draft protection.

### Phase 5 — Composer quick access
- Show active project and useful counts.
- Open the Workspace settings view directly.
- Keep this distinct from manual ProjectContext access.

### Phase 6 — Verification
- Workspace unit tests.
- Settings behavior and localization checks.
- Build/manifest validation.
- CI on supported Node versions (currently Node 22 and 24).
- Manual verification in light/dark themes and narrow/wide modal layouts.

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
14. Build and CI pass on Node 22 and Node 24.

## 13. Explicit non-goals

- Cloud synchronization or remote project storage.
- Git integration.
- Binary assets, image preview or arbitrary file execution.
- AI-generated file modifications.
- Automatic project discovery from the host page.
- Multiple simultaneously active projects.
- File version history, snapshots, diff or restore.
- Replacing ProjectContext with Workspace.
- Introducing a third-party code editor in the first iteration.
