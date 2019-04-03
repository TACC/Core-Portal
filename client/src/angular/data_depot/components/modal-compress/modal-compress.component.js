import ModalCompressCtrl from './modal-compress.controller.js';
import template from './modal-compress.template.html';

const modalCompressComponent = {
    template: template,
    controller: ModalCompressCtrl,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export default modalCompressComponent;
