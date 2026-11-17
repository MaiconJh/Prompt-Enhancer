// ===== src/workspace/workspace-ui.js =====
// Public compatibility boundary. The production workspace is rendered by the
// mock-backed view while the existing settings-modal API remains unchanged.
const WorkspaceUI = (() => {
    function render(container, options = {}) {
        return WorkspaceMockUI.render(container, options);
    }
    return Object.freeze({ render });
})();
