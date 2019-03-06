import template from './../../templates/components/push-keys.modal.html';

class SystemPushKeysController {
    constructor(SystemsService) {
        this.SystemsService = SystemsService;
        this.form = {};
        this.ui = {};
    }

    ok() {
        this.ui.loading = true;
        let hostnames = this.resolve.sys.login ? [this.resolve.sys.login.host, this.resolve.sys.storage.host] : [this.resolve.sys.storage.host];
        hostnames = [...new Set(hostnames)]; // remove duplicate hostnames
        angular.forEach(hostnames, (hostname) => {
            this.form.hostname = hostname;
            this.SystemsService.pushKeys(
                this.resolve.sys.id,
                angular.copy(this.form)
            ).
                then((resp) => {
                    this.ui.error = false;
                    this.ui.status = resp.status;
                    this.ui.message = 'Public Key added successfully';
                    return;
                }, (err) => {
                    this.ui.error = true;
                    this.ui.status = err.status;
                    this.ui.message = err.data.message;
                }).
                finally(() => {
                    this.ui.loading = false;
                    if (!this.ui.error) {
                        this.close({
                            $value: {
                                sys: this.sys,
                                form: this.form,
                            },
                        });
                    }
                });
        });
    }

    resetKeys() {
        this.ui.resetting_keys = true;
        this.ui.reset_keys_finished = false;
        this.SystemsService.resetKeys(
            this.resolve.sys
        ).
            then((resp) => {
                this.ui.reset_keys_success = true;
            }, (err) => {
                this.ui.reset_keys_success = false;
                this.ui.reset_keys_status = err.status;
                this.ui.reset_keys_message = err.data.message;
            }).
            finally(() => {
                this.ui.resetting_keys = false;
                this.ui.reset_keys_finished = true;
            });
    }

    cancel() {
        this.dismiss({ $value: 'cancel' });
    }

    $onInit() {
        this.form = {
            password: '',
            token: '',
            storageHost: this.resolve.sys.storage.host,
            loginHost: this.resolve.sys.login ? this.resolve.sys.login.host : null,
            name: this.resolve.sys.name,
            type: this.resolve.sys.type,
        };
    }
}

SystemPushKeysController.$inject = [
    'SystemsService',
];

const systemPushKeysModal = {
    template: template,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
    controller: SystemPushKeysController,
};

export default systemPushKeysModal;
