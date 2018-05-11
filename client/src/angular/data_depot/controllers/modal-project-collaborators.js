export default class ModalProjectCollaborators {

  constructor($uibModalInstance, UserService, ProjectService, project) {
    'ngInject';
    this.ProjectService = ProjectService;
    this.$uibModalInstance = $uibModalInstance;
    this.project = project;
    this.UserService = UserService;
    this.collaborators = [];
  }

  search (text) {
    return this.UserService.search({q:text});
  }

  addCollaborator (username) {
    this.collaborators.push({"username":username});
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
