class OnboardingInfoModalCtrl {
    constructor($sce) {
        'ngInject';
        this.more_info = null;
        this.$sce = $sce;
    }

    $onInit() {
        this.event = this.resolve.event;
        this.more_info = this.$sce.trustAsHtml(this.event.data.more_info);
        this.step = this.resolve.step;
    }

    close() {
        this.dismiss();
    }
};

export default OnboardingInfoModalCtrl; 
