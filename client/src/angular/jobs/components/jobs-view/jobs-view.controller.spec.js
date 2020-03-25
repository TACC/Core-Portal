describe('JobsViewCtrl', ()=>{
    let element, controller, scope, $compile, $q;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, $componentController) => {
                $q = _$q_;
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.$apply();

                let elementHtml = "<jobs-view></jobs-view>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
                controller = element.controller('jobs-view');
            }
        );
    });

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
    });

});