import angular from 'angular';
import $ from 'jquery';

 function ApplicationTrayCtrl($location, $scope, $rootScope, $q, $timeout, $uibModal, $state, $stateParams, $translate, Apps, SimpleList, MultipleList, Notifications, $mdToast) {
  'ngInject';
  $scope.tabs = [];

  $scope.simpleList = new SimpleList();

  $scope.addDefaultTabs = function (query) {
    $scope.error = '';
    var self = this;
    var deferred = $q.defer();

    var body = {};
    body.permission = 'READ';

    // Only needed on tacc.prod tenant where we do not own the agave tenant admin
    Apps.shareAppsWithUser(body, query).then(
      $scope.simpleList.getDefaultLists(query)
        .then(function(response){
          deferred.resolve(response);
        })
        .catch(function(response){
          $scope.error = $translate.instant('error_tab_get') + response.data;
          deferred.reject(response);
        })
    );
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

  $scope.refreshApps = function () {
    $scope.error = '';
    $scope.requesting = true;
    $scope.tabs = [];

    if ($stateParams.appId) {
      Apps.getMeta($stateParams.appId)
        .then(
        function (response) {
          if (response.data.length > 0) {
            if (response.data[0].value.definition.available) {
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
        function (response) {
          $mdToast.show($mdToast.simple()
            .content($translate.instant('error_app_run'))
            .toastClass('warning')
            .parent($("#toast-container")));
        }
        );
    }

    $scope.addDefaultTabs('{{"$and": [{{"name": "{apps_metadata_name}"}}, {{"value.definition.available": true}}]}}')
      .then(function(response){
        $scope.simpleList.tabs.forEach(function (element) {
          $scope.tabs.push(
            {
              title: element,
              content: $scope.simpleList.lists[element],
              count: $scope.simpleList.lists[element].length
            }
          );
        }, this);

        $scope.activeTab = null;
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

    $scope.data.activeApp = app;
    $rootScope.$broadcast('launch-app', app);

    $scope.activeTab = null;
  };

  var outsideClick = false;
  $scope.closeTab = function (event, tab) {
    if (outsideClick) {
      $scope.activeTab = null;
    }
  };

  $(document).mousedown(function (event) {
    var element = $(event.target);
    var workspaceTab = element.closest(".workspace-tab");
    var appsTray = element.closest("div .apps-tray");

    // Want all tabs to be inactive whenever user clicks outside the tab-tray.
    if (!(appsTray.length > 0 || workspaceTab.length > 0) && $scope.activeTab != null) {
      outsideClick = true;
    } else {
      outsideClick = false;

      // If user clicks on same tab, close tab.
      if (workspaceTab.length == 1 && $scope.activeTab != null && workspaceTab[0].innerText.includes($scope.tabs[$scope.activeTab].title)) {
        if (workspaceTab.hasClass("active")) {
          $scope.activeTab = null;
        }
      }
    }    
  });
}

export default ApplicationTrayCtrl;
