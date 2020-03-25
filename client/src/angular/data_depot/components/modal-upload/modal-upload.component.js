import ModalUploadCtrl from './modal-upload.controller.js';
import template from './modal-upload.template.html';

const modalUploadComponent = {
    template: template,
    controller: ModalUploadCtrl,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export default modalUploadComponent;
