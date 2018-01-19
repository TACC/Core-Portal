import searchResult from './search-result';
let mod = angular.module('portal.search.directives', []);
console.log(searchResult)

mod.directive('searchResult', searchResult);

export default mod;
