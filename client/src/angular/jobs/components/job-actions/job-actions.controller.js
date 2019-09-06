class JobActionsCtrl {
    constructor(Jobs, $state, $rootScope, UserService, Apps) {
        'ngInject';
        this.Jobs = Jobs;
        this.$state = $state;
        this.$rootScope = $rootScope;
        this.UserService = UserService;
        this.Apps = Apps;
    }

    $onInit() {
        this.jobFinished = this.Jobs.jobIsFinished(this.job);
    }

    deleteJob() {
        this.Jobs.delete(this.job).then(
            () => {
                this.$rootScope.$broadcast('refresh-jobs-panel');
            }
        ).finally(
            () => {
                this.checkDismiss();
            }
        );
    }

    cancelJob() {
        this.Jobs.cancel(this.job).finally(
            () => {
                this.checkDismiss();
            }
        );
    }

    jobIsFinished(job) {
        let finishedStatus = ['FAILED', 'STOPPED', 'FINISHED', 'KILLED'];
        return (finishedStatus.some((e) => e === job.status));
    }


    launchApp() {
        let jobInfo = {
            inputs: this.job.inputs,
            parameters: this.job.parameters,
            maxRunTime: String(this.job.maxHours).padStart(2, '0') + ":00:00",
        }

        // Detect a prtl.clone app
        let regexString = "prtl\\.clone\\." + this.UserService.currentUser.username + "\\.[\\w\\-\\_]+\\.";
        let regex = new RegExp(regexString, 'gi');
        if (this.job.appId.match(regex)) {
            // Extract the allocation from the job
            let appIdTokens = this.job.appId.split('.');
            jobInfo['allocation'] = appIdTokens[3];

            // Find the original app name and pre-generate the job name
            // (to make sure prtl.clone.username.allocation does not get included)
            let appId = appIdTokens.slice(4).join('.');
            jobInfo.name = appId + "_" + this.Apps.getDateString()
        }

        // For parallel jobs, copy node information
        if (this.job.nodeCount) {
            jobInfo.nodeCount = this.job.nodeCount;
        }
        if (this.job.processorsPerNode) {
            jobInfo.processorsPerNode = this.job.processorsPerNode;
        }
        this.$state.go('wb.workspace.apps', { appId: this.job.appId, jobInfo: jobInfo }, { reload: true });
    }

    checkDismiss() {
        if (this.dismiss) {
            this.dismiss();
        }
    }

    resubmit() {
        this.Jobs.resubmit(this.job).finally(
            () => {
                this.checkDismiss();
            }
        );
    }
}

export default JobActionsCtrl;
