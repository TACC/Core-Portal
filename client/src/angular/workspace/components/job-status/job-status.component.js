import template from './job-status.template.html';
class JobStatusCtrl {
    constructor(Notifications, Jobs, $uibModal) {
        'ngInject';
        this.Notifications = Notifications;
        this.Jobs = Jobs;
        this.$uibModal = $uibModal;
    }

    $onInit() {

    }

    jobDetails(job) {
        this.Jobs.get(job.id).then((resp) => {
            if (resp.status === 'RUNNING' && resp._embedded.metadata) {
                for (let i = 0; i < resp._embedded.metadata.length; i++) {
                    if (resp._embedded.metadata[i].name === 'interactiveJobDetails') {
                        let meta = resp._embedded.metadata[i];
                        resp.interactive = true;
                        resp.connection_address = meta.value.action_link;
                        break;
                    }
                }
            }

            this.$uibModal.open({
                component: 'jobDetailsModal',
                resolve: {
                    job: resp,
                },
            });
        });
    }
}

const jobStatus = {
    template: template,
    bindings: {
        job: '<',
    },
    controller: JobStatusCtrl,
};

export default jobStatus;
