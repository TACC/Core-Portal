import { jobResponse } from '../fixtures/jobResponse';
import { jobListResponse } from '../fixtures/jobListResponse';

describe('JobsService', function() {
    let $q, Apps, $httpBackend, $scope, $http;
    let Jobs;

    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject(
            (_$rootScope_, _Apps_, _$q_, _$httpBackend_, _Jobs_, _$http_) => {
                Apps = _Apps_;
                $scope = _$rootScope_.$new();
                $q = _$q_;
                $httpBackend = _$httpBackend_;
                Jobs = _Jobs_;
                $http = _$http_;
            }
        );
    });

    it('should instantiate', () => {
        expect(Jobs).toBeDefined();
    });

    it('should get a list of jobs', () => {
        $httpBackend.whenGET('/api/workspace/jobs/?limit=10&offset=0').respond(200, jobListResponse);
        Jobs.list().then(
            (result) => {
                expect(result[0].created).toEqual(new Date("2019-08-16T19:14:22.000Z"));
            }
        );
        $httpBackend.flush();
    });

    it ('should get a job', () => {
        $httpBackend.whenGET('/api/workspace/jobs/?job_id=1234').respond(200, jobResponse);
        Jobs.get("1234").then(
            (result) => {
                expect(result).toEqual(jobResponse.response);
            }
        )
        $httpBackend.flush();
    });

    it('should submit a job', () => {
        let deferred = $q.defer();
        deferred.resolve(
            { 
                data: {
                    response: "response"
                }
            }
        );
        spyOn($http, 'post').and.returnValue(deferred.promise);
        Jobs.submit({ "job" : "myjob" });
        expect($http.post).toHaveBeenCalledWith("/api/workspace/jobs/", { "job" : "myjob"});
    });

    it('should delete a job', () => {
        spyOn($http, 'delete');
        Jobs.delete({ "id" : "myjob" });
        expect($http.delete).toHaveBeenCalledWith(
            "/api/workspace/jobs/", 
            {
                params: {
                    "job_id" : "myjob"
                }
            }
        );
    });

    it('should cancel a job', () => {
        spyOn($http, 'post');
        Jobs.cancel({ "id" : "myjob" });
        expect($http.post).toHaveBeenCalledWith(
            "/api/workspace/jobs/",
            {
                "job_id": "myjob",
                "action": "stop"
            }
        );
    });

    it('should resubmit a job', () => {
        spyOn($http, 'post');
        Jobs.resubmit({ "id" : "myjob" });
        expect($http.post).toHaveBeenCalledWith(
            "/api/workspace/jobs/",
            {
                "job_id": "myjob",
                "action": "resubmit"
            }
        );
    });

    it('should determine if a job if finished', () => {
        expect(Jobs.jobIsFinished({ status: "FINISHED" })).toEqual(true);
        expect(Jobs.jobIsFinished({ status: "FAILED" })).toEqual(true);
        expect(Jobs.jobIsFinished({ status: "STOPPED" })).toEqual(true);
        expect(Jobs.jobIsFinished({ status: "KILLED" })).toEqual(true);
        expect(Jobs.jobIsFinished({ status: "STAGING_INPUTS" })).toEqual(false);
    });

    it('should generate CS S classes for jobs based on status', () => {
        expect(Jobs.getStatusClass({ status: "FAILED" })).toEqual("alert-danger");
        expect(Jobs.getStatusClass({ status: "STOPPED" })).toEqual("alert-danger");
        expect(Jobs.getStatusClass({ status: "PAUSED" })).toEqual("alert-danger");
        expect(Jobs.getStatusClass({ status: "FINISHED" })).toEqual("alert-success");
        expect(Jobs.getStatusClass({ status: "ACCEPTED" })).toEqual("alert-warning");
        expect(Jobs.getStatusClass({ status: "PENDING" })).toEqual("alert-warning");
        expect(Jobs.getStatusClass({ status: "PROCESSING_INPUTS" })).toEqual("alert-warning");
        expect(Jobs.getStatusClass({ status: "STAGING_INPUTS" })).toEqual("alert-warning");
        expect(Jobs.getStatusClass({ status: "STAGED" })).toEqual("alert-warning");
    });

    it('should update job status from notification service messages', () => {
        let msg = {
            event_type: "job",
            datetime: "1",
            extra: {
                id : "myjob",
                status: "FINISHED",
                error_message: "finished"
            }
        }
        let result = Jobs.updateJobFromNotification({ id: "myjob" }, msg);
        expect(result).toEqual(
            {
                id: "myjob",
                status: "FINISHED",
                lastStatusMessage: "finished",
                ended: 1000
            }
        )
    });

});
