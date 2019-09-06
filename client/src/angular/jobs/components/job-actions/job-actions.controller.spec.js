import { job } from '../../fixtures/job';
import { jobInfo } from '../../fixtures/jobInfo';

describe('JobActionsCtrl', ()=>{
    let element, controller, scope, $compile, $q;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, $componentController) => {
                $q = _$q_;
                $compile = _$compile_;
                scope = _$rootScope_.$new();

                scope.mockJob = job;
                scope.mockDismiss = jasmine.createSpy();
                scope.$apply();

                let elementHtml = "<job-actions job='mockJob' dismiss='mockDismiss'></job-actions>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
                controller = element.controller('job-actions');
            }
        );
    });

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
        expect(element.text()).toContain('Delete');
    });

    it("should display cancel actions", () => {
        controller.job.status = "STAGING_INPUTS";
        controller.$onInit();
        scope.$digest();
        expect(element.text()).toContain('Cancel');
    });

    it("should cancel a job", () => {
        let deferred = $q.defer();
        deferred.resolve({});
        spyOn(controller.Jobs, 'cancel').and.returnValue(deferred.promise);
        spyOn(controller, 'checkDismiss');
        controller.cancelJob();
        scope.$digest();
        expect(controller.Jobs.cancel).toHaveBeenCalledWith(job);
        expect(controller.checkDismiss).toHaveBeenCalled();
    });

    it("should resubmit a job", () => {
        let deferred = $q.defer();
        deferred.resolve({});
        spyOn(controller.Jobs, 'resubmit').and.returnValue(deferred.promise);
        spyOn(controller, 'checkDismiss');
        controller.resubmit();
        scope.$digest();
        expect(controller.Jobs.resubmit).toHaveBeenCalledWith(job);
        expect(controller.checkDismiss).toHaveBeenCalled();
    });

    it("should launch an app with job parameters", () => {
        spyOn(controller.$state, 'go');
        controller.UserService.currentUser.username = "username";
        controller.launchApp();
        let resubmitArgs = controller.$state.go.calls.mostRecent().args[1];
        expect(resubmitArgs.appId).toEqual('prtl.clone.username.A-ccsc.kallisto-0.45.0u3-3.0');
        let resubmitInfo = resubmitArgs.jobInfo;
        expect(resubmitInfo.inputs).toEqual(jobInfo.inputs);
        expect(resubmitInfo.parameters).toEqual(jobInfo.parameters);
        expect(resubmitInfo.maxRunTime).toEqual(jobInfo.maxRunTime);
        expect(resubmitInfo.allocation).toEqual(jobInfo.allocation);
        expect(resubmitInfo.nodeCount).toEqual(jobInfo.nodeCount);
        expect(resubmitInfo.processorsPerNode).toEqual(jobInfo.processorsPerNode);
        expect(resubmitInfo.name).toContain("kallisto");
    });

});