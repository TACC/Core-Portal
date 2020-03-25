import DataDepotNewCtrl from './data-depot-new.controller';

const dataDepotNewComponent = {
    template: require("./data-depot-new.template.html"),
    bindings: {
        params: '<',
    },
    controller: DataDepotNewCtrl,
};
export default dataDepotNewComponent;
