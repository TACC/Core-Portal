import angular from 'angular';
import fileListingComponent from './file-listing/file-listing.component';
import dataViewComponent from './data-view/data-view.component';
import modalMoveCopyComponent from './modal-move-copy/modal-move-copy.component';
import dataDepotBreadcrumbComponent from './data-depot-breadcrumb/data-depot-breadcrumb.component';

const ddComponents = angular.module('portal.data_depot.components', [
    'portal.data_depot.services',
    'ui.router',
]);

ddComponents.component('fileListingComponent', fileListingComponent);
ddComponents.component('dataViewComponent', dataViewComponent);
ddComponents.component('modalMoveCopyComponent', modalMoveCopyComponent);
ddComponents.component('ddBreadcrumbComponent', dataDepotBreadcrumbComponent);
export default ddComponents;
