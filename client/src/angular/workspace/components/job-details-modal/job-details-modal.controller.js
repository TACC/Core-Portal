
class JobDetailsModalCtrl {
    constructor(Jobs, $rootScope, $transitions, Notifications) {
        'ngInject';
        this.Jobs = Jobs;
        this.$rootScope = $rootScope;
        this.$transitions = $transitions;
        this.loading = false;
        this.expandStatus = false;
        this.Notifications = Notifications;
    }

    $onInit() {
        this.job = this.resolve.job;
        this.loading = true;
        this.Jobs.get(this.job.id).then((resp) => {
            if (resp.status === 'RUNNING' && resp._embedded.metadata) {
                for (let i = 0; i < resp._embedded.metadata.length; i++) {
                    if (resp._embedded.metadata[i].name === 'interactiveJobDetails') {
                        let meta = resp._embedded.metadata[i];
                        resp.interactive = true;
                        resp.connection_address = meta.value.action_link;
                    }
                }
            }
            this.job = resp;
            this.jobFinished = this.Jobs.jobIsFinished(this.job);
        }).finally(
            () => {
                this.loading = false;
            }
        );
        this.$transitions.onStart({ from: 'wb.workspace.**', to: '**' }, (transition) => {
            this.close();
        });
        this.Notifications.subscribe(
            (msg) => {
                this.job = this.Jobs.updateJobFromNotification(this.job, msg);
            }
        )
    }

    close() {
        this.dismiss('cancel');
    }

    statusToggle() {
        this.expandStatus = !this.expandStatus;
    }

    convertDate(date) {
        return new Date(date).toLocaleString();
    }
}

export default JobDetailsModalCtrl;