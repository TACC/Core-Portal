import { job } from '../../fixtures/job';

describe('JobStatusCtrl', ()=>{
    let element, controller, scope, $compile, $q;
    let $uibModal, $state, Jobs;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, $componentController, _Jobs_, _$uibModal_, _$state_) => {
                $q = _$q_;
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.mockJob = job;
                scope.$apply();

                $uibModal = _$uibModal_;
                $state = _$state_;
                Jobs = _Jobs_;
                spyOn($uibModal, 'open');
                spyOn($state, 'go');

                let elementHtml = "<job-status job='mockJob'></job-status>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
                controller = element.controller('job-status');
            }
        );
    });

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
        expect(element.text()).toContain("kallisto");
    });

    it("should open a modal or forward state depending on the modal flag", () => {
        controller.modal = true;
        controller.jobDetails();
        expect($uibModal.open).toHaveBeenCalled();
        controller.modal = false;
        controller.jobDetails();
        expect($state.go).toHaveBeenCalledWith(
            'wb.jobs.job', 
            { jobId: "47395f11-ddc9-44d6-b310-d6fe68b463d9-007" }
        );
    });

});