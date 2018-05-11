function ProjectService($q, $http, $interpolate) {
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
  service.get = function(options) {
    return $http({
      url: $interpolate('/api/projects/{{uuid}}/')(options),
      method: 'GET',
      params: options
    }).then(
      function(response) {
        return new ProjectModel(response.data);
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
  service.save = function (options) {
    return $http({
      url: $interpolate('/api/projects/{{uuid}}/')(options),
      method: 'POST',
      data: options
    }).then(
      function(response) {
        return new ProjectModel(response.data);
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
  service.update = function(project) {
    return $http.put('/api/projects/'+project.uuid+'/', project).then((resp)=> {
      return resp.data;
    }, (err)=>{
      return $q.reject(err);
    });
  };

  /**
   * Get a list of usernames for users that are collaborators on the Project
   * @param {Object} options
   * @param {string} options.uuid The Project uuid
   * @returns {Promise}
   */
  service.getCollaborators = function(options) {
    return $http({
      url: $interpolate('/api/projects/{{uuid}}/collaborators/')(options),
      method: 'GET',
      params: options
    });
  };

  /**
   *
   * @param options
   * @param {string} options.uuid The Project uuid
   * @param {string} options.username The username of the collaborator to add
   * @returns {Promise}
   */
  service.addCollaborator = function (options) {
    return $http({
      url: $interpolate('/api/projects/{{uuid}}/collaborators/')(options),
      method: 'POST',
      data: options
    });
  };

  /**
   *
   * @param options
   * @param {string} options.uuid The Project uuid
   * @param {string} options.username The username of the collaborator to add
   * @returns {Promise}
   */
  service.removeCollaborator = function (options) {
    return $http({
      url: $interpolate('/api/projects/{{uuid}}/collaborators/')(options),
      method: 'DELETE',
      data: options
    });
  };

  /**
   *
   * @param options
   * @param {string} options.uuid The Project uuid
   * @param {string} [options.fileId] the Project data file id to list
   * @returns {Promise}
   */
  service.projectData = function (options) {
    return $http({
      url: $interpolate('/api/projects/{{uuid}}/data/{{fileId}}')(options),
      method: 'GET',
      params: options
    });
  };

  return service;

}

export default ProjectService;
