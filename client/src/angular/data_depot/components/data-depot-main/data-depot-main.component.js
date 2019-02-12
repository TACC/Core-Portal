import DataDepotMainCtrl from './data-depot-main.controller';

const dataDepotMainComponent = {
    template: require("./data-depot-main.template.html"),
    bindings: {
        systems: '<',
        params: '<'
    },
    controller: DataDepotMainCtrl,
};
export default dataDepotMainComponent;
