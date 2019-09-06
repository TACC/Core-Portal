import template from './workspace-root.template.html';
import './workspace.css';

class WorkspaceRootCtrl {
    constructor($scope, $stateParams) {
        'ngInject';
        this.$scope = $scope;
        this.$stateParams = $stateParams;
    }
    
    $onInit () {
        this.selectedApp = null;
        this.jobInfo = this.$stateParams.jobInfo;
    }

    onAppSelect (app) {
        app.jobInfo = this.jobInfo;
        this.selectedApp = app;
        // Consume any job info passed to the workspace
        // This prevents someone from attempting to launch
        // a different app with stale job info from the
        // "Re-launch Job" button
        this.jobInfo = null;
    }

}

const workspaceRoot = {
    template: template,
    bindings: {
    },
    controller: WorkspaceRootCtrl,
};

export default workspaceRoot;
