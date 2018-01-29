function ProjectService($interpolate, $q, $uibModal, $http) {
  'ngInject';
  var service = {};

  // var projectResource = httpi.resource('/api/data-depot/projects/:uuid/').setKeepTrailingSlash(true);
  // var collabResource = httpi.resource('/api/projects/:uuid/collaborators/').setKeepTrailingSlash(true);
  // var dataResource = httpi.resource('/api/projects/:uuid/data/:fileId').setKeepTrailingSlash(true);
 //var entitiesResource = httpi.resource('/api/projects/:uuid/meta/:name/').setKeepTrailingSlash(true);
 //var entityResource = httpi.resource('/api/projects/meta/:uuid/').setKeepTrailingSlash(true);


  /**
   * Get a list of Projects for the current user
   * @returns {Project[]}
   */
  service.list = function() {
    return $http.get('/api/data-depot/projects/').then(function(resp) {
      return resp.data.response;
    });
  };

  /**
   * Get a specific Project
   * @param {Object} options
   * @param {string} options.uuid The Project UUID
   * @returns {Promise}
   */
  service.get = function(options) {
    return projectResource.get({params: options}).then(function(resp) {
      return new ProjectModel(resp.data);
    });
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
  service.save = function(options) {
    return projectResource.post({data: options}).then(function (resp) {
      return new ProjectModel(resp.data);
    });
  };

  /**
   * Get a list of usernames for users that are collaborators on the Project
   * @param {Object} options
   * @param {string} options.uuid The Project uuid
   * @returns {Promise}
   */
  service.getCollaborators = function(options) {
    return collabResource.get({params: options});
  };

  /**
   *
   * @param options
   * @param {string} options.uuid The Project uuid
   * @param {string} options.username The username of the collaborator to add
   * @returns {Promise}
   */
  service.addCollaborator = function(options) {
    return collabResource.post({data: options});
  };

  /**
   *
   * @param options
   * @param {string} options.uuid The Project uuid
   * @param {string} options.username The username of the collaborator to add
   * @returns {Promise}
   */
  service.removeCollaborator = function(options) {
    return collabResource.delete({data: options});
  };

  /**
   *
   * @param options
   * @param {string} options.uuid The Project uuid
   * @param {string} [options.fileId] the Project data file id to list
   * @returns {Promise}
   */
  service.projectData = function(options) {
    return dataResource.get({params: options});
  };

  return service;

};

export default ProjectService;
