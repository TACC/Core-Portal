export default function MyDataCtrl($scope, $state, $stateParams, Django, DataBrowserService) {
  'ngInject';
  var options = {
    system: ($stateParams.systemId),
    path: ($stateParams.filePath)
  };
  $scope.data = {
    user: Django.user,
    customRoot: {
      name: 'My Data',
      href: $state.href('db.myData', {systemId: $stateParams.systemId,
                                          filePath: '/'})
    }
  };
  // TODO: Fix this listing thing
  DataBrowserService.apiParams.fileMgr = 'my-data';
  DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
  DataBrowserService.apiParams.searchState = 'dataSearch';

  $scope.browser = DataBrowserService.state();
  DataBrowserService.browse(options).then(function (resp) {
    $scope.browser = DataBrowserService.state();
    $scope.searchState = DataBrowserService.apiParams.searchState;

  });
  // if (! $scope.browser.error) {
  //   $scope.browser.listing.href = $state.href('db.myData', {
  //     system: $scope.browser.listing.system,
  //     filePath: $scope.browser.listing.path
  //   });
  //   _.each($scope.browser.listing.children, function (child) {
  //     child.href = $state.href('db.myData', {system: child.system, filePath: child.path});
  //   });
  // }



  $scope.scrollToTop = function(){
    return;
  };
  $scope.scrollToBottom = function(){
    DataBrowserService.scrollToBottom();
  };

  $scope.resolveBreadcrumbHref = function (trailItem) {
    return $state.href('db.myData', {systemId: $scope.browser.listing.system, filePath: trailItem.path});
  };

  $scope.onBrowse = function ($event, file) {
    $event.preventDefault();
    $event.stopPropagation();
    if (file.type === 'file') {
      DataBrowserService.preview(file, $scope.browser.listing);
    } else {
      $state.go('db.myData', {systemId: file.system, filePath: file.path});
    }
  };

  $scope.onSelect = function($event, file) {
    $event.stopPropagation();
    if ($event.ctrlKey || $event.metaKey) {
      var selectedIndex = $scope.browser.selected.indexOf(file);
      if (selectedIndex > -1) {
        DataBrowserService.deselect([file]);
      } else {
        DataBrowserService.select([file]);
      }
    } else if ($event.shiftKey && $scope.browser.selected.length > 0) {
      var lastFile = $scope.browser.selected[$scope.browser.selected.length - 1];
      var lastIndex = $scope.browser.listing.children.indexOf(lastFile);
      var fileIndex = $scope.browser.listing.children.indexOf(file);
      var min = Math.min(lastIndex, fileIndex);
      var max = Math.max(lastIndex, fileIndex);
      DataBrowserService.select($scope.browser.listing.children.slice(min, max + 1));
    } else if( typeof file._ui !== 'undefined' &&
               file._ui.selected){
      DataBrowserService.deselect([file]);
    } else {
      DataBrowserService.select([file], true);
    }
  };

  $scope.onDetail = function($event, file) {
    $event.stopPropagation();
    DataBrowserService.preview(file, $scope.browser.listing);
  };

}
