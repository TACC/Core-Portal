import angular from "angular";
import WorkbenchCtrl from './controllers/workbench';
import {mod as components} from './components';

let mod = angular.module(
  'portal.workbench',
  [
    'portal.workbench.components',
  ]);

mod.controller('WorkbenchCtrl', WorkbenchCtrl);

export default mod;
