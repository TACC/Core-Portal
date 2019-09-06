class JobStatusCtrl {
    constructor(Jobs, $uibModal, $state) {
        'ngInject';
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.Jobs = Jobs;
    }

    jobDetails() {
        if (this.modal) {
            this.$uibModal.open({
                component: 'jobDetailsModal',
                resolve: {
                    job: () => { return this.job; },
                },
            });
        } else {
            this.$state.go('wb.jobs.job', { jobId: this.job.id });
        }
    }
}

export default JobStatusCtrl;