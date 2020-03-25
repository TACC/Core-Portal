import ModalPreviewCtrl from './modal-preview.controller.js';
import template from './modal-preview.template.html';

const modalPreviewComponent = {
    template: template,
    controller: ModalPreviewCtrl,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export default modalPreviewComponent;
