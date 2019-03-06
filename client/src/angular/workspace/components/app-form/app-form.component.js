import template from './app-form.template.html';
import angular from 'angular';

class ApplicationFormCtrl {
    constructor($rootScope, Apps, Jobs, $timeout, UserService, $uibModal, SystemsService, $q) {
        'ngInject';
        this.$rootScope =$rootScope;
        this.Apps = Apps;
        this.Jobs = Jobs;
        this.$timeout = $timeout;
        this.UserService = UserService;
        this.$uibModal = $uibModal;
        this.SystemsService = SystemsService;
        this.$q;
    }

    $onChanges() {
        if (!this.selectedApp) return;
        this.type = this.selectedApp.value.type;
        if (this.selectedApp.value.type === 'agave') {
            this.Apps.get(this.selectedApp.value.definition.id).then(
                (resp)=> {
                    this.app = resp.data.response;
                    this.resetForm();
                });
        } else if (this.selectedApp.value.type === 'html') {
            this.app = this.selectedApp.value.definition.html;
            /* Can be enabled if non-agave, i.e. html apps, will use licensing */
            // this.Apps.getMeta(this.selectedApp.value.definition.id).then(
            //   function (resp) {
            //     this.app = this.selectedApp.value.definition.html;
            //     this.needsLicense = resp.data.response.license.type && !resp.data.response.license.enabled;
            //   }
            // );
        }
    }

    $onInit() {
        this.needsAllocation = false;
        this.allocations = this.UserService.userAllocations;
        this.type = 'agave';
        this.submitting = false;
        this.model = {};
        this.form = [];
        // TODO: this is heinous. For some reason have to use $timeout in order
        // to get the models / forms in sync
        this.$rootScope.$on('sf-render-finished', () => {
            this.$timeout(() => {
                this.$rootScope.$broadcast('schemaFormValidate');
            }, 10);
        });
    }

    resetForm() {
        this.messages = [];
        this.needsLicense = this.app.license.type && !this.app.license.enabled;

        let allocations = this.allocations.allocs[this.app.resource];
        this.needsAllocation = !allocations;

        // Add array of allocations by project allocation to choose from, based on host app exec host
        // Return empty allocations list if none exist for user on system
        this.app.allocations = this.needsAllocation ? [] : allocations;
        this.app.portal_alloc = this.allocations.portal_alloc;

        this.readOnly = this.needsAllocation || this.needsLicense;

        this.model = {};
        this.schema = this.Apps.formSchema(this.app);
        this.form = [];
        /* inputs */
        if (this.schema.properties.inputs) {
            this.form.push({
                type: 'fieldset',
                readonly: this.readOnly,
                title: 'Inputs',
                items: ['inputs'],
            });
        }

        if (this.schema.properties.parameters) {
            this.form.push({
                type: 'fieldset',
                readonly: this.readOnly,
                title: 'Parameters',
                items: ['parameters'],
            });
        }

        /* job details */
        let items = [];
        if (this.app.scheduler == 'SLURM') {
            items.push('allocation');
        }
        if (this.app.tags.includes('Interactive')) {
            items.push('name');
        } else {
            items.push('maxRunTime', 'name', 'archivePath');
        }

        this.form.push({
            type: 'fieldset',
            readonly: this.readOnly,
            title: 'Job details',
            items: items,
        });

        /* buttons */
        items = [];
        if (!this.readOnly) {
            items.push({
                type: 'submit',
                title: (this.app.tags.includes('Interactive') ? 'Launch' : 'Run'),
                style: 'btn-primary',
            });
        }
        items.push({
            type: 'button',
            title: 'Close',
            style: 'btn-link',
            onClick: () => {
                this.$rootScope.$broadcast('close-app', this.app.id);
                this.app = null;
            },
        });
        this.form.push({
            type: 'actions',
            items: items,
        });
    }

