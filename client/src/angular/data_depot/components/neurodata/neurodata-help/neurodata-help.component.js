import NeurodataHelpTemplate from './neurodata-help.template.html'
class NeurodataHelpCtrl {
    constructor() {
    }
}

const NeurodataHelpModal = {
    template: NeurodataHelpTemplate,
    controller: NeurodataHelpCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
}

export default NeurodataHelpModal