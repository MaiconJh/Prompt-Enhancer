# Workspace UI Architecture & Settings Refactor

**Status:** Architecture specification with implementation in progress  
**Scope:** UI information architecture, interaction model, module boundaries and acceptance criteria  
**Baseline:** `main` after PR #18 (atomic batch file creation)  
**Decision:** The Workspace is a first-class project knowledge manager. It is not another manual context source and must not be embedded as a small form inside the existing Context & Language view.

## Implementation status

The implementation is being delivered in reviewable stages:

- **PR #18, merged:** atomic `Workspace.files.createMany()` backed by one IndexedDB transaction.
- **PR #19, draft:** editor-first Files surface, modular tree model and explorer, row virtualization, batch/folder/directory-import workflows, editor toolbar, contextual inspector and a focused batch/import controller.
- **Still pending:** full project/file state-transition controller, Monaco ESM runtime and local workers, resizable panel boundaries, bulk selection/actions, and manual verification in the userscript manager.

The current editor view still uses the existing textarea. It is intentionally not described as Monaco until the local build and worker integration are implemented and verified. The controller currently coordinates batch creation and import validation; the broader UI state transitions remain in the composition root for now.

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

### Existing per-file permission API

`Workspace.files.setAccess(projectId, fileId, access)` is already implemented. It accepts only `allowed` or `denied`, verifies that the file belongs to the specified project and persists the change through the Workspace storage layer. Keep permission changes behind this public facade.


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

## 5. Workspace editing environment

The Workspace is an editing environment first and a file manager second. The current small explorer/editor split is rejected. The primary working state must give the editor the largest possible area within the available viewport.

### 5.1 Persistent workspace frame

The frame contains:
- A compact project bar with project selection, project actions and save/dirty status.
- A resizable, collapsible file explorer on the left.
- A flexible editor surface occupying all remaining width and height.
- An optional inspector on the right, closed by default. It contains file metadata, AI access and project/file details.

The editor must not share its available width equally with the explorer. The initial desktop proportion should reserve approximately 18–24% for the explorer and at least 65% for the editor, with a draggable divider and persisted panel width. The inspector is an overlay or collapsible side panel, not a permanently reserved column.

Provide:
- Focus mode: hide explorer and inspector, expand editor to the full workspace width.
- Explorer toggle: collapse/restore the left panel without losing selection or scroll position.
- Inspector toggle: show/hide metadata and access controls without changing the editor draft.
- Responsive mode: on narrow viewports, explorer becomes a drawer or temporary overlay; editor remains primary and must not be placed below a tall tree.
- Viewport-aware height: editor and explorer own their scroll areas rather than growing the whole modal indefinitely.

The four destinations introduced in the first UI pass should not remain four equally prominent tabs competing with file editing. Files is the default and primary Workspace surface. Overview, AI access and Project settings should be contextual panels or secondary destinations reachable from the project bar and inspector.

### 5.2 Editor and file correction

The editor uses Monaco, initialized lazily when the first file is opened. It must provide syntax highlighting, line numbers, search/replace, keyboard navigation, indentation, language selection, themes, explicit save and a visible dirty state.

The editor should make common correction work efficient:
- Keep the full file path visible and editable through a separate path action.
- Show file extension, size, encoding and detected language.
- Show save errors inline with a clear retry path; never clear the draft after a failed save.
- Provide quick access to file-level AI permission and project instructions without forcing navigation away from the editor.
- Preserve cursor/selection and draft when the explorer or inspector is toggled.
- Provide focus mode and a keyboard shortcut to return to the explorer.
- Save through the public Workspace facade only; Monaco models are not the persistence layer.

### 5.3 Explorer actions and batch creation

The explorer toolbar should be compact and contextual: New file, New folder, Create multiple files, Import files, Import directory, Search/filter and Multi-select/bulk actions.

New folder: directories remain derived from file paths, not persisted entities. A folder is materialized when it receives its first file. Do not create hidden placeholder files to simulate empty folders. If the user creates a folder, guide them to add one or more files within that path as part of the same flow.

