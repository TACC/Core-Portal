
import UserService from './user-service';
import SystemsService from './systems-service';
import AuthInterceptor from './auth-interceptor';

let mod = angular.module('portal.common', []);

mod.service('UserService', UserService);
mod.service('SystemsService', SystemsService);
mod.service('AuthInterceptor', AuthInterceptor);
export default mod;
