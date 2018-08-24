import angular from 'angular';
import ddBreadcrumb from './dd-breadcrumb';

let mod = angular.module('portal.data_depot.directives', []);

mod.directive('ddBreadcrumb', ddBreadcrumb);
