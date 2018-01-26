

function SystemsService($http, $q) {
  'ngInject';
  var self = this;
  self.systems = null;

  this.listing = function () {
    return $http.get('/api/data-depot/systems/list').then(function (resp) {
      self.systems = resp.data.response;
      return resp.data.response;
    });
  };
}

export default SystemsService;
