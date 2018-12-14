import template from './project-meta.template.html';
import css from './project-meta.css';
import ProjectMetadataCtrl from './project-meta.controller.js';

const projectMetadataComponent = {
    template: template,
    controller: ProjectMetadataCtrl,
    bindings: {
        systemId: '<',
    },
};

export default projectMetadataComponent;
