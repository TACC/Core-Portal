import angular from 'angular';
import jobDetailComponent from './job-detail/job-detail.component';
import jobsListComponent from './jobs-list/jobs-list.component';
import jobsViewComponent from './jobs-view/jobs-view.component';
import jobStatusComponent from './job-status/job-status.component';
import jobActionsComponent from './job-actions/job-actions.component';
import jobMessageExpandableComponent from './job-message-expandable/job-message-expandable.component';
import jobHistoryExpandableComponent from './job-history-expandable/job-history-expandable.component';
import jobStatusLabelComponent from './job-status-label/job-status-label.component';
import jobDatetimeComponent from './job-datetime/job-datetime.component';

const mod = angular.module('portal.jobs.components', [
    'portal.workspace.services'
]);

mod.component('jobDetail', jobDetailComponent);
mod.component('jobsList', jobsListComponent);
mod.component('jobsView', jobsViewComponent);
mod.component('jobStatus', jobStatusComponent);
mod.component('jobActions', jobActionsComponent);
mod.component('jobMessageExpandable', jobMessageExpandableComponent);
mod.component('jobHistoryExpandable', jobHistoryExpandableComponent);
mod.component('jobStatusLabel', jobStatusLabelComponent);
mod.component('jobDatetime', jobDatetimeComponent);

export default mod;