import neurodataCollectionsTemplate from './neurodata-collections.template.html';
class neurodataCollectionsCtrl {
    constructor(DataBrowserService, $stateParams, $state, $http) {
        'ngInject';
        this.DataBrowserService = DataBrowserService;
        this.$stateParams = $stateParams;
        this.$state = $state;
        this.$http = $http;
        this.img = null;
        this.requesting = false;
    }
    $onInit() {
        this.listing = null
        this.DataBrowserService.apiParams.fileMgr = 'neurodata';
        this.requesting = true;
        this.DataBrowserService.browse({
            system: 'collection',
            path: 'collection',
        }).then( (resp) => {
            this.listing = resp;
            this.requesting = false;
        })
    
    }
    onBrowse($event, file) {
        this.$state.go('wb.data_depot.neurodata.experiments', {collection: file.name});
    }
}

const neurodataCollectionsComponent = {
    template: neurodataCollectionsTemplate,
    controller: neurodataCollectionsCtrl
};

export default neurodataCollectionsComponent;

