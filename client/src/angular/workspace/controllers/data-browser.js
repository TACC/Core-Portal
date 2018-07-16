import _ from 'underscore';

function DataBrowserCtrl($scope, $controller, $rootScope, SystemsService, DataBrowserService, ProjectService) {
  'ngInject';
  $controller('WorkspacePanelCtrl', {$scope: $scope});


  $scope.data = {
    loading: false,
    wants: null,
    systemList: [],
    filesListing: null,
    system: null,
    dirPath: [],
    filePath: '',
    loadingMore: false,
    reachedEnd: false,
    page: 0
  };

  SystemsService.listing().then(function (data){
    var mydata_system = _.find(data, {name: 'My Data'});
    var comdata_system = _.find(data, {name: 'Community Data'});
    $scope.data.options = [
      {label: 'My Data',
       conf: {system: mydata_system.systemId, path: ''},
       apiParams: {fileMgr: 'my-data', baseUrl: '/api/data-depot/files'}},
      {label: 'Community Data',
        conf: {system: comdata_system.systemId, path: ''},
        apiParams: {fileMgr: 'shared', baseUrl: '/api/data-depot/files'}},
      // {label: 'My Projects',
      //  conf: {system: 'projects', path: ''},
      //  apiParams: {fileMgr: 'shared', baseUrl: '/api/data-depot/files'}},
    ];
    $scope.data.cOption = $scope.data.options[0];
    $scope.dataSourceUpdated();
  });

  $scope.dataSourceUpdated = function dataSourceUpdated() {
    $scope.data.filesListing = null;
    $scope.data.loading = true;
    $scope.data.filePath = '';
    $scope.data.dirPath = [];
    DataBrowserService.apiParams.fileMgr = $scope.data.cOption.apiParams.fileMgr;
    DataBrowserService.apiParams.baseUrl = $scope.data.cOption.apiParams.baseUrl;
    if ($scope.data.cOption.label !== 'My Projects'){
      $scope.data.listingProjects = false;
      $scope.data.project = null;
      DataBrowserService.browse($scope.data.cOption.conf).then(function(listing) {
        $scope.data.filesListing = listing;
        if ($scope.data.filesListing.children.length > 0){
          $scope.data.filePath = $scope.data.filesListing.path;
          $scope.data.dirPath = $scope.data.filePath.split('/');
        }
        $scope.data.loading = false;
      }, function(err){
        $scope.data.error = 'Unable to list the selected data source: ' + err.statusText;
        $scope.data.loading = false;
      });
    } else {
      $scope.data.listingProjects = true;
      ProjectService.list()
       .then(function(projects){
         $scope.data.projects = projects;
         $scope.data.loading = false;
      });
    }
  };

  $scope.scrollToTop = function(){
    return;
  };

  $scope.scrollToBottom = function(){
    if ($scope.data.loadingMore || $scope.data.reachedEnd){
      return;
    }
    $scope.data.loadingMore = true;
    if ($scope.data.filesListing && $scope.data.filesListing.children &&
        $scope.data.filesListing.children.length < 95){
      $scope.data.reachedEnd = true;
      return;
    }
    $scope.data.page += 1;
    $scope.data.loadingMore = true;
    DataBrowserService.browsePage(
               {system: $scope.data.filesListing.system,
                path: $scope.data.filesListing.path,
                page: $scope.data.page})
    .then(function(listing){
        $scope.data.filesListing = listing;
        $scope.data.filePath = $scope.data.filesListing.path;
        $scope.data.dirPath = $scope.data.filePath.split('/');
        $scope.data.loadingMore = false;
        if (listing.children.length < 95) {
          $scope.data.reachedEnd = true;
        }
        $scope.data.loading = false;
      }, function (err){
           $scope.data.loadingMore = false;
           $scope.data.reachedEnd = true;
           $scope.data.loading = false;
      });
  };

  $scope.browseTrail = function($event, index){
    $event.stopPropagation();
    $event.preventDefault();
    if ($scope.data.dirPath.length <= index+1){
      return;
    }
    $scope.browseFile({type: 'dir',
                       system: $scope.data.filesListing.system,
                       resource: $scope.data.filesListing.resource,
                       path: $scope.data.dirPath.slice(0, index+1).join('/')});
  };

  $scope.selectProject = function (project) {
    $scope.data.project = project;
    DataBrowserService.apiParams.fileMgr = 'shared';
    DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
    $scope.data.loading = true;
    DataBrowserService.browse({system: project.id, path: ''}).then(function (listing) {
      $scope.data.listingProjects = false;
      $scope.data.loading = false;
      $scope.data.filesListing = listing;
    });
  };


  $scope.browseFile = function(file){
    if (file.type !== 'folder' && file.type !== 'dir'){
      return;
    }
    $scope.data.filesListing = null;
    $scope.data.loading = true;
    DataBrowserService.browse(file)
      .then(function(listing) {
        $scope.data.filesListing = listing;
        if ($scope.data.filesListing.children.length > 0){
          $scope.data.filePath = $scope.data.filesListing.path;
          $scope.data.dirPath = $scope.data.filePath.split('/');
          $scope.browser.listing = $scope.data.filesListing;
        }
        $scope.data.loading = false;
      }, function(err){
        $scope.data.error = 'Unable to list the selected data source: ' + err.statusText;
        $scope.data.loading = false;
      });
  };

  $scope.chooseFile = function(file) {
     if ($scope.data.wants) {
       $rootScope.$broadcast('provides-file', {requestKey: $scope.data.wants.requestKey, file: file});
    }
  };

  $rootScope.$on('wants-file', function($event, wantArgs) {
    $scope.data.wants = wantArgs;
    if ($scope.panel.collapsed) {
      $scope.data.wants.wasCollapsed = true;
      $scope.panel.collapsed = false;
    }
  });

  $rootScope.$on('cancel-wants-file', function($event, args) {
    if ($scope.data.wants && $scope.data.wants.requestKey === args.requestKey) {
      if ($scope.data.wants.wasCollapsed) {
        $scope.panel.collapsed = true;
      }
      $scope.data.wants = null;
    }
  });

}

export default DataBrowserCtrl;
