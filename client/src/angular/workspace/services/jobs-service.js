import * as d3 from 'd3';

function Jobs($http) {
  'ngInject';

  var service = {};

  service.list = function(options) {
    options.limit = options.limit || 10;
    options.offest = options.offest || 0;
    return $http.get('/api/workspace/jobs/', {
      params: options
    }).then(function (resp) {
      let data = resp.data.response;
      data.forEach( (d)=>{
        d.created = new Date(d.created);
      });
      return data;
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
    let nested = d3.nest()
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
    console.log(nested);
    return nested;
  };

  service.getWebhookUrl = function () {
    return $http.get('/webhooks/jobs/');
  };

  return service;
}

export default Jobs;
