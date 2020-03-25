export default class ModalPreviewCtrl {

    constructor($sce, $scope) {
        'ngInject';
        this.$sce = $sce;
        this.$scope = $scope;
    }

    $onInit() {
        this.file = this.resolve.file;
        this.listing = this.resolve.listing;
        this.busy = true;
        this.fileExt = this.file.name.split('.').pop();
        this.videoExt = ['webm', 'ogg', 'mp4'];
        this.file.preview().then(
            (data) => {
                this.previewHref = this.$sce.trustAs('resourceUrl', data.href);
            }, (err)=>{
                this.previewError = err.data;
            }
        ).finally( ()=>{
            this.busy = false;
        });
    }


    iframeLoadedCallback() {
        this.busy = false;
        this.$scope.$apply();
    }

    close() {
        this.dismiss();
    }

}