Create multiple files: provide a batch composer where the user can enter several relative paths and optional initial contents, or paste a structured list of paths. Validate all paths, duplicates, individual file sizes, project file count and total bytes before committing.

Import files: accept multiple UTF-8 text files and let the user choose the destination folder. Keep each incoming file's basename unless the user explicitly opts into preserving relative paths.

Import directory: use directory selection where supported and preserve each file's relative path (for example webkitRelativePath). Show a preflight summary with accepted files, duplicates, invalid paths, unsupported/binary files and size-limit violations before importing.

Batch writes must be atomic at the Workspace API/storage boundary: either all validated files are created or none are. Do not loop over Workspace.files.create() and leave a partially imported project when a later item fails. Add Workspace.files.createMany(projectId, files), backed by one IndexedDB readwrite transaction, with full validation and limit checks inside the authoritative layer. UI preflight improves the preview, but storage must re-check collisions and limits at commit time.

Bulk actions for selected existing files may include delete and change AI access. Destructive actions require confirmation and a summary of the number of affected files.

### 5.4 Tree structure and performance

Do not render a recursive DOM subtree for every directory and file on each refresh. Build a normalized in-memory tree/index from file metadata, sort each directory once, and render a flattened visible-row model based on expanded folders.

The tree must support:
- Collapsible directories, with expansion state retained during file refreshes.
- Search by path/name with matching ancestor directories expanded.
- Keyboard navigation, roving focus, arrow-key expand/collapse and accessible tree semantics.
- Stable selection by file ID, not row index.
- Incremental updates for selection and metadata changes; do not rebuild the entire tree just because the selected file changed.
- Lazy generation of visible descendants for collapsed directories.
- Scroll position preservation when selected file or metadata changes.

Use a virtualized viewport over flattened visible rows when visible row count exceeds a measured threshold (initial target: 300 rows, configurable). Render only the viewport plus a small overscan range. Keep row height predictable, and ensure keyboard focus can scroll an off-screen row into view. Virtualization must not remove selected items from the logical tree or break accessibility.

Current projects are capped at 250 files. Virtualization must be implemented as a scalable path and validated with synthetic deep/wide trees, but must not become premature complexity. First optimize collapsed-folder rendering and incremental updates; activate row virtualization only when the visible-row threshold is exceeded. If the file limit is increased later, the same tree model should scale without redesign.

### 5.5 File and folder persistence semantics

The current Workspace model persists files, not empty directories. Empty directories cannot be represented durably without changing the data model. Keep folders derived from paths in this iteration. Creating a folder is therefore a guided operation that creates the first file(s) under that path. A future explicit directory entity model requires a separate product/data-model decision and migration plan.

ProjectContext remains separate and must not be merged.

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

The visual hierarchy is:
1. Editor and its content.
2. File explorer and project navigation.
3. Optional inspector.
4. Project overview, AI access and settings as secondary surfaces.

Avoid dashboard cards and permanent forms around the editor. Use compact toolbars, contextual menus, side panels and dialogs. Keep the editor canvas visually calm and maximize usable code area.

### Monaco Editor

Use the ESM distribution of monaco-editor, not the deprecated AMD/RequireJS distribution. Monaco must be bundled at build time and shipped locally inside the userscript. Runtime CDN loading, remote workers and external script injection are not acceptable.

The integration must provide:
- Language selection based on file extension, with a safe plaintext fallback.
- Syntax highlighting, line numbers, indentation, bracket matching, editor search/replace, keyboard shortcuts and configurable themes.
- A visible dirty/saved state and explicit save action.
- A minimum usable editor height, responsive resizing and editor-owned scrolling.
- Optional minimap, disabled by default in narrow layouts.
- Proper disposal of editor instances, models and listeners when files or views are changed.
- Lazy initialization when the user first opens a file, not during userscript startup.
- Worker bundles that are local and compatible with the userscript execution environment.

Monaco undo/redo is session-local editor behavior only. Do not persist edit history, snapshots, diffs, restore points or version-based conflict handling.

