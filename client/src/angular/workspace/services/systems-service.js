/**
 * This service is currently a stub service static data. We don't need dynamic system
 * lookup right now, but it will be nicer to go ahead and code against this service
 * rather than having stubs all over the place.
 */
function Systems($q, $http) {
    'ngInject';
    this.getMonitor = function(system_id) {
      return $http({
        url: '/api/workspace/monitors',
        method: 'GET',
        params: {'target': system_id},
        cache: false
      });
    };

    this.getSystemRoles = function (system_id) {
      return $http({
        url: 'api/workspace/systems',
        method: 'GET',
        params: { 'system_id': system_id, 'roles': true }
      });
    };

    this.getRoleForUser = function (system_id) {
      return $http({
        url: 'api/workspace/systems',
        method: 'GET',
        params: { 'system_id': system_id, 'user_role': true }
      });
    };

    this.updateRole = function (system_id, role) {
      return $http({
        url: 'api/workspace/systems',
        method: 'POST',
        data: { 'system_id': system_id, 'role': role }
      });
    };

}

export default Systems;
