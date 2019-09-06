import angular from 'angular';
import jobDetailComponent from './job-detail/job-detail.component';
import jobsListComponent from './jobs-list/jobs-list.component';
import jobsViewComponent from './jobs-view/jobs-view.component';
import jobStatusComponent from './job-status/job-status.component';
import jobActionsComponent from './job-actions/job-actions.component';

const mod = angular.module('portal.jobs.components', [
    'portal.workspace.services'
]);

mod.component('jobDetail', jobDetailComponent);
mod.component('jobsList', jobsListComponent);
mod.component('jobsView', jobsViewComponent);
mod.component('jobStatus', jobStatusComponent);
mod.component('jobActions', jobActionsComponent);

export default mod;