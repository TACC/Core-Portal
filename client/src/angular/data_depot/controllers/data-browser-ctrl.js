export default function DataBrowserCtrl($scope, $state, $stateParams, Django, DataBrowserService, SystemsService) {
    'ngInject';

    
    SystemsService.listing().then(function (resp) {
        $scope.sysCommunityData = _.find(resp, { name: 'Community Data' });
        $scope.sysMyData = _.find(resp, { name: "My Data" });
        console.log('SYSTEM SERVICE ----------->');
        console.log($scope.sysMyData.name);
        console.log($scope.sysMyData.systemId);
    });


    //  $stateParams is pulling info from the html section of the data-depot
    //  and we will swap the data based on the systemID variables we place there
    //  'options' will contain the different variables required to change the data
    var options = {
        system: ($stateParams.systemId),
        path: ($stateParams.filePath),
        name: ($stateParams.name),
        directory: ($stateParams.directory)
    };

    console.log('options ---->');
    console.log(options);

    
    // this should change based on variables in options
    $scope.data = {
      user: Django.user,
      customRoot: {
        name: $stateParams.name,
        href: $state.href('db', {
            systemId: $stateParams.systemId,
            filePath: $stateParams.filePath,
            directory: $stateParams.directory
        })
      }
    };

    // TODO: This needs to change base on the "options" supplied
    DataBrowserService.apiParams.fileMgr = 'my-data';
    DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
    DataBrowserService.apiParams.searchState = 'dataSearch';

    
    // same
    $scope.browser = DataBrowserService.state();
    DataBrowserService.browse(options).then(function (resp) {
      $scope.browser = DataBrowserService.state();
      //this line below is new...
      $scope.searchState = DataBrowserService.apiParams.searchState;
    });

    // missing $scope.state object - community

    // same
    $scope.scrollToTop = function(){
      return;
    };
    // same
    $scope.scrollToBottom = function(){
      DataBrowserService.scrollToBottom();
    };
    // check - community
    $scope.onBrowse = function ($event, file) {
      $event.preventDefault();
      $event.stopPropagation();
      if (file.type === 'file') {
        DataBrowserService.preview(file, $scope.browser.listing);
      }
    };
    
    // same
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
    // missing showFullPath function - community
    // missing renderName function - community
    
    // same
    $scope.onDetail = function($event, file) {
      $event.stopPropagation();
      DataBrowserService.preview(file, $scope.browser.listing);
    };
  }
  