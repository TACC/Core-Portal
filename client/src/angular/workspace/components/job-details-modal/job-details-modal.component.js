import template from './job-details-modal.template.html';

class JobDetailsModalCtrl {
    constructor($http, Jobs, $rootScope) {
        'ngInject';
        this.Jobs = Jobs;
        this.$rootScope = $rootScope;
    }

    $onInit() {
        this.job = this.resolve.job;
        this.jobFinished = this.jobIsFinished(this.job);
    }

    close() {
        this.dismiss('cancel');
    }

    deleteJob() {
        this.Jobs.delete(this.job).then(() => {
            this.$rootScope.$broadcast('refresh-jobs-panel');
            this.dismiss();
        }, (err) => {
        });
    }

    cancelJob() {
        this.Jobs.cancel(this.job).then(() => {
            this.dismiss();
        });
    }

    jobIsFinished(job) {
        return job.status == 'FINISHED' || job.status == 'FAILED';
    }
}


const jobDetailsModal = {
    template: template,
    controller: JobDetailsModalCtrl,
    bindings: {
        close: '&',
        dismiss: '&',
        resolve: '<',
    },
};

export default jobDetailsModal;