    onSubmit(form) {
        this.messages = [];
        this.$rootScope.$broadcast('schemaFormValidate');
        if (form.$valid) {
            let jobData = {
                appId: this.app.id,
                archive: true,
                inputs: {},
                parameters: {},
            };

            /* Add any attribute that requires an API call for the job to be ready to $scope.jobReady, i.e. project listings for VNC apps */
            // $scope.jobReady = {
            //     ready: true,
            // };

            /* copy form model to disconnect from this */
            Object.assign(jobData, angular.copy(this.model));

            /* Set allocation to exec system scheduler if scheduler is not 'SLURM' since user won't need an allocation to charge for not SLURM jobs */
            jobData.allocation = (this.app.scheduler == 'SLURM') ? jobData.allocation : this.app.scheduler;

            /* move archivePath from inputs */
            if (jobData.inputs.hasOwnProperty('archivePath')) {
                jobData.archivePath = jobData.inputs.archivePath;
                delete jobData.inputs.archivePath;
            } else if (jobData.appId.includes('compress') || jobData.appId.includes('extract')) {
                /* Set archivePath to inputPath for compress and zip apps */
                let tmpPath = Object.values(jobData.inputs)[0].split('/');
                tmpPath.pop();
                jobData.archivePath = tmpPath.join('/');
            }

            /* remove falsy input/parameter */
            for (let k in jobData.inputs) {
                let v = jobData.inputs[k];
                if (Array.isArray(v)) {
                    v = v.filter(Boolean);
                    if (v.length === 0) {
                        delete jobData.inputs[k];
                    }
                }
            }

            /* remove falsy input/parameter */
            for (let k in jobData.parameter) {
                let v = jobData.inputs[k];
                if (Array.isArray(v)) {
                    v = v.filter(Boolean);
                    if (v.length === 0) {
                        delete jobData.inputs[k];
                    }
                }
            }

            this.submitJob(jobData);
        }
    }

    submitJob(jobData) {
        this.submitting = true;
        this.Jobs.submit(jobData).then(
            (resp) => {
                this.submitting = false;
                let sysNeedsKeys = resp.execSys;
                if (sysNeedsKeys) {
                    this.openPushPublicKeyForm(sysNeedsKeys.id)
                        .then(() => {
                            this.messages.push({
                                type: 'success',
                                header: 'Keys pushed successfully!',
                                body: 'Keys for system <em>' + sysNeedsKeys.id + '</em> were pushed successfully. Job submission will continue.',
                            });
                            this.submitJob(jobData);
                        });
                    return;
                }

                this.$rootScope.$broadcast('job-submitted');
                this.resetForm();
                this.messages.push({
                    type: 'success',
                    header: 'Job Submitted Successfully',
                    body: 'Your job <em>' + resp.name + '</em> has been submitted. Monitor its status on the right.',
                });
            },
            (err) => {
                this.submitting = false;
                this.messages.push({
                    type: 'danger',
                    header: 'Job Submit Failed',
                    body: 'Your job submission failed with the following message:<br>' +
                        '<em>' + (err.data.message || 'Unexpected error') + '</em><br>' +
                        'Please try again. If this problem persists, please ' +
                        '<a class="alert-link" href="/tickets" target="_blank">submit a support ticket</a>.',
                });
                if (err.status == 412) {
                    this.app.clonedSysId = err.data.message.match('Unable to authenticate to (.*) with the default credential')[1];
                }
            });
    }

    openPushPublicKeyForm(systemId) {
        this.app.keysPushed = false;
        return this.SystemsService.get(systemId)
            .then((sys) => {
                return this.$uibModal.open({
                    component: 'SystemPushKeysModal',
                    resolve: {
                        sys: () => {
                            return sys;
                        },
                    },
                }).result;
            }, (err) => {
                this.app.keysPushed = false;
                this.messages.push({
                    type: 'danger',
                    header: 'Push Keys failed',
                    body: `Pushing keys for ${systemId} failed with the following message:<br>` +
                        '<em>' + (err.data.message || 'Unexpected error') + '</em><br>' +
                        'Please try again. If this problem persists, please ' +
                        '<a class="alert-link" href="/tickets" target="_blank">submit a support ticket</a>.',
                });
                return this.$q.reject(err);
            }).then(() => {
                return this.app.keysPushed = true;
            });
    }

    /**
    * Resets a system's keys
    * @function
    * @param {string} systemId - System id
    */
    openResetSystemKeysForm(systemId) {
        this.app.resettingKeys = true;
        this.app.keysReset = false;
        this.SystemsService.resetKeys({ id: systemId }).
            then((resp) => {
                this.app.resettingKeys = false;
                this.app.keysReset = true;
                this.app.keysPushed = false;
            }, (err) => {
                this.app.resettingKeys = false;
                this.messages.push({
                    type: 'danger',
                    header: 'Reset Keys failed',
                    body: `Resetting keys for ${systemId} failed with the following message:<br>` +
                        '<em>' + (err.data.message || 'Unexpected error') + '</em><br>',
                });
            });
    }
}

const appForm = {
    template: template,
    controller: ApplicationFormCtrl,
    bindings: {
        selectedApp: '<',
    },
};

export default appForm;
