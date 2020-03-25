describe('JobDatetimeCtrl', ()=>{
    let element, controller, scope, $compile;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$rootScope_, _$compile_) => {
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.mockDatetime = "2019-10-10T19:17:47.000-05:00";
                scope.$apply();

                let elementHtml = "<job-datetime datetime='mockDatetime'></job-datetime>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
                controller = element.controller('job-datetime');
            }
        );
    });

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
        expect(element.text()).toContain("2019");
    });

    it("should check for zero value dates", () => {
        controller.date = new Date("1969-12-31T16:00:00.000-08:00");
        scope.$digest()
        expect(element.text()).toEqual("");
    });
});