import DataViewCtrl from './data-view.controller';

const dataViewComponent = {
    template: require("./data-view.template.html"),
    bindings: {
        params: '<',
    },
    controller: DataViewCtrl,
};
export default dataViewComponent;
