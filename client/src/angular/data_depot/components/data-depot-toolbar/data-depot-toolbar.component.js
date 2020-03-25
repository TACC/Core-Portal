import DataDepotToolbarCtrl from './data-depot-toolbar.controller';
import './data-depot-toolbar.css';

const dataDepotToolbarComponent = {
    template: require("./data-depot-toolbar.template.html"),
    bindings: {
        params: '<',
    },
    controller: DataDepotToolbarCtrl,
};
export default dataDepotToolbarComponent;
