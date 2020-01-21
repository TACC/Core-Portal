import neurodataBreadcrumbTemplate from './neurodata-breadcrumb.template.html';
class NeurodataBreadcrumbCtrl {
    constructor($state, $stateParams, DataBrowserService) {
        'ngInject';
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.DataBrowserService = DataBrowserService;
    }

    $onInit() {
    }
    onBrowseNeuroRoot() {
        this.$state.go('wb.data_depot.neurodata.collections', 
            {}, 
            {reload: true});
    }
    onBrowseCollection() {
        this.$state.go('wb.data_depot.neurodata.experiments', 
            {collection: this.$stateParams.collection}, 
            {reload: true});
    }
    onBrowseExperiment() {
        this.$state.go('wb.data_depot.neurodata.channels', 
            {collection: this.$stateParams.collection, experiment: this.$stateParams.experiment}, 
            {reload: true});
    }

    helpModal() {
        this.DataBrowserService.neurodataHelp()
    }

}


const neurodataBreadcrumbComponent = {
    template: neurodataBreadcrumbTemplate,
    controller: NeurodataBreadcrumbCtrl
};

export default neurodataBreadcrumbComponent;