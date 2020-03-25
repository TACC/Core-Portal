describe('JobStatusLabelCtrl', ()=>{
    let element, controller, scope, $compile, Jobs;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$rootScope_, _$compile_, _Jobs_) => {
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.mockJob = {
                    status: "PENDING"
                }
                scope.$apply();

                Jobs = _Jobs_;

                let elementHtml = "<job-status-label item='mockJob'></job-status-label>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
                controller = element.controller('job-status-label');
            }
        );
    });

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
        expect(element.text()).toContain("PENDING");
    });
});