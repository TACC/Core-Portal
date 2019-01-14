import angular from 'angular';



const ddComponents = angular.module('portal.data_depot.components', [
    'portal.data_depot.services',
    'ui.router',
]);

import fileListingComponent from './file-listing/file-listing.component';
ddComponents.component('fileListingComponent', fileListingComponent)

import dataViewComponent from './data-view/data-view.component';
ddComponents.component('dataViewComponent', dataViewComponent)

export default ddComponents