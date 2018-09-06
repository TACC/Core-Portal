import '../../../../css/projects.scss';
import angular from 'angular';
import newProjectModal from './components/new-project/new-project.component';
import projectListingComponent from
'./components/project-listing/project-listing.component';
import projectMetadataComponent from
'./components/project-meta/project_meta.component.js';
import projectMemberComponent from
'./components/member-search/member-search.component.js';

const projects = angular.module('portal.data_depot.projects', [
    'portal.data_depot.services',
    'ui.router',
]);

projects.component('newProjectModal', newProjectModal);
projects.component('projectListingComponent', projectListingComponent);
projects.component('projectMeta', projectMetadataComponent);
projects.component('projectMemberSearch', projectMemberComponent);

export default projects;
