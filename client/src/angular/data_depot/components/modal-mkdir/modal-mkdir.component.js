import ModalMakeDirCtrl from './modal-mkdir.controller.js';
import template from './modal-mkdir.template.html';

const modalMakeDirComponent = {
    template: template,
    controller: ModalMakeDirCtrl,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export default modalMakeDirComponent;
