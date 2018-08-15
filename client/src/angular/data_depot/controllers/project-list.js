import modalProjectCollaboratorsTemplate from '../modals/modal-project-collaborators.html';
import modalProjectEditTemplate from '../modals/modal-project-edit.html';

export default function ProjectListCtrl($scope, $state, ProjectService, $uibModal) {
  'ngInject';

  $scope.ui = {};
  $scope.data = {
    customRoot: {
      name: 'My Projects',
      href: $state.href('wb.data_depot.projects.list')
    }
  };

  $scope.data.projects = [];

  $scope.loadProjects = function () {
    $scope.ui.busy = true;
    ProjectService.list().then(function(projects) {
      $scope.ui.busy = false;
      $scope.data.projects = projects;
    });
  };
  $scope.loadProjects();

  $scope.onBrowse = function onBrowse($event, project) {
    $event.preventDefault();
    $state.go('wb.data_depot.projects.listing', {systemId: project.id,
                                     filePath: '/',
                                     projectTitle: project.name});
  };

  $scope.manageCollaborators = function (project) {
    let modal = $uibModal.open({
      template: modalProjectCollaboratorsTemplate,
      controller: 'ModalProjectCollaborators',
      controllerAs: 'vm',
      resolve: {
        project: ()=> {return project;}
      }
    });
  };

  $scope.editProject = function (project) {
    let modal = $uibModal.open({
      template: modalProjectEditTemplate,
      controller: 'ModalProjectEdit',
      controllerAs: 'vm',
      resolve: {
        project: ()=> {return project;}
      }
    });

    modal.result.then( ()=>{
      $scope.loadProjects();
    });
  };
}
