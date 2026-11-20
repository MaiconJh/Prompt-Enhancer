import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const projects = await readFile(new URL('../workspace/projects-main.js', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../workspace/workspace-ui.js', import.meta.url), 'utf8');
const settings = await readFile(new URL('../settings-modal.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../styles.js', import.meta.url), 'utf8');
const workspaceStyles = await readFile(new URL('../workspace/workspace-styles.js', import.meta.url), 'utf8');
const manifest = await readFile(new URL('../../manifest.json', import.meta.url), 'utf8');
const i18n = await readFile(new URL('../i18n.js', import.meta.url), 'utf8');

test('navigation modules and dictionaries have valid JavaScript syntax', () => {
    for (const source of [projects, workspace, settings, styles, i18n]) assert.doesNotThrow(() => new Function(source));
    assert.doesNotThrow(() => JSON.parse(manifest));
});

test('Projects Main uses the public Workspace facade for project operations', () => {
    assert.match(projects, /Workspace\.projects\.list\(\)/);
    assert.match(projects, /Workspace\.projects\.create\(/);
    assert.match(projects, /Workspace\.projects\.update\(/);
    assert.match(projects, /Workspace\.projects\.remove\(/);
    assert.doesNotMatch(projects, /indexedDB|localStorage|WorkspaceStorage|ProjectManager/);
});

test('Projects Main provides search, sorting, empty states, and project actions', () => {
    for (const token of ['type = \'search\'', 'sortRecent', 'sortName', 'sortCreated', 'noResults', 'renamePrompt', 'deleteMessage']) {
        assert.ok(projects.includes(token), token + ' must remain available');
    }
});

test('Workspace is scoped to the selected project and exposes guarded return navigation', () => {
    assert.match(workspace, /function render\(container,\s*options\s*=\s*\{\}\)/);
    assert.match(workspace, /const WorkspaceUI = /);
    assert.match(workspace, /activeProjectId=Workspace\.getActiveProjectId\(\)/);
    assert.match(workspace, /projectId=options\.projectId\?\?activeProjectId/);
    assert.match(workspace, /projectId==null\|\|projectId===''/);
    assert.match(workspace, /options\.onBack\?\.\(\)/);
    assert.match(workspace, /canLeave,/);
    assert.match(workspace, /function canLeave\(/);
});

test('modal reuses one shell and preserves one Workspace session per project', () => {
    assert.match(settings, /const workspaceSessions = new Map\(\)/);
    assert.match(settings, /workspaceSessions\.get\(projectId\)/);
    assert.match(settings, /bodyEl\.appendChild\(session\.root\)/);
    assert.match(settings, /if \(session && !\(await session\.canLeave\(\)\)\)/);
    assert.match(settings, /function showProjectsMain\(\)/);
});

test('modal dimensions match the Projects Main and Workspace reference sizes', () => {
    assert.match(styles, /\.pe-modal\.is-projects-main\s*\{[^}]*width:\s*min\(1180px/);
    assert.match(styles, /\.pe-modal\.is-projects-main\s*\{[^}]*height:\s*min\(860px/);
    assert.match(styles, /\.pe-modal\.is-workspace-expanded\s*\{[^}]*width:\s*min\(1280px/);
    assert.match(styles, /\.pe-modal\.is-workspace-expanded\s*\{[^}]*height:\s*min\(900px/);
    assert.match(styles, /prefers-reduced-motion:\s*reduce/);
});


test('toasts globais e do Workspace ficam no canto inferior direito da viewport, fora do modal', () => {
    assert.match(styles, /\.pe-toast\s*\{[^}]*right:\s*18px;[^}]*left:\s*auto;/s);
    assert.match(workspace, /const toastHost=\$\('\[data-toasts\]'\)[\s\S]*?document\.body\.appendChild\(toastHost\)/);
    assert.match(workspace, /toastHost\?\.remove\(\)/);
    assert.match(workspaceStyles, /\.pe-workspace-toast-stack\{[^}]*position: fixed; right: 24px; bottom: 24px; left: auto;/);
    assert.match(workspaceStyles, /\.pe-workspace-toast\{/);
});

test('Projects Main is registered and localized in both supported languages', () => {
    assert.ok(manifest.includes('"file": "workspace/projects-main.js"'));
    assert.ok(manifest.includes('"ProjectsMain"'));
    for (const key of ['sm.projects.title', 'sm.projects.heading', 'sm.projects.createPrompt', 'sm.projects.sortRecent']) {
        assert.equal(i18n.split('"' + key + '"').length - 1, 2, key + ' must exist in PT-BR and EN');
    }
});


test('Workspace expõe ações pendentes diretamente na Status Bar', () => {
    assert.match(workspace, /function renderStatusActions\(\)/);
    assert.match(workspace, /const pendingState=\(\)=>/);
    assert.match(workspace, /fileCount:dirty\.size/);
    assert.match(workspace, /savePending:savePendingChanges/);
    assert.match(workspace, /discardPending:discardPendingChanges/);
    assert.match(workspace, /restoreDefaults:restoreSettingsDefaults/);
    assert.match(workspace, /data-status-actions/);
    assert.doesNotMatch(workspace, /options\.onPendingChange/);
    assert.doesNotMatch(settings, /renderWorkspaceFooter|pe-workspace-footer-actions/);
    assert.match(settings, /if \(workspaceRoute\) footerEl\.remove\(\)/);
});

test('Status Bar coordena salvar, descartar e restaurar sem alterar as operações de domínio', () => {
    assert.match(workspace, /const hasPending=\(\)=>dirty\.size>0\|\|aiDirty\(\)\|\|settingsDirty\(\)/);
    assert.match(workspace, /const fileOk=await saveAllFiles\(\),aiOk=aiDirty\(\)\?await saveAi\(true\):true,settingsOk=settingsDirty\(\)\?await saveSettings\(true\):true/);
    assert.match(workspace, /discardAllFiles\(\);if\(aiDirty\(\)\)resetAi\(\);if\(settingsDirty\(\)\)resetSettings\(\)/);
    assert.match(workspace, /if\(state\.canRestore\)add\('Restaurar padrões'/);
    assert.match(workspace, /add\('Descartar'/);
    assert.match(workspace, /add\(headerActionBusy==='save'\?'Salvando…':'Salvar'/);
});

test('Restore defaults is separate and appears only when Settings can actually restore defaults', () => {
    assert.match(workspace, /WorkspaceModel\.DEFAULT_PROJECT_SETTINGS/);
    assert.match(workspace, /WorkspaceModel\.DEFAULT_PROJECT_CONFIG/);
    assert.match(workspace, /function canRestoreDefaults\(\)\{return activeView==='settings'&&!settingsAtDefaults\(\)&&!headerActionBusy;\}/);
    assert.match(workspace, /restoreDefaults:restoreSettingsDefaults/);
    assert.match(settings, /if \(state\?\.canRestore\) addAction\('Restaurar padrões', 'restore'\)/);
});

test('Workspace navigation remains blocked while centralized save/discard operations are running', () => {
    assert.match(workspace, /function canLeave\(\)\{if\(headerActionBusy\)return Promise\.resolve\(false\)/);
    assert.match(workspace, /headerActionBusy='save';updateHeader\(\)/);
    assert.match(workspace, /headerActionBusy='discard';updateHeader\(\)/);
});
