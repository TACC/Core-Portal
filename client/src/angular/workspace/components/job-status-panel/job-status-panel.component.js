import template from './job-status-panel.template.html';
class JobStatusPanelCtrl {

    constructor (Notifications, Jobs, $uibModal) {
        'ngInject';
        this.Notifications = Notifications;
        this.Jobs = Jobs;
        this.$uibModal = $uibModal;
    }

    $onInit () {
        this.hasMoreJobs = true;
        this.limit = 10;
        this.collapsed = true;
        this.jobs = [];
        this.Notifications.subscribe( ()=>{ this.refresh(); });
        this.refresh();
    }

    togglePanel () {
        this.collapsed = !this.collapsed;
    }

    jobFinished (job) {
        return job.status == 'FINISHED' || job.status == 'FAILED';
    }

    refresh () {
        this.loading = true;
        this.Jobs.list({ limit: this.limit })
            .then( (resp) => {
                this.jobs = resp;
            })
            .finally( ()=>{
                this.loading = false;
            });
    }

    loadMore () {
        this.limit += 10;
        this.refresh();
    }

}

const jobStatusPanel = {
    template: template,
    bindings: {},
    controller: JobStatusPanelCtrl
};

export default jobStatusPanel;
