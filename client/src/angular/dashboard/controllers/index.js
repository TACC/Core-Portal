import angular from 'angular';
import DashboardCtrl from './dashboardCtrl';


let mod = angular.module('portal.dashboard.controllers', ['portal.workbench.components']);

mod.controller('DashboardCtrl', DashboardCtrl);

export default mod;
