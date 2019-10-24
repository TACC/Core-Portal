class JobMessageExpandableCtrl {
    constructor(Jobs) {
        'ngInject';
        this.Jobs = Jobs
        this.expandStatus = false;
    }

    $onInit() {
    }

    statusToggle() {
        this.expandStatus = !this.expandStatus;
    }
}

export default JobMessageExpandableCtrl;
