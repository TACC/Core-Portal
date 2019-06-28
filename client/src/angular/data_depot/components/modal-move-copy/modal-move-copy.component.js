import ModalMoveCopyCtrl from './modal-move-copy.controller.js';

const modalMoveCopyComponent = {
    template: require('./modal-move-copy.template.html'),
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
    controller: ModalMoveCopyCtrl,
};

export default modalMoveCopyComponent;
