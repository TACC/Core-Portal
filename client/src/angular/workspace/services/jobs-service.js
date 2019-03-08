import * as d3 from 'd3';

class Jobs {
    constructor($http) {
        'ngInject';
        this.$http = $http;
    }

    list(options) {
        options.limit = options.limit || 10;
        options.offest = options.offest || 0;
        return this.$http.get('/api/workspace/jobs/', {
            params: options,
        }).then(function(resp) {
            let data = resp.data.response;
            data.forEach((d) => {
                d.created = new Date(d.created);
            });
            return data;
        });
    }

    get(uuid) {
        return this.$http.get('/api/workspace/jobs/', {
            params: {
                job_id: uuid,
            },
        }).then(function(resp) {
            return resp.data.response;
        });
    }

    submit(data) {
        return this.$http.post('/api/workspace/jobs/', data)
            .then((resp) => {
                return resp.data.response;
            });
    }

    delete(job) {
        return this.$http.delete('/api/workspace/jobs/', {
            params: { job_id: job.id },
        });
    }

    cancel(job) {
        return this.$http.post('/api/workspace/jobs/', {
            job_id: job.id, params: { job_id: job.id, action: 'cancel', body: '{"action":"stop"}' },
        });
    }

    jobsByDate(jobs) {
        let nested = d3.nest()
            .key(function(d) {
                let ct = d.created;
                ct.setHours(0, 0, 0);
                return ct;
            })
            .entries(jobs);
        nested.forEach(function(d) {
            d.key = new Date(d.key);
        });
        nested = nested.sort(function(a, b) {
            return a.key - b.key;
        });
        return nested;
    }
}

export default Jobs;
