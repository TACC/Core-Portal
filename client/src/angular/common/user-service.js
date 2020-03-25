/**
 * User Service Class.
 */
export default class UserService {
    /**
     * Constructor.
     * @param {Object} $http
     * @param {Object} $q
     */
    constructor($http, $q) {
        'ngInject';
        this.$http = $http;
        this.$q = $q;
        this.currentUser = {};
        this.userAllocations = {};
    }

    /**
     * Authenticate
     */
    authenticate() {
        return this.$http.get('/api/users/auth/')
            .then((resp) => {
                return this.currentUser = resp.data;
            }, (err) => {
                return this.$q.reject({ message: 'auth error' });
            });
    }

    getUser() {
        return this.$http.get('/api/users/auth/')
            .then((resp) => {
                return this.currentUser = resp.data;
            }, (err) => {
                return this.currentUser = {}
            });
    }

    usage() {
        return this.$http.get('/api/users/usage/')
            .then(function(resp) {
                return resp.data;
            });
    }

    /**
     * Search
     * @param {String} q - Query to search on first name, last name or email.
     * @param {String} role - Optional user role
     */
    search(q, role) {
        if (typeof role === 'undefined') {
            role = '';
        }
        return this.$http.get(
            '/api/users/',
            {
                params: {
                    q: q,
                    role: role,
                },
            }
        ).then((resp) => {
            return resp.data;
        }, (err) => {
            this.$q.reject(err);
        });
    }

    allocations() {
        if (Object.entries(this.userAllocations).length) {
            let prom = this.$q.defer();
            prom.resolve(this.userAllocations);
            return prom.promise;
        }
        return this.$http.get('/api/users/allocations')
            .then((resp) => {
                this.userAllocations = resp.data;
                return this.userAllocations;
            });
    }
}
