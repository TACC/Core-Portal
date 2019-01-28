import template from './workspace-root.template.html';
import './workspace.css';

class WorkspaceRootCtrl {
    $onInit () {
        this.selectedApp = null;
    }

    onAppSelect (app) {
        this.selectedApp = app;
    }

}

const workspaceRoot = {
    template: template,
    bindings: {
    },
    controller: WorkspaceRootCtrl,
};

export default workspaceRoot;
