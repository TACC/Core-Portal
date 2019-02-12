import angular from 'angular';
import fileListingComponent from './file-listing/file-listing.component';
import dataViewComponent from './data-view/data-view.component';
import modalMoveCopyComponent from './modal-move-copy/modal-move-copy.component';
import dataDepotToolbarComponent from './data-depot-toolbar/data-depot-toolbar.component';
import dataDepotNewComponent from './data-depot-new/data-depot-new.component';
import dataDepotNavComponent from './data-depot-nav/data-depot-nav.component';
import dataDepotMainComponent from './data-depot-main/data-depot-main.component';
import dataDepotBreadcrumbComponent from './data-depot-breadcrumb/data-depot-breadcrumb.component';

const ddComponents = angular.module('portal.data_depot.components', [
    'portal.data_depot.services',
    'ui.router',
]);

ddComponents.component('fileListingComponent', fileListingComponent);
ddComponents.component('dataViewComponent', dataViewComponent);
ddComponents.component('modalMoveCopyComponent', modalMoveCopyComponent);
ddComponents.component('ddBreadcrumbComponent', dataDepotBreadcrumbComponent);
ddComponents.component('ddToolbarComponent', dataDepotToolbarComponent)
ddComponents.component('ddNewComponent', dataDepotNewComponent)
ddComponents.component('ddNavComponent', dataDepotNavComponent)
ddComponents.component('ddMainComponent', dataDepotMainComponent)

export default ddComponents;
