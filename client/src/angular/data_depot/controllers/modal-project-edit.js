import angular from 'angular';

export default class ModalProjectEdit {

  constructor($uibModalInstance, ProjectService, project) {
    'ngInject';
    this.ProjectService = ProjectService;
    this.$uibModalInstance = $uibModalInstance;
    this.project = angular.copy(project);
  }


  save() {
    this.loading = true;
    this.ProjectService.update(this.project).then( (resp) =>{
      this.loading = false;
      this.$uibModalInstance.close();
    }, (err)=> {
      this.loading = false;
    });
  }

  cancel() {
    this.$uibModalInstance.dismiss();
  }
}