### Tree and panel interaction

- Explorer width is adjustable and its collapsed state is independent from file selection.
- Focus mode must not discard editor draft, cursor or selection.
- Inspector open/close must not reinitialize Monaco.
- Tree selection is stable by file ID.
- Folder expansion state is preserved across non-structural file updates.
- The tree uses a flattened visible-row model and threshold-based virtualization as defined in Section 5.4.
- Batch import/create flows show a preflight summary and do not partially commit.

### Monaco build boundary

The existing application build concatenates manifest modules and is not an ESM bundler. Do not attempt to concatenate Monaco ESM source directly into that pipeline.

Introduce a dedicated build step for the Monaco entry point and worker bundles. The main build should consume generated artifacts derived from the local dependency tree and embed them into the final userscript. Generated artifacts belong in dist/, never in src/ or the manifest module list. The build must fail clearly if Monaco assets or worker bundles are missing.

The exact bundler and worker transport must be validated against the userscript runtime before implementation is considered complete. No runtime CDN or separately hosted worker files may be assumed.

Accessibility:
- Use semantic controls and accessible names.
- Keep keyboard focus visible and preserve predictable focus when opening/closing dialogs.
- Announce loading, save success and errors through the existing accessible feedback mechanism.
- Do not rely on color alone for permission or dirty-state indicators.
- Provide a usable keyboard path between explorer, editor and inspector.

## 8. Module boundaries

The repository remains a manifest-driven JavaScript userscript. Every runtime source module under src/ must be registered in manifest.json; tests and build scripts remain outside the production module list.

Use pragmatic separation by responsibility:
- workspace/workspace-ui.js: composition root, project bar, panel layout and lifecycle.
- workspace/workspace-controller.js: currently coordinates batch file creation, folder initialization, text import validation and calls to the public Workspace facade. Project/file state transitions and draft decisions remain in workspace-ui.js and are a remaining extraction task.
- workspace/workspace-tree-model.js: normalized directory index and flattened visible-row model; directories remain derived from file paths.
- workspace/workspace-explorer-view.js: tree rendering, search, threshold-based virtualization, selection and keyboard navigation.
- workspace/workspace-editor-view.js: editor surface, save/delete controls, explorer/inspector toggles and focus mode. The current input is a textarea; Monaco lifecycle and model synchronization are future work.
- workspace/workspace-inspector-view.js: composes AI-access and project-settings sections into an optional contextual panel. File metadata can be added here when the editor integration is completed.
- workspace/workspace-dialogs.js: batch creation/import preflight and destructive confirmations, only if shared dialog behavior warrants a separate module.

Do not split every button, dialog or helper into a module. Overview, project settings and AI access do not need permanent full-page views if they fit naturally into the inspector or project menu.

Views render state and emit intent. The controller owns state transitions and mutations. Keep the controller independent of Monaco APIs and DOM tree internals. The editor view receives the selected file, current draft and callbacks; it must never access IndexedDB or mutate Workspace data directly.

All data reads and writes must use the public Workspace facade. UI code must not access IndexedDB, WorkspaceStorage, ProjectManager or FileRegistry. The AI-facing Context Resolver and Composer remain read-only.

The existing settings-modal.js remains responsible for the modal shell and tab routing. It should mount WorkspaceUI and not own Workspace project/file state.

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

### Phase 1 — Rework the interaction model and layout
- Make Files the primary Workspace surface and remove the four-tab dashboard-like navigation from the editing flow.
- Establish the persistent project bar, resizable/collapsible explorer, flexible editor and optional inspector.
- Add focus mode and responsive explorer drawer behavior.
- Keep project overview, AI access and project settings as contextual surfaces.
- Preserve all current data operations and dirty-draft protections.

### Phase 2 — Controller and view boundaries
- Move project/file state transitions and mutations into WorkspaceController.
- Extract explorer, editor and inspector responsibilities.
- Ensure views emit intent and the controller coordinates Workspace API operations.
- Keep the controller independent of Monaco and DOM tree internals.

