/**
 * Systems Service
 * @param {Object} $http - Angular HTTP service
 * @param {Object} $q - Angular Q service
 */
function SystemsService($http, $q) {
    'ngInject';
    let self = this;
    self.systems = null;

    /**
   * Returns a system's definition
   * @param {string} systemId - System Id
   * @return {Object} System
   */
    this.get = (systemId)=>{
        return $http.get('/api/accounts/systems/' + systemId)
            .then((resp)=>{
                return resp.data.response;
            });
    };

    /**
   * Returns a list of systems for a specific user
   *
   * @return {Array} An array of systems
   */
    this.listing = ()=>{
        return $http.get('/api/data-depot/systems/list')
            .then((resp)=>{
                self.systems = resp.data.response;
                return resp.data.response;
            });
    };

    /**
   * Returns a list of ALL systems for a specific user
   * @param {boolean} publicKeys - If `true` the response will
   *  include public keys
   * @param {number} limit - Limit count of results
   * @param {number} offset - Offset count
   * @return {Array} an array of systems
   */
    this.list = function(publicKeys=true, limit=100, offset=0) {
        let params = {
            publicKeys: publicKeys,
            limit: limit,
            offset: offset,
            thisPortal: true,
        };
        return $http.get(
            '/api/accounts/systems/list?publicKey',
            {params: params}
        ).then((resp)=>{
            return resp.data.response;
        });
    };

    /**
   * Tests a system
   * @function
   * @param {Object} sys - System object
   * @return {Object} test result
   */
    this.test = (sys)=>{
        return $http.put(
            '/api/accounts/systems/' + sys.id + '/test'
        ).then((resp)=>{
            return resp.data;
        });
    };

    /**
   * Resets a system's keys
   * @function
   * @param {Object} sys - System object
   * @return {Object} result
   */
    this.resetKeys = (sys)=>{
        return $http.put(
            '/api/accounts/systems/' + sys.id + '/keys',
            {action: 'reset'}
        ).then((resp)=>{
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
   * @return {Object} result
   */
    this.pushKeys = (sysId, form)=>{
        return $http.put(
            '/api/accounts/systems/' + sysId + '/keys',
            {
                action: 'push',
                form: form,
            }
        ).then((resp)=>{
            return resp.data;
        },
        (err)=>{
            return $q.reject(err);
        });
    };
}

export default SystemsService;
