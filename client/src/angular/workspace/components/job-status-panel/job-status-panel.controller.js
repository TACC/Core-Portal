class JobStatusPanelCtrl {
    constructor($rootScope) {
        'ngInject';
        this.$rootScope = $rootScope;
    }

    $onInit() {
        this.collapsed = true;
        this.refresh();
        this.$rootScope.$on('job-submitted', () => {
            this.collapsed = false;
        });
    }

    togglePanel() {
        this.collapsed = !this.collapsed;
    }

    refresh() {
        this.$rootScope.$broadcast('refresh-jobs-panel');
    }
}

export default JobStatusPanelCtrl;