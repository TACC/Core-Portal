import ModalPublicUrlCtrl from './modal-public-url.controller';
import template from './modal-public-url.template.html';

const modalPublicUrlComponent = {
    template: template,
    controller: ModalPublicUrlCtrl,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export default modalPublicUrlComponent;