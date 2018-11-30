import angular from 'angular';
import MainCtrl from './main';
import ModalMoveCopy from './modal-move-copy';
import DataDepotToolbarCtrl from './data-depot-toolbar';
import DataDepotNewCtrl from './data-depot-new';
import DataDepotNavCtrl from './data-depot-nav';
import ModalPreview from './modal-preview';
import ModalUpload from './modal-upload';
import DataDepotCtrl from './data-depot-ctrl';
import ProjectListCtrl from './project-list';
// import ProjectListingCtrl from './project-listing';
import ModalProjectCreate from './modal-project-create';
import ModalProjectCollaborators from './modal-project-collaborators';
import ModalProjectEdit from './modal-project-edit';

let mod = angular.module('portal.data_depot.controllers', []);

mod.controller('MainCtrl', MainCtrl);
mod.controller('ModalMoveCopy', ModalMoveCopy);
mod.controller('DataDepotToolbarCtrl', DataDepotToolbarCtrl);
mod.controller('DataDepotNewCtrl', DataDepotNewCtrl);
mod.controller('DataDepotNavCtrl', DataDepotNavCtrl);
mod.controller('ModalPreview', ModalPreview);
mod.controller('ModalUpload', ModalUpload);
mod.controller('DataDepotCtrl', DataDepotCtrl);
mod.controller('ProjectListCtrl', ProjectListCtrl);
// mod.controller('ProjectListingCtrl', ProjectListingCtrl);
mod.controller('ModalProjectCreate', ModalProjectCreate);
mod.controller('ModalProjectCollaborators', ModalProjectCollaborators);
mod.controller('ModalProjectEdit', ModalProjectEdit);

export default mod;
