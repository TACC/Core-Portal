class DataDepotNavCtrl {

    constructor() {
        'ngInject';
    }
    $onInit() {
        // get user data from service
        this.sysCommunityData = this.systems.find((sys) => {
            return sys.name == 'Community Data';
        });
        this.sysMyData = this.systems.find((sys) => {
            return sys.name == 'My Data';
        });
        this.externalResources = this.systems.filter((sys) => {
            return sys.directory == 'external-resources';
        });
    }
}

export default DataDepotNavCtrl;
