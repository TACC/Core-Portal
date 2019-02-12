import angular from 'angular';
import ModalPreview from './modal-preview';
import ModalUpload from './modal-upload';
import ModalProjectCreate from './modal-project-create';
import ModalProjectCollaborators from './modal-project-collaborators';
import ModalProjectEdit from './modal-project-edit';

let mod = angular.module('portal.data_depot.controllers', []);

mod.controller('ModalPreview', ModalPreview);
mod.controller('ModalUpload', ModalUpload);
mod.controller('ModalProjectCreate', ModalProjectCreate);
mod.controller('ModalProjectCollaborators', ModalProjectCollaborators);
mod.controller('ModalProjectEdit', ModalProjectEdit);

export default mod;
