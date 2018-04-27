import MainCtrl from './main';
import ModalMoveCopy from './modal-move-copy';
import DataDepotToolbarCtrl from './data-depot-toolbar';
import DataDepotNewCtrl from './data-depot-new';
import DataDepotNavCtrl from './data-depot-nav';
import ModalPreview from './modal-preview';
import ModalUpload from './modal-upload';
import DataDepotCtrl from './data-depot-ctrl';


let mod = angular.module('portal.data_depot.controllers', []);

mod.controller('MainCtrl', MainCtrl);
mod.controller('ModalMoveCopy', ModalMoveCopy);
mod.controller('DataDepotToolbarCtrl', DataDepotToolbarCtrl);
mod.controller('DataDepotNewCtrl', DataDepotNewCtrl);
mod.controller('DataDepotNavCtrl', DataDepotNavCtrl);
mod.controller('ModalPreview', ModalPreview);
mod.controller('ModalUpload', ModalUpload);
mod.controller('DataDepotCtrl', DataDepotCtrl);

export default mod;
