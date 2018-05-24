import angular from 'angular';
import Apps from './apps-service';
import Jobs from './jobs-service';
import MultipleList from './multiple-list-service';
import Notifications from './notifications-service';
import SimpleList from './simple-list-service';
import Systems from './systems-service';

let mod = angular.module('portal.workspace.services', []);

mod.factory('Apps', Apps);
mod.factory('Jobs', Jobs);
mod.service('MultipleList', MultipleList);
mod.service('Notifications', Notifications);
mod.service('SimpleList', SimpleList);
mod.service('Systems', Systems);

export default mod;
