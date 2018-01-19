
export default function ProjectListCtrl($scope, $state, Django, ProjectService) {
  'ngInject';
  $scope.ui = {};
  $scope.data = {
    customRoot: {
      name: 'My Projects',
      href: $state.href('db.projects.list')
    }
  };
  $scope.ui.busy = true;
  $scope.data.projects = [];
  ProjectService.list().then(function(projects) {
    $scope.ui.busy = false;
    $scope.data.projects = projects;
  });

  $scope.onBrowse = function onBrowse($event, project) {
    $event.preventDefault();
    $state.go('db.projects.listing', {systemId: project.id,
                                     filePath: '/',
                                     projectTitle: project.name});
  };

}
