import _ from 'underscore';

export default function ProjectListingCtrl($scope, $state, $stateParams, Django, ProjectService, DataBrowserService){
  'ngInject';
  $scope.data = {
    customRoot: {
      name: 'My Projects',
      route: 'wb.data_depot.projects.list'
    }
  };
  $scope.systemId = $stateParams.systemId;
  var options = {
    system: $scope.systemId,
    path: ($stateParams.filePath)
  };
  DataBrowserService.apiParams.fileMgr = 'shared';
  DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
  DataBrowserService.apiParams.searchState = 'dataSearch';
  $scope.browser = DataBrowserService.state();
  DataBrowserService.browse(options).then(function (resp) {
    $scope.browser = DataBrowserService.state();
  });



  //This adds the project to the breadcrumbs
  $scope.searchState = DataBrowserService.apiParams.searchState;
  ProjectService.list().then(function (resp) {
    var prj = _.find(resp, {id: $scope.systemId});
    $scope.data.project = prj;
  });

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

  $scope.onBrowse = function ($event, file) {
    $event.preventDefault();
    $event.stopPropagation();
    if (file.type === 'file') {
      DataBrowserService.preview(file, $scope.browser.listing);
    } else {
      $state.go('wb.data_depot.projects.listing', {systemId: file.system, filePath: file.path});
    }
  };
}
