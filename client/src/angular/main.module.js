import angular from 'angular';

import * as schemaForm from 'angular-schema-form';
import 'angular-schema-form-bootstrap';
import * as ngMaterial from 'angular-material';
import * as ngMessages from 'angular-messages';
import * as ui_bootstrap from 'angular-ui-bootstrap';
import * as ui_router from 'angular-ui-router';
import * as ngSanitize from 'angular-sanitize';
import * as ngStorage from 'ng-storage';
import * as ngCookies from 'angular-cookies';
import * as ngAria from 'angular-aria';
import * as ngTranslate from 'angular-translate';
import * as xeditable from 'angular-xeditable';
import * as dndLists from 'angular-drag-and-drop-lists';
import * as ngAnimate from 'angular-animate';

import {mod as directives} from './ng-portal-directives';
import {mod as filters} from './ng-portal-filters';
import {mod as ng_modernizer} from './ng-modernizr';
import {mod as workspace} from './workspace';
import {mod as data_depot} from './data_depot';
import {mod as search} from './search';
import {mod as dashboard} from './dashboard';
import {mod as workbench} from './workbench';
import {mod as notifications} from './notifications';

//templates
import homeTemplate from './workbench/templates/home.html';
import dashboardTemplate from './workbench/templates/dashboard.html';
import dataDepotTemplate from './workbench/templates/data-depot.html';
import workspaceTemplate from './workbench/templates/workspace.html';
import searchTemplate from './workbench/templates/search.html';
import helpTemplate from './workbench/templates/help.html';
import notificationsTemplate from './workbench/templates/notifications.html';

function config($httpProvider, $locationProvider, $urlRouterProvider, $stateProvider) {
 'ngInject';
 $locationProvider.html5Mode({ enabled: true, requireBase: true, rewriteLinks: false});
 // $urlMatcherFactoryProvider.strictMode(false);
 $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
 $httpProvider.defaults.xsrfCookieName = 'csrftoken';
 $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

 $urlRouterProvider.otherwise('/workbench/dashboard');

 $stateProvider
  .state('wb', {
    url: '/workbench',
    template: homeTemplate,
    controller: 'WorkbenchCtrl',
    controllerAs: 'vm',
    abstract: true,
    resolve: {
      'systems': ['SystemsService', function(SystemsService) {
        return SystemsService.listing();
      }]
    }
  })
  .state('wb.dashboard', {
    'url': '/dashboard',
    'template': dashboardTemplate,
    'controller': 'DashboardCtrl',
    'resolve': {
      // 'test': function () {console.log("dashboard resolve");}
    }
  })
  .state('wb.data_depot', {
    'url': '/data-depot',
    'template': dataDepotTemplate,
    'controller': 'DataDepotCtrl',
    'resolve': {
      // 'test': function () {console.log("data-depot resolve");},
    }
  })
  .state('wb.workspace', {
    'url': '/workspace',
    'template': workspaceTemplate,
    'resolve': {
      // 'test': function () {console.log("workspace resolve");}
    }
  })
  .state('wb.help', {
    'url': '/help',
    'template': helpTemplate,
    'resolve': {
      // 'test': function () {console.log("help resolve");}
    }
  })
  .state('wb.notifications', {
    'url': '/notifications',
    'template': notificationsTemplate,
    'resolve': {
      // 'test': function () {console.log("help resolve");}
    }
  })
  .state('wb.search', {
    'url': '/search?query_string&type_filter',
    'template': searchTemplate,
    'params': {
      query_string: null,
      type_filter: 'cms',
      switch_filter: null
    },
    'resolve': {
      // 'test': function () {console.log("search resolve");}
    }
  });
}

let mod = angular.module('portal', [
  'ngCookies',
  'ngAria',
  'ngAnimate',
  'ui.bootstrap',
  'ui.router',
  'schemaForm',
  'dndLists',
  'xeditable',
  'pascalprecht.translate',
  'ngStorage',
  'ngSanitize',
  'ngMaterial',
  'ng.modernizr',
  'django.context',
  'portal.directives',
  'portal.filters',
  'portal.workspace',
  'portal.data_depot',
  'portal.search',
  'portal.dashboard',
  'portal.workbench',
  'portal.notifications',
])

  .config(config)
//  .run(['Notifications', function(Notifications) {
//    Notifications.connect();
//  }])
  .constant('appCategories', ['Simulation', 'Visualization', 'Data Processing', 'Utilities'])
  .constant('appIcons', ['compress', 'extract', 'matlab', 'paraview', 'hazmapper', 'jupyter', 'adcirc', 'qgis', 'ls-dyna', 'visit', 'openfoam', 'opensees']);

export default mod;
