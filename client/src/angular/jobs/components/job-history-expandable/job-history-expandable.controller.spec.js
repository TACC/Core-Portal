import { jobHistory } from '../../../workspace/fixtures/jobHistory';

describe('JobHistoryExpandableCtrl', ()=>{
    let element, controller, scope, $compile, Jobs;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$rootScope_, _$compile_, _Jobs_) => {
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.mockHistory = jobHistory;
                scope.$apply();

                Jobs = _Jobs_;

                let elementHtml = "<job-history-expandable history='mockHistory'></job-history-expandable>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
                controller = element.controller('job-history-expandable');
            }
        );
    });

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
        expect(element.text()).toContain("History");
    });

    it("should open expand when toggled", () => {
        controller.expandStatus = true;
        scope.$digest();
        expect(element.text()).toContain("PENDING")
    });
});