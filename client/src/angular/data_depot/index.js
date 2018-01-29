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
    .state(
      'db', {
        url: '/data-depot',
        abstract: true,
        template: '<ui-view/>',
        resolve: {
          'systems': ['SystemsService', function(SystemsService) {
            return SystemsService.listing();
          }]
        }
      }
    )
    .state('db.myData', {
      url: '/agave/{systemId}/{filePath:any}/',
      controller: 'MyDataCtrl',
      templateUrl: '/static/src/angular/data_depot/templates/agave-data-listing.html',
    })
    .state('db.projects', {
      url: '/projects/',
      abstract: true,
    })
    .state('db.projects.list', {
      url: '',
      controller: 'ProjectListCtrl',
      templateUrl: '/static/src/angular/data_depot/templates/project-list.html',
    })
    .state('db.projects.listing', {
      url: '{systemId}/{filePath:any}',
      controller: 'ProjectListingCtrl',
      templateUrl: '/static/src/angular/data_depot/templates/agave-data-listing.html',
    })
    .state('db.communityData', {
      url: '/public/{systemId}/{filePath:any}',
      controller: 'CommunityDataCtrl',
      templateUrl: '/static/src/angular/data_depot/templates/agave-data-listing.html',
      params: {
        filePath: '/'
      },
    })
    .state('sharedData', {
      url: '/shared/{systemId}/{filePath:any}/',
      controller: 'SharedDataCtrl',
      templateUrl: '/static/src/angular/data-depot/templates/agave-shared-data-listing.html',
      params: {
        systemId: 'utportal.storage.default',
        filePath: '$SHARE'
      },
      resolve: {
        'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
          var systemId = $stateParams.systemId || 'utportal.storage.default';
          var filePath = $stateParams.filePath || '$SHARE/';

          DataBrowserService.apiParams.fileMgr = 'agave';
          DataBrowserService.apiParams.baseUrl = '/api/agave/files';
          DataBrowserService.apiParams.searchState = 'sharedDataSearch';
          return DataBrowserService.browse({system: systemId, path: filePath});
        }],
        'auth': function($q) {
          if (Django.context.authenticated) {
            return true;
          } else {
            return $q.reject({
              type: 'authn',
              context: Django.context
            });
          }
        }
      }
    })
    .state('dropboxData', {
      url: '/dropbox/{filePath:any}',
      controller: 'ExternalDataCtrl',
      templateUrl: '/static/scripts/data-depot/templates/dropbox-data-listing.html',
      params: {
        filePath: '',
        name: 'Dropbox',
        customRootFilePath: 'dropbox/'
      },
      resolve: {
        'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
          var filePath = $stateParams.filePath || '/';
          DataBrowserService.apiParams.fileMgr = 'dropbox';
          DataBrowserService.apiParams.baseUrl = '/api/external-resources/files';
          DataBrowserService.apiParams.searchState = undefined;
          return DataBrowserService.browse({path: filePath});
        }],
        'auth': function($q) {
          if (Django.context.authenticated) {
            return true;
          } else {
            return $q.reject({
              type: 'authn',
              context: Django.context
            });
          }
        }
      }
    });

}

mod.config(config)
  .run(['$rootScope', '$location', '$state', 'Django', '$trace', function($rootScope, $location, $state, Django, $trace) {

    // $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
    //   if (toState.name === 'myData' || toState.name === 'sharedData') {
    //     var ownerPath = new RegExp('^/?' + Django.user).test(toParams.filePath);
    //     if (toState.name === 'myData' && !ownerPath) {
    //       event.preventDefault();
    //       $state.go('sharedData', toParams);
    //     } else if (toState.name === 'sharedData' && ownerPath) {
    //       event.preventDefault();
    //       $state.go('myData', toParams);
    //     }
    //   }
    // });

    $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
      if (error.type === 'authn') {
        var redirectUrl = $state.href(toState.name, toParams);
        window.location = '/login/?next=' + redirectUrl;
      }
    });
  }]);

export default mod;
