import template from './project_meta.template.html';
import ProjectMetadataCtrl from './project_meta.controller.js';

const projectMetadataComponent = {
    template: template,
    controller: ProjectMetadataCtrl,
    bindings: {
        systemId: '<',
    },
};

export default projectMetadataComponent;
