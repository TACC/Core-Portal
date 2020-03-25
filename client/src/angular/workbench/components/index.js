import angular from 'angular';
import SystemPushKeysModal from './systems/push-keys.modal.js';
import SubmitTicket from './submit-ticket/index.js';

let mod = angular.module('portal.workbench.components', []);

mod.component('systemPushKeysModal', SystemPushKeysModal);
mod.component('submitTicket', SubmitTicket);

export default mod;
