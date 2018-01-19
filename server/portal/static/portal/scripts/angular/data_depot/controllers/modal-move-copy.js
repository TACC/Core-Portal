function ModalMoveCopy($scope, $uibModalInstance, $state, FileListing, SystemsService, ProjectService, data) {
  'ngInject';
  $scope.data = data;

  $scope.state = {
    busy: false,
    error: null,
    listingProjects: false
  };

  $scope.systems = SystemsService.systems;
  var mydata_system = _.find($scope.systems, {name: 'My Data'});
  $scope.options = [
    {label: 'My Data',
     conf: {system: mydata_system.systemId, path: ''},
     apiParams: {fileMgr: 'my-data', baseUrl: '/api/data-depot/files'}},
    {label: 'My Projects',
     conf: {system: 'projects', path: ''},
     apiParams: {fileMgr: 'shared', baseUrl: '/api/data-depot/files'}},
  ];

  $scope.currentOption = null;
  $scope.$watch('currentOption', function () {
    $scope.state.busy = true;
    var cOption = $scope.currentOption;
    if (cOption.conf.system != 'projects'){
      $scope.state.listingProjects = false;
      FileListing.get(cOption.conf, cOption.apiParams)
        .then(function (listing) {
          $scope.listing = listing;
          $scope.state.busy = false;
        });
    } else {
      $scope.state.listingProjects = true;
      ProjectService.list()
       .then(function(projects){
         $scope.projects = _.map(projects, function(p) {
           p.href = $state.href('projects.listing', {projectId: p.uuid});
           return p;});
         $scope.state.busy = false;
      });
    }

    if ($scope.currentOption.label === 'My Data') {
      $scope.customRoot = {
        name: 'My Data',
        system: mydata_system.systemId,
        path: '/'
      };
      $scope.project = null;
    } else {
      $scope.customRoot = {
        name: $scope.currentOption.label,
        system: $scope.currentOption.conf.system,
        path: $scope.currentOption.conf.path
      };
    }
  });
  $scope.currentOption = $scope.options[0];

  $scope.onBrowse = function ($event, fileListing) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.state.listingProjects = false;
    var system = fileListing.system || fileListing.id;
    var path = fileListing.path || '/';

    // If a project is selected
    if (fileListing.type === 'STORAGE') {
      $scope.project = fileListing;
    }


    $scope.state.busy = true;
    FileListing.get({system: system, path: path}, $scope.currentOption.apiParams)
      .then(function (listing) {
        $scope.listing = listing;
        $scope.state.busy = false;
      });
  };

  $scope.validDestination = function (fileListing) {
    return fileListing && ( fileListing.type === 'dir' || fileListing.type === 'folder') && fileListing.permissions && (fileListing.permissions === 'ALL' || fileListing.permissions.indexOf('WRITE') > -1);
  };

  $scope.chooseDestination = function (fileListing) {
    $uibModalInstance.close(fileListing);
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss();
  };

}

export default ModalMoveCopy;
