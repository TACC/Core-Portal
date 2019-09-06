class JobsListCtrl {
    constructor(Notifications, Jobs, $rootScope) {
        'ngInject';
        this.Notifications = Notifications;
        this.JobsService = Jobs;
        this.$rootScope = $rootScope;
    }

    $onInit() {
        this.hasMoreJobs = true;
        this.limit = 10;
        this.jobs = [];
        this.Notifications.subscribe(
            (event) => { 
                this.processNotification(event);
            }
        );
        this.refresh();
        this.$rootScope.$on('refresh-jobs-panel', () => {
            this.refresh();
        });
    }

    processNotification(event) {
        if (event.event_type !== "job") {
            return;
        }
        let index = -1;
        for (let i = 0; i < this.jobs.length; i++) {
            if (this.jobs[i].id === event.extra.id) {
                index = i;
                break;
            }
        }
        // Check to see if we are receiving a notification about a job
        // already in the jobs list
        if (index >= 0) {
            this.jobs[index] = this.JobsService.updateJobFromNotification(this.jobs[index], event);
        } else {
            // If it's not in the jobs list, we need to get the job and 
            // append it to our jobs list
            this.jobs.unshift(event.extra);
        }
    }

    refresh() {
        this.loading = true;
        this.JobsService.list({ limit: this.limit })
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

export default JobsListCtrl;
