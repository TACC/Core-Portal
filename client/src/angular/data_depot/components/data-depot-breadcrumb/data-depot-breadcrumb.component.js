import DataDepotBreadcrumbCtrl from './data-depot-breadcrumb.controller';
/*
interface for params: 
{
    systemId: string;
    filePath: string; //expects leading slash
    customRoot: {
        name: string;
        system: string;
        path: string;
    }
}
*/
const dataDepotBreadcrumbComponent = {
    template: require("./data-depot-breadcrumb.template.html"),
    bindings: {
        skipRoot: '<',
        skipPath: '<',
        project: '<',
        onBrowse: '&',
        onBrowseProjectRoot: '&',
        params: '<'
    },
    controller: DataDepotBreadcrumbCtrl,
};
export default dataDepotBreadcrumbComponent;
