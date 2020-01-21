
import template from './neurodata-preview.template.html';

class neurodataPreviewCtrl {

    constructor($sce, $scope, DataBrowserService, $stateParams) {
        'ngInject';
        this.$sce = $sce;
        this.$scope = $scope;
        this.img = null;
        this.$stateParams = $stateParams;
        this.DataBrowserService = DataBrowserService;
    }

    $onInit() {
        this.requestingCoords = false;
        this.requestingImg = false;
        this.hasImg = false;
        this.file = this.resolve.file;
        this.placeholder = `neurodata_${this.$stateParams.collection}_${this.$stateParams.experiment}_${this.file.name}_${new Date().toISOString()}`
        this.previewParams = {
            collection: this.$stateParams.collection,
            experiment: this.$stateParams.experiment,
            channel: this.file.name,
            resolution: 0,
            x_start: 0,
            y_start: 0,
            z_start: 0,
            x_stop: 100,
            y_stop: 100,
            z_stop: 1,
            type: '.jpg'
        }
        this.requestingCoords = true;
        this.DataBrowserService.browse({
            system: 'channel.preview',
            path: `collection/${this.$stateParams.collection}/experiment/${this.$stateParams.experiment}/channel/${this.file.name}`,
        }).then( (resp) => {
            this.channel = resp.children[0]
            this.file.coordFrame().then(resp => {
                this.coords = resp;
                this.requestingCoords = false;
            });
        })
        
    }
    downloadType(type) {
        this.previewParams.type = type;
    }

    preview() {
        this.requestingImg = true;
        this.file.neurodataPreview(this.previewParams).then(resp => {
            this.img = 'data:image/png;base64,'+resp;
            this.requestingImg = false;
            this.hasImg = true;
        })
    }
    save() {
        this.previewParams.filename = this.previewParams.filename || this.placeholder;
        this.DataBrowserService.neurodataSave(this.file, this.previewParams);
    }

    close() {
        this.dismiss();
    }

}

const neurodataPreviewComponent = {
    template: template,
    controller: neurodataPreviewCtrl,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export default neurodataPreviewComponent;