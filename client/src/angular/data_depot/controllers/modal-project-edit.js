

export default class ModalProjectEdit {

  constructor($uibModalInstance, ProjectService, project) {
    'ngInject';
    console.log("ModalProjectCreate");
    this.ProjectService = ProjectService;
    this.$uibModalInstance = $uibModalInstance;
    this.project = angular.copy(project);
  }


  save() {
    this.loading = true;
    this.ProjectService.update(this.project).then( (resp) =>{
      console.log(resp);
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
