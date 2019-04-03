import angular from 'angular';
import FileListing from './file-listing';
import DataBrowserService from './data-browser-service';
import ProjectService from './project-service';
import ZipService from './zip-service';

let mod = angular.module('portal.data_depot.services', []);

mod.service('ZipService', ZipService);
mod.factory('FileListing', FileListing);
mod.factory('DataBrowserService', DataBrowserService);
mod.factory('ProjectService', ProjectService);

export default mod;
