import template from './edit-project-members.template.html';
import css from './edit-project-members.css';
import projectsComponentsCss from '../projects.components.css'
import EditProjectMembersCtrl from './edit-project-members.controller.js';

const editProjectMembersComponent = {
    template: template,
    controller: EditProjectMembersCtrl,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
};

export default editProjectMembersComponent;
