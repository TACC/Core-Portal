import angular from 'angular';
import Apps from './apps-service';
import Jobs from './jobs-service';
import SimpleList from './simple-list-service';

let mod = angular.module('portal.workspace.services', []);

mod.service('Apps', Apps);
mod.service('Jobs', Jobs);
mod.service('SimpleList', SimpleList);

export default mod;
