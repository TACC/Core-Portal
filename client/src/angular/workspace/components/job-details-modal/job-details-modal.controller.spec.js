import { job } from '../../../jobs/fixtures/job';
import { jobHistory} from '../../fixtures/jobHistory';

describe('JobDetailsModal', function() {
    let $q, controller, element, $rootScope, Jobs, scope, $componentController, $uibModal, $compile;

    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject((_$componentController_, _Jobs_, _$q_, 
                            _$rootScope_, _$uibModal_, _$compile_) => {
            $componentController = _$componentController_;
            Jobs = _Jobs_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            $uibModal = _$uibModal_;
            $compile = _$compile_;
            scope = _$rootScope_.$new();
            scope.mockResolve = {
                job: {
                    id: "mock_uuid"
                }
            }
            scope.$apply();

            let deferred = $q.defer();
            deferred.resolve(job);
            spyOn(Jobs, 'get').and.returnValue(deferred.promise);

            let deferredJobHistoryGet = $q.defer();
            deferredJobHistoryGet.resolve(jobHistory);
            spyOn(Jobs, 'getJobHistory').and.returnValue(deferredJobHistoryGet.promise);

            let elementHtml = "<job-details-modal resolve='mockResolve'></jobs-details-modal>";
            element = angular.element(elementHtml)
            element = $compile(element)(scope);
            scope.$digest();
            controller = element.controller('job-details-modal');
        });
    });

    it('should load the controller and retrieve the job', () => {
        spyOn(Jobs, 'jobIsFinished').and.returnValue(true);
        expect(controller).toBeDefined();
        expect(Jobs.get).toHaveBeenCalledWith("mock_uuid");
    });

});
