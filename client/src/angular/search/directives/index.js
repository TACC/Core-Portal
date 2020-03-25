import angular from 'angular';
import searchResult from './search-result';
let mod = angular.module('portal.search.directives', []);

mod.directive('searchResult', searchResult);

export default mod;
