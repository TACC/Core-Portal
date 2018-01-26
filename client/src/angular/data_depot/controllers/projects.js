export function ProjectRootCtrl($scope, $state, DataBrowserService) {
  'ngInject';
  DataBrowserService.apiParams.fileMgr = 'agave';
  DataBrowserService.apiParams.baseUrl = '/api/agave/files';
  DataBrowserService.apiParams.searchState = undefined;

  $scope.data = {
    navItems: [],
    projects: [],
  };

  $scope.$on('$stateChangeSuccess', function($event, toState, toStateParams) {
    $scope.data.navItems = [{href: $state.href('projects.list'), label: 'Projects'}];

    if (toStateParams.filePath) {
      if (toStateParams.filePath === '/') {
        $scope.data.navItems.push({
          label: toStateParams.projectTitle,
          href: $state.href('projects.view.data', {
            projectId: toStateParams.projectId,
            filePath: '/',
            projectTitle: toStateParams.projectTitle
          })
        });
      } else {
        _.each(toStateParams.filePath.split('/'), function (e, i, l) {
          var filePath = l.slice(0, i + 1).join('/');
          if (filePath === '') {
            filePath = '/';
          }
          $scope.data.navItems.push({
            label: e || toStateParams.projectTitle,
            href: $state.href('projects.view.data', {
              projectId: toStateParams.projectId,
              filePath: filePath,
              projectTitle: toStateParams.projectTitle
            })
          });
        });
      }
    }
    if ($state.current.name === 'db.projects') {
      $state.go('db.projects.list');
    }
  });
}
