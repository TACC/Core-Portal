import {mod as directives} from './ng-designsafe-directives';
import {mod as filters} from './ng-designsafe-filters';
import {mod as ng_modernizer} from './ng-modernizr';
import {mod as workspace} from './workspace';
import {mod as data_depot} from './data_depot';
import {mod as search} from './search';

function config($httpProvider, $locationProvider, $urlMatcherFactoryProvider) {
 'ngInject';
 $locationProvider.html5Mode({ enabled: true, requireBase: true, rewriteLinks: false});
 // $urlMatcherFactoryProvider.strictMode(false);
 $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
 $httpProvider.defaults.xsrfCookieName = 'csrftoken';
 $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
}

let mod = angular.module('portal', [
  'ngCookies',
  'httpi',
  'ui.bootstrap',
  'ui.router',
  'schemaForm',
  'dndLists',
  'xeditable',
  'pascalprecht.translate',
  'ngStorage',
  'ngWebSocket',
  'ngMaterial',
  'ng.modernizr',
  'django.context',
  'portal.directives',
  'portal.filters',
  'portal.workspace',
  'portal.data_depot',
  'portal.search',
]).config(config);

export default mod;
