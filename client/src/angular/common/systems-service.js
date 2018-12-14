import * as _ from 'underscore';

/**
 * Systems Service
 * @param {Object} $http - Angular HTTP service
 * @param {Object} $q - Angular Q service
 */
export default class SystemsService {
    constructor($http, $q) {
        'ngInject';
        this.systems = null;
        this.$http = $http;
        this.$q = $q;
    }

    /**
   * Returns a system's definition
   * @param {string} systemId - System Id
   * @return {Object} System
   */
    get(systemId) {
        return this.$http.get('/api/accounts/systems/' + systemId)
            .then((resp)=>{
                return resp.data.response;
            });
    }

    /**
   * Returns a list of systems for a specific user
   *
   * @return {Array} An array of systems
   */
    listing() {
        return this.$http.get('/api/data-depot/systems/list')
            .then((resp)=>{
                this.systems = resp.data.response;
                this.mydata_system = _.find(this.systems, (d)=>{return d.name === 'My Data';});
                return resp.data.response;
            });
    }

    /**
   * Returns a list of ALL systems for a specific user
   * @param {boolean} publicKeys - If `true` the response will
   *  include public keys
   * @param {number} limit - Limit count of results
   * @param {number} offset - Offset count
   * @return {Array} an array of systems
   */
    list(publicKeys=true, limit=100, offset=0) {
        let params = {
            publicKeys: publicKeys,
            limit: limit,
            offset: offset,
            thisPortal: true,
        };
        return this.$http.get(
            '/api/accounts/systems/list?publicKey',
            {params: params}
        ).then((resp)=>{
            return resp.data.response;
        });
    }

    /**
   * Tests a system
   * @function
   * @param {Object} sys - System object
   * @return {Object} test result
   */
    test(sys) {
        return this.$http.put(
            '/api/accounts/systems/' + sys.id + '/test'
        ).then((resp)=>{
            return resp.data;
        });
    }

    /**
   * Resets a system's keys
   * @function
   * @param {Object} sys - System object
   * @return {Object} result
   */
    resetKeys(sys) {
        return this.$http.put(
            '/api/accounts/systems/' + sys.id + '/keys',
            {action: 'reset'}
        ).then((resp)=>{
            return resp.data;
        });
    }

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
    pushKeys(sysId, form) {
        return this.$http.put(
            '/api/accounts/systems/' + sysId + '/keys',
            {
                action: 'push',
                form: form,
            }
        ).then((resp)=>{
            return resp.data;
        },
        (err)=>{
            return this.$q.reject(err);
        });
    }

    listRoles(systemId) {
        return this.$http.get(
            `/api/accounts/systems/${systemId}/roles/`
        ).then((resp) => {
            return resp.data.response;
        }, (err) => {
            return this.$q.reject(err);
        });
    }

    getMonitor(systemId) {
        return this.$http({
            url: '/api/workspace/monitors',
            method: 'GET',
            params: { target: systemId },
            cache: false,
        });
    }

    getSystemRoles(systemId) {
        return this.$http({
            url: 'api/workspace/systems',
            method: 'GET',
            params: { system_id: systemId, roles: true },
        });
    }

    getRoleForUser(systemId) {
        return this.$http({
            url: 'api/workspace/systems',
            method: 'GET',
            params: { system_id: systemId, user_role: true },
        });
    }

    updateRole(systemId, role) {
        return this.$http({
            url: 'api/workspace/systems',
            method: 'POST',
            data: { system_id: systemId, role: role },
        });
    }
}
