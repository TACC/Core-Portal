

export default class ModalProjectCreate {

  constructor($uibModalInstance, ProjectService) {
    'ngInject';
    this.ProjectService = ProjectService;
    this.$uibModalInstance = $uibModalInstance;
  }


  save() {
    let data = {
      // title: projectForm.title.value,
      // description: projectForm.description.value
    };

    this.ProjectService.save(data).then( (resp) =>{
      
    });
  }

  cancel() {
    this.$uibModalInstance.dismiss();
  }
}
