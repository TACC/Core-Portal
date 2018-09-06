import template from './member-search.template.html';
import ProjectMemberSearchCtrl from './member-search.controller.js';

const projectMemberComponent = {
    template: template,
    controller: ProjectMemberSearchCtrl,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
};

export default projectMemberComponent;
