import {mod as services} from './services';
import {mod as controllers} from './controllers';
import {mod as directives} from './directives'

let mod = angular.module('portal.search', [
  'portal.search.services',
  'portal.search.controllers',
  'portal.search.directives'
]);
