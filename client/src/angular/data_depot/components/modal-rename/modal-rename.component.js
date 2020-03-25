import ModalRenameCtrl from './modal-rename.controller.js';
import template from './modal-rename.template.html';

const modalRenameComponent = {
    template: template,
    controller: ModalRenameCtrl,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export default modalRenameComponent;
