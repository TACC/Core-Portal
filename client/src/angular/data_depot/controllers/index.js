import MainCtrl from './main';
import ModalMoveCopy from './modal-move-copy';
import DataDepotToolbarCtrl from './data-depot-toolbar';
import DataDepotNewCtrl from './data-depot-new';
import DataDepotNavCtrl from './data-depot-nav';
import CommunityDataCtrl from './community';
import ModalPreview from './modal-preview';
import ModalUpload from './modal-upload';
import DataBrowserCtrl from './data-browser-ctrl';
// import SharedDataCtrl from './shared-data';
// import ProjectListCtrl from './project-list';
// import ProjectListingCtrl from './project-listing';
// import ProjectViewCtrl from './project-view';
import ProjectDataCtrl from './project-data';

let mod = angular.module('portal.data_depot.controllers', []);

mod.controller('MainCtrl', MainCtrl);
mod.controller('ModalMoveCopy', ModalMoveCopy);
mod.controller('DataDepotToolbarCtrl', DataDepotToolbarCtrl);
mod.controller('DataDepotNewCtrl', DataDepotNewCtrl);
mod.controller('DataDepotNavCtrl', DataDepotNavCtrl);
mod.controller('CommunityDataCtrl', CommunityDataCtrl);             //Combine
mod.controller('ModalPreview', ModalPreview);
mod.controller('ModalUpload', ModalUpload);
mod.controller('DataBrowserCtrl', DataBrowserCtrl);     //Data Depot Controller
// mod.controller('SharedDataCtrl', SharedDataCtrl);
// mod.controller('ProjectListCtrl', ProjectListCtrl);
// mod.controller('ProjectListingCtrl', ProjectListingCtrl);
mod.controller('ProjectDataCtrl', ProjectDataCtrl);                 //Combine
export default mod;
