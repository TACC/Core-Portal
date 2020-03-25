export default class ModalPublicUrlCtrl {

    constructor($sce, $scope) {
        'ngInject';
        this.$sce = $sce;
        this.$scope = $scope;
    }
    $onInit() {
        this.file = this.resolve.file;
        this.error = false;
        this.busy = true;
        this.confirmDialog = false;
        this.data = {};

        this.file.publicUrl(false).then(resp => {
            this.busy = false;
            this.data = resp;
            this.data.expires = new Date(this.data.expires);
        },
        error => {
            this.busy = false;
            this.error = true;
        })
    }
    confirmRefresh() {
        this.confirmDialog = true;
    }
    cancelRefresh() {
        this.confirmDialog = false;
    }
    refresh() {
        this.confirmDialog = false
        this.busy = true;
        this.file.publicUrl(true).then(resp => {
            this.busy = false;
            this.data = resp;
            this.data.expires = new Date(this.data.expires);
        },
        error => {
            this.busy = false;
            this.error = true;
        })
    }
    close() {
        this.dismiss();
    }

}