import jobStatusPanel from './job-status-panel/job-status-panel.component.js';
import jobDetailsModal from './job-details-modal/job-details-modal.component.js';
import appForm from './app-form/app-form.component.js';
import workspaceDataBrowser from './data-browser/workspace-data-browser.component.js';
import appTray from './app-tray/app-tray.component.js';
import workspaceRoot from './workspace-root/workspace-root.component.js';


let mod = angular.module('portal.workspace.components', []);
mod.component('jobStatusPanel', jobStatusPanel);
mod.component('jobDetailsModal', jobDetailsModal);
mod.component('appForm', appForm);
mod.component('workspaceDataBrowser', workspaceDataBrowser);
mod.component('appTray', appTray);
mod.component('workspaceRoot', workspaceRoot);

export default mod;
