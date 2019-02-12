import '../../../../css/projects.scss';
import angular from 'angular';
import newProjectModal from './components/new-project/new-project.component';
import projectListingComponent from
    './components/project-listing/project-listing.component';
import projectMetadataComponent from
    './components/project-meta/project-meta.component.js';
import editProjectMetadataComponent 
    from './components/edit-project-metadata/edit-project-metadata.component';
import editProjectMembersComponent
    from './components/edit-project-members/edit-project-members.component';
import metadataFieldComponent
    from './components/metadata-field/metadata-field.component';
import memberListComponent 
    from './components/member-list/member-list.component';
import projectListComponent
    from './components/project-list/project-list.component';

const projects = angular.module('portal.data_depot.projects', [
    'portal.data_depot.services',
    'ui.router',
]);

projects.component('newProjectModal', newProjectModal);
projects.component('projectListingComponent', projectListingComponent);
projects.component('projectMeta', projectMetadataComponent);
projects.component('editProjectMetadataModal', editProjectMetadataComponent);
projects.component('editProjectMembersModal', editProjectMembersComponent);
projects.component('metadataField', metadataFieldComponent);
projects.component('memberList', memberListComponent);
projects.component('projectListComponent', projectListComponent);

export default projects;
