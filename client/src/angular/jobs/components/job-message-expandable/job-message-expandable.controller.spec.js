import { job } from '../../fixtures/job';

describe('JobMessageExpandableCtrl', ()=>{
    let element, controller, scope, $compile, Jobs;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$rootScope_, _$compile_, _Jobs_) => {
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.mockJob = job;
                scope.$apply();

                Jobs = _Jobs_;

                let elementHtml = "<job-message-expandable job='mockJob'></job-message-expandable>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
                controller = element.controller('job-message-expandable');
            }
        );
    });

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
        expect(element.text()).toContain("Status Report");
    });

    it("should open expand when toggled", () => {
        controller.expandStatus = true;
        scope.$digest();
        expect(element.text()).toContain("Transitioning")
    });
});