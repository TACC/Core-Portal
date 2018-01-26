
function Jobs($http) {
  'ngInject';

  var service = {};

  service.list = function(options) {
    var params = {
      limit: options.limit || 10,
      offset: options.offset || 0
    };
    return $http.get('/api/workspace/jobs/', {
      params: params
    }).then(function (resp) {
      return resp.data.response;
    });
  };

  service.get = function(uuid) {
    return $http.get('/api/workspace/jobs/', {
      params: {'job_id': uuid}
    }).then(function (resp) {
      return resp.data.response;
    });
  };

  service.submit = function(data) {
    return $http.post('/api/workspace/jobs/', data);
  };

  return service;
}

export default Jobs;
