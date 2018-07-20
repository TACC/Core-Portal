import angular from 'angular';
import './services';
import './controllers';
import './directives';
import '../workbench/components';

//templates
import agaveDataListingTemplate from './templates/agave-data-listing.html';

let mod = angular.module('portal.data_depot', [
    'portal.data_depot.services',
    'portal.data_depot.controllers',
    'portal.data_depot.directives',
    'portal.workbench.components',
]);

/**
 * Configuration for module
 * @param {Object} $httpProvider - Angular prov
 * @param {Object} $locationProvider - Angular prov
 * @param {Object} $stateProvider - UI Router prov
 * @param {Object} $qProvider - Angular prov
 * @param {Object} $urlRouterProvider - UI Router prov
 * @param {Object} $urlMatcherFactoryProvider - Angular prov
 * @param {Object} Django - Django factory provider (custom)
 */

function config(
    $httpProvider,
    $locationProvider,
    $stateProvider,
    $qProvider,
    $urlRouterProvider,
    $urlMatcherFactoryProvider,
    Django
) {
    'ngInject';
    $qProvider.errorOnUnhandledRejections(false);
    $stateProvider.state(
        'wb.data_depot.db', {
            url: '/{directory}/{systemId}{filePath:any}?query_string',
            template: agaveDataListingTemplate,
            controller: 'DataDepotCtrl',
            params: {
                systemId: {value: '', squash: true},
                name: {value: '', squash: true},
                directory: {value: ''},
                query_string: null,
            },
        })
        // .state('communityData', {
        //     // url: '/community/',
        //     // template: '<pre>local/communityData.html</pre>'
        //     url: '/public/designsafe.storage.community/{filePath:any}',
        //     controller: 'CommunityDataCtrl',
        //     templateUrl: '/static/scripts/data-depot/templates/agave-data-listing.html',
        //     params: {
        //         systemId: 'designsafe.storage.community',
        //         filePath: '/'
        //     },
        //     resolve: {
        //         'listing': ['$stateParams', 'DataBrowserService', function ($stateParams, DataBrowserService) {
        //             var options = {
        //                 system: ($stateParams.systemId || 'designsafe.storage.community'),
        //                 path: ($stateParams.filePath || '/')
        //             };
        //             // if (options.path === '/') {
        //             // options.path = Django.user;
        //             // }
        //             DataBrowserService.apiParams.fileMgr = 'community';
        //             DataBrowserService.apiParams.baseUrl = '/api/public/files';
        //             DataBrowserService.apiParams.searchState = 'communityDataSearch';
        //             return DataBrowserService.browse(options);
        //         }],
        //         'auth': function ($q) {
        //             return true;
        //         }
        //     }
        // })
    ;

    $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get('$state');

        /* Default to MyData for authenticated users, communityData for anonymous */
        if (Django.context.authenticated) {
            $state.go('wb.data_depot.db', {
                systemId: 'polar.storage.default',
                filePath: Django.user,
                directory: '',
                name: 'My Data'
            });
        } else {
            $state.go('wb.data_depot.db', {
                systemId: 'polar.storage.community',
                filePath: '',
                directory: 'public',
                name: 'Community Data'
            }
        );
        }
    });
}

mod.config(config)
    .run([
        '$rootScope',
        '$location',
        '$state',
        'Django',
        '$trace',
        (
            $rootScope,
            $location,
            $state,
            Django,
            $trace
        )=> {
            $rootScope.$on(
                '$stateChangeError',
                (
                    event,
                    toState,
                    toParams,
                    fromState,
                    fromParams, error
                )=>{
                    if (error.type === 'authn') {
                        let redirectUrl = $state.href(toState.name, toParams);
                        window.location = '/login/?next=' + redirectUrl;
                    }
                }
            );
        },
    ]);

export default mod;
