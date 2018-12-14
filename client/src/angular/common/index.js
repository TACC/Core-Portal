import UserSearchComponent 
    from './components/user-search/user-search.component';
import UserService from './user-service';
import SystemsService from './systems-service';
import AuthInterceptor from './auth-interceptor';

let mod = angular.module('portal.common', []);

mod.component('userSearch', UserSearchComponent);
mod.service('UserService', UserService);
mod.service('SystemsService', SystemsService);
mod.service('AuthInterceptor', AuthInterceptor);
export default mod;
