function ProjectService($q, $http, $interpolate, $httpParamSerializerJQLike) {
  'ngInject';

  var service = {};

  /**
   * Get a list of Projects for the current user
   * @returns {Project[]}
   */
  service.list = function() {
    return $http({
      url: '/api/projects/',
      method: 'GET'
    }).then(
      function(response) {
        return response.data.response;
      }
    );
  };

  /**
   * Get a specific Project
   * @param {Object} options
   * @param {string} options.uuid The Project UUID
   * @returns {Promise}
   */
  service.getByProjectId = function(options) {
    return $http({
      url: $interpolate('/api/projects/{{id}}/')(options),
      method: 'GET',
    }).then(
      function(response) {
        return response.data;
      }
    );
  };

  /**
   * Get a specific Project
   * @param {Object} options
   * @param {string} options.uuid The Project UUID
   * @returns {Promise}
   */
  service.getBySystemId = function(options) {
    return $http({
      url: $interpolate('/api/projects/system/{{id}}/')(options),
      method: 'GET',
    }).then(
      (response) => {
        return response.data;
      },
      (err) => {
        return $q.reject(err.data);
      }
    );
  };

  /**
   * Create a new Project
   * @param {Object} options
   * @param {string} [options.uuid] The Project uuid, if updating existing record, otherwise null
   * @param {string} options.title The Project title
   * @param {string} [options.pi] The username for Project PI
   * @param {string[]} [options.coPis] List of usernames for Project Co-PIs
   * @returns {Promise}
   */
    service.create = function (options) {
        return $http({
            url: '/api/projects/',
            method: 'POST',
            data: $httpParamSerializerJQLike(options),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', },
        }).then(
            (response)=>{
                return response.data;
            }
        );
    };

    /**
     * Save or update a Project
     * @param {Object} options
     * @param {string} [options.uuid] The Project uuid, if updating existing record, otherwise null
     * @param {string} options.title The Project title
     * @param {string} [options.pi] The username for Project PI
     * @param {string[]} [options.coPis] List of usernames for Project Co-PIs
     * @returns {Promise}
     */
    service.update = function(options) {
        return $http({
            url: $interpolate('/api/projects/{{id}}/')(options),
            method: 'PATCH',
            data: options,
        }).then(
            (resp)=> {
                return resp.data;
            }, (err)=>{
                return $q.reject(err.data);
            }
        );
    };

    /**
     * Delete member from project.
     * @param {String} projectId - Project Id.
     * @param {String} memberType - Member Type [pi, co_pi, team_member].
     * @param {String} username - Username.
     * @return {Promise}
     */
    service.deleteMember = function(projectId, memberType, username) {
        return $http({
            url: $interpolate('/api/projects/{{projectId}}/members')({projectId:projectId}),
            method: 'PATCH',
            data: {
                action: 'remove_member',
                username: username,
                memberType: memberType
            }
        }).then(
            (resp) => {
                return resp.data;
            }, (err) => {
                return $q.reject(err);
            }
        );
    };

    /**
     * Add member to project.
     * @param {String} projectId - Project Id.
     * @param {String} memberType [pi, co_pi, team_member]
     * @param {String} username - Username
     * @return {Promise}
     */
    service.addMember = function(projectId, memberType, username) {
        return $http({
            url: $interpolate('/api/projects/{{projectId}}/members')({projectId:projectId}),
            method: 'PATCH',
            data: {
                action: 'add_member',
                username: username,
                memberType: memberType,
            }
        }).then(
            (resp) => {
                return resp.data;
            }, (err) => {
                return $q.reject(err);
            }
        );
    };

  return service;

}

export default ProjectService;
