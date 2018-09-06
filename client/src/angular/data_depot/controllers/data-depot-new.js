import _ from 'underscore';

export default function DataDepotNewCtrl(
    $scope,
    $state,
    $uibModal,
    Django,
    DataBrowserService,
    ProjectService
) {
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
      $event.preventDefault();
      $event.stopPropagation();
      if (!$scope.test.createProject) {
          return;
      }
      const modal = $uibModal.open({
        component: 'newProjectModal'
      });
      modal.result.then(
          (res)=>{
              $state.go(
                  'wb.data_depot.projects.listing',
                  {
                      systemId: res.project.id,
                      filePath: '/',
                      projectTitle: res.project.description,
                  }
              );
          }
      );
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
