import neurodataChannelsTemplate from './neurodata-channels.template.html';
class neurodataChannelsCtrl {
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
            system: 'channel',
            path: `collection/${this.$stateParams.collection}/experiment/${this.$stateParams.experiment}`,
        }).then( (resp) => {
            this.listing = resp;
            this.requesting = false;
            
        });
    }
    onBrowse($event, file) {
        this.DataBrowserService.neurodataPreview(file);
    }
}

const neurodataChannelsComponent = {
    template: neurodataChannelsTemplate,
    controller: neurodataChannelsCtrl
};

export default neurodataChannelsComponent;

