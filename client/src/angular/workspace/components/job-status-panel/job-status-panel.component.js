import template from './job-status-panel.template.html';
class JobStatusPanelCtrl {
    constructor(Notifications, Jobs, $uibModal, $rootScope) {
        'ngInject';
        this.Notifications = Notifications;
        this.Jobs = Jobs;
        this.$uibModal = $uibModal;
        this.$rootScope = $rootScope;
    }

    $onInit() {
        this.hasMoreJobs = true;
        this.limit = 10;
        this.collapsed = true;
        this.jobs = [];
        this.Notifications.subscribe(() => { this.refresh(); });
        this.refresh();
        this.$rootScope.$on('job-submitted', () => {
            this.collapsed = false;
        });
        this.$rootScope.$on('refresh-jobs-panel', () => {
            this.refresh();
        });
    }

    togglePanel() {
        this.collapsed = !this.collapsed;
    }

    refresh() {
        this.loading = true;
        this.Jobs.list({ limit: this.limit })
            .then((resp) => {
                this.jobs = resp;
            })
            .finally(() => {
                this.loading = false;
            });
    }

    loadMore() {
        this.limit += 10;
        this.refresh();
    }
}

const jobStatusPanel = {
    template: template,
    bindings: {},
    controller: JobStatusPanelCtrl,
};

export default jobStatusPanel;
