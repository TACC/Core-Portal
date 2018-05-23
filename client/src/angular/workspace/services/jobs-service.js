import * as d3 from 'd3';


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

  service.jobsByDate = function (jobs) {
    var nested = d3.nest()
      .key(function (d) {
        var ct = d.created;
        ct.setHours(0, 0, 0);
        return ct;
      })
      .entries(jobs);
    nested.forEach(function (d) {
      d.key = new Date(d.key);
    });
    nested = nested.sort(function (a, b) { return a.key - b.key;});
    return nested;
  };

  return service;
}

export default Jobs;
