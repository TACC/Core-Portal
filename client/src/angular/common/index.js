
import UserService from './user-service';

let mod = angular.module('portal.common', []);

mod.service('UserService', UserService);

export default mod;
