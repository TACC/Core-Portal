
export default function ProjectListCtrl($scope, $state, currentUser, ProjectService, $uibModal) {
  'ngInject';
  console.log(currentUser);
  $scope.currentUser = currentUser;
  $scope.ui = {};
  $scope.data = {
    customRoot: {
      name: 'My Projects',
      href: $state.href('db.projects.list')
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
    $state.go('db.projects.listing', {systemId: project.id,
                                     filePath: '/',
                                     projectTitle: project.name});
  };

  $scope.manageCollaborators = function (project) {
    let modal = $uibModal.open({
      templateUrl: '/static/portal/scripts/angular/data_depot/modals/modal-project-collaborators.html',
      controller: 'ModalProjectCollaborators',
      controllerAs: 'vm',
      resolve: {
        project: ()=> {return project;}
      }
    });
  };

  $scope.editProject = function (project) {
    let modal = $uibModal.open({
      templateUrl: '/static/portal/scripts/angular/data_depot/modals/modal-project-edit.html',
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
