import neurodataExperimentsTemplate from './neurodata-experiments.template.html';
class neurodataCollectionsCtrl {
    constructor(DataBrowserService, $stateParams, $state) {
        'ngInject';
        this.DataBrowserService = DataBrowserService;
        this.$stateParams = $stateParams;
        this.$state = $state;
        this.requesting = false;
    }
    $onInit() {
        this.listing = null
        this.DataBrowserService.apiParams.fileMgr = 'neurodata';
        this.requesting = true;
        this.DataBrowserService.browse({
            system: 'experiment',
            path: `collection/${this.$stateParams.collection}`,
        }).then( (resp) => {
            this.listing = resp;
            this.requesting = false;
            
        })
    }
    onBrowse($event, file) {
        this.$state.go('wb.data_depot.neurodata.channels', 
            {collection: this.$stateParams.collection, experiment: file.name});
    }
}

const neurodataExperimentsComponent = {
    template: neurodataExperimentsTemplate,
    controller: neurodataCollectionsCtrl
};

export default neurodataExperimentsComponent;

