import angular from 'angular';
import neurodataCollectionsComponent from './neurodata-collections/neurodata-collections.component';
import neurodataExperimentsComponent from './neurodata-experiments/neurodata-experiments.component';
import neurodataChannelsComponent from './neurodata-channels/neurodata-channels.component';
import neurodataPreviewComponent from './neurodata-preview/neurodata-preview.component';
import neurodataSaveComponent from './neurodata-save/neurodata-save.component';
import neurodataBreadcrumbComponent from './neurodata-breadcrumb/neurodata-breadcrumb.component';
import neurodataHelpModalComponent from './neurodata-help/neurodata-help.component';

const neurodata = angular.module('portal.data_depot.components.neurodata', [
    'portal.data_depot.services',
    'ui.router'
]);

neurodata.component('neurodataCollectionsComponent', neurodataCollectionsComponent);
neurodata.component('neurodataExperimentsComponent', neurodataExperimentsComponent);
neurodata.component('neurodataChannelsComponent', neurodataChannelsComponent);
neurodata.component('neurodataPreviewComponent', neurodataPreviewComponent);
neurodata.component('neurodataSaveComponent', neurodataSaveComponent);
neurodata.component('neurodataBreadcrumbComponent', neurodataBreadcrumbComponent);
neurodata.component('neurodataHelpModalComponent', neurodataHelpModalComponent);

export default neurodata;