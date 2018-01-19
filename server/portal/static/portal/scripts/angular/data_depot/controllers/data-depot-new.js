export default function DataDepotNewCtrl($scope, $state, Django, DataBrowserService) {
  'ngInject';
  $scope.test = {
    enabled: Django.context.authenticated,
    createFiles: false,
    createProject: Django.context.authenticated
  };

  $scope.browser = DataBrowserService.state();

  $scope.$watch('browser.listing', function() {
    $scope.test.createFiles = false;
    if ($scope.browser.listing) {
      $scope.browser.listing.listPermissions().then(function (res) {
        var pems = res.response;
        $scope.test.createFiles = _.findWhere(pems, {username: Django.user}).permission.write;
      });
    }
  });

  $scope.createFolder = function($event) {
    if ($scope.test.createFiles) {
      DataBrowserService.mkdir();
    } else {
      $event.preventDefault();
      $event.stopPropagation();
    }
  };

  $scope.createProject = function($event) {
    if ($scope.test.createProject) {
      ProjectService.editProject().then(function (project) {
        $state.go('projects.view.data', {projectId: project.uuid, filePath: '/'});
      });
    } else {
      $event.preventDefault();
      $event.stopPropagation();
    }
  };

  $scope.uploadFiles = function($event) {
    if ($scope.test.createFiles) {
      DataBrowserService.upload(false);
    } else {
      $event.preventDefault();
      $event.stopPropagation();
    }
  };

  $scope.uploadFolders = function($event) {
    if ($scope.test.createFiles) {
      DataBrowserService.upload(true);
    } else {
      $event.preventDefault();
      $event.stopPropagation();
    }
  };

};
