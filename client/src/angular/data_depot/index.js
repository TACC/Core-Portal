import {mod as services} from './services';
import {mod as controllers} from './controllers';
import {mod as directives}from './directives';

let mod = angular.module('portal.data_depot', [
  'portal.data_depot.services',
  'portal.data_depot.controllers',
  'portal.data_depot.directives'
]);

function config($httpProvider, $locationProvider, $stateProvider, $qProvider, $urlRouterProvider, $urlMatcherFactoryProvider, Django) {
  'ngInject';
  $qProvider.errorOnUnhandledRejections(false);
  $stateProvider  
    /* Private */
    //.state(selection)
    .state('wb.data_depot.db', {
        url: '/{directory}/{systemId}/{filePath:any}',
        templateUrl: '/static/src/angular/data_depot/templates/agave-data-listing.html',
        controller: 'DataDepotCtrl',
        params: {
          systemId: {value: '', squash: true},
          name: {value:'', squash: true},
          directory: {value:''}
        }
      }
    );
}

mod.config(config)
  .run(['$rootScope', '$location', '$state', 'Django', '$trace', function($rootScope, $location, $state, Django, $trace) {

    $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
      if (error.type === 'authn') {
        var redirectUrl = $state.href(toState.name, toParams);
        window.location = '/login/?next=' + redirectUrl;
      }
    });
  }]);

export default mod;
