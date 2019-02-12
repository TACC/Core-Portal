import DataDepotNavCtrl from './data-depot-nav.controller';
/*
Interface for systems:
[{
    systemId: string;
    name: string; // 'My Data' or 'Community Data'
}]
Interface for params: 
{
    systemId: string;
    filePath: string;
}
*/
const dataDepotNavComponent = {
    template: require("./data-depot-nav.template.html"),
    bindings: {
        systems: '<',
        params: '<'
    },
    controller: DataDepotNavCtrl,
};
export default dataDepotNavComponent;
