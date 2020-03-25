import angular from 'angular';
import NavSearchCtrl from './nav';
import SearchViewCtrl from './search-view';
let mod = angular.module('portal.search.controllers', []);

mod.controller('NavSearchCtrl', NavSearchCtrl);
mod.controller('SearchViewCtrl', SearchViewCtrl);

export default mod;
