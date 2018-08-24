import _ from 'underscore';


function MainCtrl($scope, DataBrowserService, SystemsService, $state, $stateParams, $timeout, $location) {
  'ngInject';

  // TODO: There must be a more 'angular' way to do this...
  if ($location.path() == '/data-depot/') {
    SystemsService.listing().then(function (resp) {
      var my_data = _.find(resp, {name: 'My Data'});
      $state.go('db.myData', {
        systemId: my_data.systemId,
        filePath: ''
      });
    });
  }
  // }, 100);
}

export default MainCtrl;
