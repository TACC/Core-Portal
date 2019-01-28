import template from './app-form.template.html'
import angular from 'angular';

class ApplicationFormCtrl {
    constructor($rootScope, Apps, Jobs, $timeout) {
        'ngInject';
        this.$rootScope =$rootScope;
        this.Apps = Apps;
        this.Jobs = Jobs;
        this.$timeout = $timeout;
    }

    $onChanges () {
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
        }
    }

    $onInit() {
        this.type = 'agave';
        this.submitting = false;
        this.model = {};
        this.form = [];
        // TODO: this is heinous. For some reason have to use $timeout in order
        // to get the models / forms in sync
        this.$rootScope.$on('sf-render-finished', () => {
            console.log('sf-render-finished')
            this.$timeout(() => {
                this.$rootScope.$broadcast('schemaFormValidate');
            }, 10);
        });
    }

    resetForm() {
        this.needsLicense = this.app.license.type && !this.app.license.enabled;
        this.model = {};
        this.schema = this.Apps.formSchema(this.app);
        this.form = [];
        /* inputs */
        if (this.schema.properties.inputs) {
            this.form.push({
                type: 'fieldset',
                readonly: this.needsLicense,
                title: 'Inputs',
                items: ['inputs']
            });
        }

        if (this.schema.properties.parameters) {
            this.form.push({
                type: 'fieldset',
                readonly: this.needsLicense,
                title: 'Parameters',
                items: ['parameters']
            });
        }

        /* job details */
        let items = [];
        if (this.app.tags.includes('Interactive')) {
            items.push('name');
        } else {
            items.push('maxRunTime', 'name', 'archivePath');
        }

        this.form.push({
            type: 'fieldset',
            readonly: this.needsLicense,
            title: 'Job details',
            items: items
        });

        /* buttons */
        items = [];
        if (!this.needsLicense) {
            items.push({
                type: 'submit',
                title: (this.app.tags.includes('Interactive') ? 'Launch' : 'Run'),
                style: 'btn-primary'
            });
        }
        items.push({
            type: 'button',
            title: 'Close',
            style: 'btn-link',
            onClick: 'closeApp()'
        });
        this.form.push({
            type: 'actions',
            items: items
        });
    }

    closeApp () {
        this.resetForm();
    }

    onSubmit(form) {
        this.messages = [];
        this.$rootScope.$broadcast('schemaFormValidate');
        if (form.$valid) {
            var jobData = {
                appId: this.app.id,
                archive: true,
                inputs: {},
                parameters: {}
            };

            /* copy form model to disconnect from this */
            Object.assign(jobData, angular.copy(this.model));
            /* move archivePath from inputs */
            if (jobData.inputs.hasOwnProperty('archivePath')) {
                jobData.archivePath = jobData.inputs.archivePath;
                delete jobData.inputs.archivePath;

            } else if (jobData.appId.includes('compress') || jobData.appId.includes('extract')) {
                /* Set archivePath to inputPath for compress and zip apps */
                var tmp_path = Object.values(jobData.inputs)[0].split('/');
                tmp_path.pop();
                jobData.archivePath = tmp_path.join('/');
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
            this.submitting = true;
            this.Jobs.submit(jobData).then(
                (resp)=> {
                    this.submitting = false;
                    this.messages.push({
                        type: 'success',
                        header: 'Job Submitted Successfully',
                        body: 'Your job <em>' + resp.data.response.name + '</em> has been submitted. Monitor its status on the right.'
                    });
                    this.resetForm();
                    this.refocus();
                },
                (err)=> {
                    this.submitting = false;
                    this.messages.push({
                        type: 'danger',
                        header: 'Job Submit Failed',
                        body: 'Your job submission failed with the following message:<br>' +
                            '<em>' + (err.data.message || 'Unexpected error') + '</em><br>' +
                            'Please try again. If this problem persists, please ' +
                            '<a href="/help" target="_blank">submit a support ticket</a>.'
                    });
                    this.refocus();
                });

        }
    }

}

const appForm = {
    template: template,
    controller: ApplicationFormCtrl,
    bindings: {
        selectedApp: '<'
    }
};

export default appForm;
