
export default class UserService {

  constructor($http, $q) {
    'ngInject';
    this.$http = $http;
    this.$q = $q;
    this.currentUser = {};
  }

  authenticate() {
    return this.$http.get('/auth/user/').then( (resp)=>{
      this.currentUser = resp.data;
    }, (err) =>{
      return this.$q.reject({"message": "auth error"});
    });
  }

  usage() {
    return this.$http.get('/api/users/usage/').then(function (resp) {
      return resp.data;
    });
  };

}
