import template from './edit-project-metadata.template.html';
import EditProjectMetadataCtrl from './edit-project-metadata.controller.js';

const editProjectMetadataComponent = {
    template: template,
    controller: EditProjectMetadataCtrl,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
};

export default editProjectMetadataComponent;
