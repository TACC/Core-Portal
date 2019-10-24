import * as d3 from 'd3';

class Jobs {
    constructor($http, $state) {
        'ngInject';
        this.$http = $http;
        this.$state = $state;
    }

    list(options) {
        if (!options) {
            options = { };
        }
        options.limit = options.limit || 10;
        options.offset = options.offset || 0;
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

    getJobHistory(uuid) {
        return this.$http.get('/api/workspace/jobs/' + uuid + '/history/').then(
            (resp) => {
                let history = resp.data.response;
                // Sort history by ascending date (most recent to later)
                history.sort(
                    (a, b) => {
                        return new Date(a.created) - new Date(b.created);
                    }
                );
                return history;
            }
        )
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
            job_id: job.id, action: 'stop'
        });
    }

    resubmit(job) {
        return this.$http.post('/api/workspace/jobs/', {
            job_id: job.id, action: 'resubmit',
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
    
    jobIsFinished(job) {
        let finishedStatus = ['FAILED', 'STOPPED', 'FINISHED', 'KILLED'];
        return (finishedStatus.some((e) => e === job.status));
    }

    getStatusClass(job) {
        if (job.status==='FAILED' || job.status==='STOPPED' || job.status==='BLOCKED' ||
            job.status==='PAUSED') {
            return "alert-danger";
        }
        if (job.status==="ACCEPTED" || job.status==="PENDING" || 
            job.status==='PROCESSING_INPUTS' || job.status==='STAGING_INPUTS' || 
            job.status==='STAGING_JOB' || job.status==='SUBMITTING') {
            return "alert-info";
        }
        if (job.status === 'FINISHED') {
            return "alert-success";
        }
        if ( job.status === 'RUNNING' || job.status==='CLEANING_UP' || job.status==='ARCHIVING') {
            return "alert-warning";
        }
        return "alert-success";
    }

    updateJobFromNotification(job, msg) {
        let result = JSON.parse(JSON.stringify(job));
        if (msg.event_type === "job") {
            if (result.id === msg.extra.id) {
                result.status = msg.extra.status;
                result.ended = parseInt(msg.datetime) * 1000;
                result.lastStatusMessage = msg.extra.error_message;
            }
        }
        return result;
    }
}

export default Jobs;
