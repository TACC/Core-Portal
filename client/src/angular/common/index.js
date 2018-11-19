
import UserService from './user-service';
import SystemsService from './systems-service';

let mod = angular.module('portal.common', []);

mod.service('UserService', UserService);
mod.service('SystemsService', SystemsService);

export default mod;
