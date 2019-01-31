import angular from 'angular';
import './services';
import './components';
import './controllers';
import './directives';
import '../workbench/components';
import './css/data-browser-service-preview.css';

import './projects';

//templates
import projectListTemplate from './templates/project-list.html';

let mod = angular.module('portal.data_depot', [
    'portal.data_depot.services',
    'portal.data_depot.components',
    'portal.data_depot.controllers',
    'portal.data_depot.directives',
    'portal.workbench.components',
    'portal.data_depot.projects',
    'ui.bootstrap',
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
            url: '/{directory}/{systemId}{filePath:any}?query_string&offset&limit',
            component: 'dataViewComponent',
            params: {
                systemId: {value: '', squash: true},
                name: {value: '', squash: true},
                directory: {value: ''},
                query_string: null,
                offset: null,
                limit: null
            },
        }
    )
    .state('wb.data_depot.projects', {
      url: '/projects/',
      abstract: true,
    })
    .state('wb.data_depot.projects.list', {
      url: '',
      template: projectListTemplate,
      controller: 'ProjectListCtrl'
    })
    .state('wb.data_depot.projects.listing', {
        url: '{systemId}/{filePath:any}',
        component: 'projectListingComponent',
        params: {
            projectId: false,
        },
        resolve: {
            params: ($stateParams)=>{
                'ngInject';
                return {
                    systemId: $stateParams.systemId,
                    filePath: $stateParams.filePath,
                    projectId: $stateParams.projectTitle,
                    browseState: 'wb.data_depot.projects.listing'
                };
            }
        }
    });
}

mod.config(config)

export default mod;
