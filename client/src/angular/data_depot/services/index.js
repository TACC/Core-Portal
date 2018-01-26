import SystemsService from './systems-service';
import FileListing from './file-listing';
import DataBrowserService from './data-browser-service';
import ProjectService from './project-service';

let mod = angular.module('portal.data_depot.services', []);

mod.service('SystemsService', SystemsService);
mod.factory('FileListing', FileListing);
mod.factory('DataBrowserService', DataBrowserService);
mod.factory('ProjectService', ProjectService);
console.log(mod)
export default mod;