### Phase 3 — Tree model and scalable navigation
- Build a normalized directory index and flattened visible-row model.
- Add collapsed folders, path search, keyboard navigation and incremental updates.
- Add threshold-based virtualization with overscan and synthetic deep/wide tree tests.
- Preserve selected file, expanded folders and scroll position across updates.

### Phase 4 — Batch folders, files and imports
- Add a batch file composer and destination-folder selection.
- Add directory import with relative-path preservation and preflight conflict reporting.
- Add atomic Workspace.files.createMany() backed by a single IndexedDB transaction.
- Add multi-select and safe bulk actions.
- Test duplicate paths, project file count and byte limits, invalid UTF-8 and all-or-nothing rollback.

### Phase 5 — Monaco build integration
- Add a pinned monaco-editor dependency and a dedicated build dependency.
- Implement the dedicated ESM build and worker packaging.
- Embed editor runtime and worker sources into the generated userscript without runtime network access.
- Verify the final userscript runs in the supported userscript manager environment.
- Add build assertions for editor and worker artifacts.

### Phase 6 — Monaco editor experience
- Replace the textarea with Monaco.
- Add extension-based language detection, themes, dirty-state integration, explicit save and editor disposal.
- Preserve draft contents on failed save, file switching and project switching.
- Keep file path and metadata editing outside the Monaco text model.
- Keep undo/redo local to the editor session; do not add persistent history.
- Verify focus mode, panel resizing and responsive editor sizing.

### Phase 7 — Inspector, accessibility and refinement
- Present file metadata and effective AI access without reducing the editor's default width.
- Add contextual project settings and access controls.
- Refine keyboard navigation, focus management, themes, localization and responsive behavior.

### Phase 8 — Verification
- Workspace unit and UI tests.
- Atomic batch-storage tests and tree performance tests.
- Build/manifest validation, including Monaco worker packaging.
- CI on supported Node versions (currently Node 22 and 24).
- Manual verification in the actual userscript runtime, light/dark themes, narrow/wide layouts, and representative text/code file types.

Each phase should be independently reviewable. Create draft PRs for substantial phases and do not merge without explicit authorization.

## 12. Acceptance criteria

The refactor is ready when:
1. Files is the primary Workspace surface and the editor receives the majority of available width and height.
2. Explorer and inspector can be collapsed independently without losing editor draft, cursor or selection.
3. Focus mode expands the editor and can be exited with keyboard and visible controls.
4. Project overview, AI access and project settings remain accessible without permanently consuming editor space.
5. Users can create one file, create multiple files in one operation, create folder paths with initial files, import multiple files and import a directory while preserving relative paths.
6. Batch file creation/import is atomic; duplicate paths, invalid text, per-file size, project count and total-byte limits are checked before commit and again by the Workspace layer.
7. The UI reports conflicts and rejected files before committing a batch; it does not leave partial imports.
8. Empty folders are not falsely represented as persisted entities; folder persistence semantics are clearly communicated.
9. The tree supports collapsed folders, path search, stable selection, keyboard navigation and incremental updates.
10. Large visible trees use threshold-based virtualization with overscan, stable row identity and keyboard accessibility.
11. Tree tests cover wide and deeply nested synthetic projects; current 250-file limit is considered when selecting the virtualization threshold.
12. All UI mutations use the public Workspace facade, including the new atomic batch operation.
13. Resolver/Composer remain read-only.
14. No versioning, snapshots, diffs or restore mechanisms are introduced.
15. PT-BR and EN are complete for every new label, status, validation and error.
16. Monaco is bundled locally with its required workers and does not load runtime assets from a CDN.
17. Monaco is created lazily, disposed when no longer needed and keeps unsaved drafts after failed saves.
18. Editor undo/redo remains session-local; no persistent history or snapshots are introduced.
19. Build and CI pass on Node 22 and Node 24.
20. The final userscript is manually verified in the supported userscript manager at wide and narrow viewport sizes.

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
