import template from './job-status.template.html';
class JobStatusCtrl {

    constructor (Notifications, Jobs, $uibModal) {
        'ngInject';
        this.Notifications = Notifications;
        this.Jobs = Jobs;
        this.$uibModal = $uibModal;
    }

    $onInit () {

    }

    jobDetails (job) {
        let jobCopy = angular.copy(job);
        if (jobCopy.status === 'RUNNING' && jobCopy._embedded.metadata) {
            for (let i = 0; i < jobCopy._embedded.metadata.length; i++) {
                if (jobCopy._embedded.metadata[i].name === 'interactiveJobDetails') {
                    let meta = jobCopy._embedded.metadata[i];
                    jobCopy.interactive = true;
                    jobCopy.connection_address = meta.value.action_link;
                    break;
                }
            }
        }

        this.$uibModal.open({
            component: 'jobDetailsModal',
            resolve: {
                job: jobCopy,
            },
        });
    }
}

const jobStatus = {
    template: template,
    bindings: {
        job: '<'
    },
    controller: JobStatusCtrl,
};

export default jobStatus;
