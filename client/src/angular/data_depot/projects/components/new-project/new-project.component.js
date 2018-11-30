import template from './new-project.template.html';
import NewProjectController from './new-project.controller';

const newProjectModal = {
    template: template,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
    controller: NewProjectController
};

export default newProjectModal;
