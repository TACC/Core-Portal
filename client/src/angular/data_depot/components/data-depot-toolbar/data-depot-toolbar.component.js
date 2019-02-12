import DataDepotToolbarCtrl from './data-depot-toolbar.controller';

const dataDepotToolbarComponent = {
    template: require("./data-depot-toolbar.template.html"),
    bindings: {
        params: '<',
    },
    controller: DataDepotToolbarCtrl,
};
export default dataDepotToolbarComponent;
