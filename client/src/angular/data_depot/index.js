import angular from 'angular';
import './services';
import './controllers';
import './directives';
import '../workbench/components';

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
            url: '/{directory}/{systemId}/{filePath:any}',
            templateUrl: '/static/src/angular/data_depot/' +
                         'templates/agave-data-listing.html',
            controller: 'DataDepotCtrl',
            params: {
                systemId: {value: '', squash: true},
                name: {value: '', squash: true},
                directory: {value: ''},
            },
        }
    );
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
