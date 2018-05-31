import angular from 'angular';

 function ApplicationTrayCtrl($location, $scope, $rootScope, $q, $timeout, $uibModal, $state, $stateParams, $translate, Apps, SimpleList, MultipleList, Notifications) {
  'ngInject';
  $scope.tabs = [];

  $scope.simpleList = new SimpleList();

  $scope.addDefaultTabs = function (query) {
    $scope.error = '';
    var self = this;
    var deferred = $q.defer();

    $scope.simpleList.getDefaultLists(query)
      .then(function(response){
        deferred.resolve(response);
      })
      .catch(function(response){
        $scope.error = $translate.instant('error_tab_get') + response.data;
        deferred.reject(response);
      });
    return deferred.promise;
  };

  $scope.data = {
    activeApp: null,
    publicOnly: false,
    type: null
  };

  function closeApp(label) {
    $rootScope.$broadcast('close-app', label);
    $scope.data.activeApp = null;
  }

  $scope.$on('close-app', function(e, label) {
    if ($scope.data.activeApp && $scope.data.activeApp.label === label) {
      $scope.data.activeApp = null;
    }
  });

  $scope.refreshApps = function() {
    $scope.error = '';
    $scope.requesting = true;
    $scope.tabs = [];

    if ($stateParams.appId){
      Apps.getMeta($stateParams.appId)
        .then(
          function(response){
            if (response.data.length > 0){
              if (response.data[0].value.definition.available){
                $scope.launchApp(response.data[0]);
              } else {
                $mdToast.show($mdToast.simple()
                  .content($translate.instant('error_app_disabled'))
                  .toastClass('warning')
                  .parent($("#toast-container")));
              }
            } else {
              $mdToast.show($mdToast.simple()
                .content($translate.instant('error_app_run'))
                .toastClass('warning')
                .parent($("#toast-container")));
            }
          },
          function(response){
            $mdToast.show($mdToast.simple()
              .content($translate.instant('error_app_run'))
              .toastClass('warning')
              .parent($("#toast-container")));
          }
        );
    }

    $scope.addDefaultTabs({ "$and": [{ "name": `${$translate.instant('apps_metadata_name')}` }, { "value.definition.available": true }] })
      .then(function(){
        var deferred = $q.defer();

        return deferred.promise;
      })
      .then(function(response){
        $scope.tabs.push(
          {
            title: 'Private',
            content: $scope.simpleList.lists['Private']
          }
        );

        $scope.tabs.push(
          {
            title: 'Public',
            content: $scope.simpleList.lists['Public']
          }
        );

        angular.forEach($scope.simpleList.lists, function(list, key){
          if (key !== 'Public' && key !== 'Private') {
            $scope.tabs.push({
              title: key,
              content: list
            });
          }
        });

        $scope.requesting = false;
      });
  };

  $scope.refreshApps();

  $scope.launchApp = function(app) {
    $state.go(
      'tray',
      {appId: app.value.definition.id},
      {notify: false}
    );

    if (!$scope.data.activeApp || $scope.data.activeApp.value.definition.id !== app.value.definition.id) {
      $scope.data.activeApp = app;
      $rootScope.$broadcast('launch-app', app);
    }
  };
};

export default ApplicationTrayCtrl;
