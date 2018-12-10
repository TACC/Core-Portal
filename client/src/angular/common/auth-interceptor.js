
export default class AuthInterceptor {
  constructor ($window, $q) {
    'ngInject';
    this.$window = $window;
    this.$q = $q;
    // needed as es6 this and angular callbacks can get weird...
    this.responseError = this.responseError.bind(this);
  }

  responseError (resp) {
    if (resp.status == 401) {
      this.$window.location.href = "/login";
    }
    return this.$q.reject(resp);
  }
}
