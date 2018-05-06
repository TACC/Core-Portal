function SystemsService($http, $q) {
  'ngInject';
  var self = this;
  self.systems = null;
  
  /**
 * Returns a list of systems for a specific user
 * @function
 */
  this.listing = function () {
    return $http.get('/api/data-depot/systems/list').then(function (resp) {
      self.systems = resp.data.response;
      return resp.data.response;
    });
  };

  /**
 * Returns a list of ALL systems for a specific user
 * @function
 * @param {boolean} publicKeys - If `true` the response will
 *  include public keys
 * @param {number} limit - Limit count of results
 * @param {number} offest - Offset count
 */
  this.list = function(publicKeys=true, limit=100, offset=0) {
    let params = {
      publicKeys: publicKeys,
      limit: limit,
      offset: offset
    };
    return $http.get('/api/accounts/systems/list?publicKey',
                     {params:params})
      .then(function(resp){
        return resp.data.response;
      });
  };

  /**
 * Tests a system
 * @function
 * @param {Object} sys - System object
 */
  this.test = function _test(sys){
    return $http.put('/api/accounts/systems/' + sys.id + '/test').
      then(function(resp){
        return resp.data;
      });
  };

  /**
 * Resets a system's keys
 * @function
 * @param {Object} sys - System object
 */
  this.resetKeys = function _resetKeys(sys){
    return $http.put('/api/accounts/systems/' + sys.id + '/keys',
                     {action: 'reset'}).
      then(function(resp){
        return resp.data;
      });
  };

  /**
 * Pushed a system's public key to a host
 * @function
 * @param {Object} sysId - System object
 * @param {Object} form - Form
 * @param {string} form.hostname - Hostname
 * @param {string} form.password - Password
 * @param {string} form.token - Token
 */
  this.pushKeys = function _resetKeys(sysId, form){
    return $http.put(
      '/api/accounts/systems/' + sysId + '/keys',
      {
        action: 'push',
        form: form
      }).
      then(function(resp){
        return resp.data;
      },
      function(err){
        return $q.reject(err);
      });
  };
}

export default SystemsService;
