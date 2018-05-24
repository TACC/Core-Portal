

export default class ModalProjectCreate {

  constructor($uibModalInstance, ProjectService) {
    'ngInject';
    console.log("ModalProjectCreate");
    this.ProjectService = ProjectService;
    this.$uibModalInstance = $uibModalInstance;
  }


  save() {
    let data = {
      // title: projectForm.title.value,
      // description: projectForm.description.value
    };

    this.ProjectService.save(data).then( (resp) =>{
      console.log(resp);
    });
  }

  cancel() {
    this.$uibModalInstance.dismiss();
  }
}
