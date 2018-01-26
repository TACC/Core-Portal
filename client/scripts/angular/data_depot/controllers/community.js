export default function CommunityDataCtrl($scope, $state, $stateParams, Django, DataBrowserService) {
  'ngInject';

  var options = {
     system: ($stateParams.systemId),
     path: ($stateParams.filePath || '/')
  };
  $scope.data = {
    customRoot: {
      name: 'Community Data',
      href: $state.href('db.communityData', {systemId: $stateParams.systemId,
                                          filePath: '/'})
    }
  };
  DataBrowserService.apiParams.fileMgr = 'shared';
  DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
  DataBrowserService.apiParams.searchState = 'dataSearch';

  $scope.browser = DataBrowserService.state();
  DataBrowserService.browse(options).then(function (resp) {
    $scope.browser = DataBrowserService.state();
  });

  $scope.state = {
        loadingMore : false,
        reachedEnd : false,
        page : 0
      };

  // if (! $scope.browser.error){
  //   $scope.browser.listing.href = $state.href('communityData', {
  //     system: $scope.browser.listing.system,
  //     filePath: $scope.browser.listing.path
  //   });
  //   _.each($scope.browser.listing.children, function (child) {
  //     child.href = $state.href('communityData', {system: child.system, filePath: child.path});
  //   });
  // }



  $scope.resolveBreadcrumbHref = function(trailItem) {
    return $state.href('db.communityData', {systemId: $scope.browser.listing.system, filePath: trailItem.path});
  };

  $scope.scrollToTop = function(){
    return;
  };
  $scope.scrollToBottom = function(){
    DataBrowserService.scrollToBottom();
  };

  $scope.onBrowse = function($event, file) {
    $event.preventDefault();
    $event.stopPropagation();

    var systemId = file.system || file.systemId;
    var filePath;
    if (file.path == '/'){
      filePath = file.path + file.name;
    } else {
      filePath = file.path;
    }
    if (file.type === 'file'){
      DataBrowserService.preview(file, $scope.browser.listing);
    } else {
      $state.go('db.communityData', {systemId: file.system, filePath: file.path});
    }
  };

  $scope.onSelect = function($event, file) {
    $event.preventDefault();
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
    } else if (typeof file._ui !== 'undefined' &&
               file._ui.selected){
      DataBrowserService.deselect([file]);
    } else {
      DataBrowserService.select([file], true);
    }
  };

  $scope.showFullPath = function(item){
    if ($scope.browser.listing.path != '$PUBLIC' &&
        item.parentPath() != $scope.browser.listing.path &&
        item.parentPath() != '/'){
      return true;
    } else {
      return false;
    }
  };

  $scope.onDetail = function($event, file) {
    $event.stopPropagation();
    DataBrowserService.preview(file, $scope.browser.listing);
  };

  $scope.renderName = function(file){
    if (typeof file.metadata === 'undefined' ||
        file.metadata === null ||
        _.isEmpty(file.metadata)){
      return file.name;
    }
    var pathComps = file.path.split('/');
    var experiment_re = /^experiment/;
    if (file.path[0] === '/' && pathComps.length === 2) {
      return file.metadata.project.title;
    }
    else if (file.path[0] !== '/' &&
             pathComps.length === 2 &&
             experiment_re.test(file.name.toLowerCase())){
      return file.metadata.experiments[0].title;
    }
    return file.name;
  };

}
