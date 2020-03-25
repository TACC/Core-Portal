describe('OnboardingSetupStateCtrl', ()=>{
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

                scope.mockState = 'pending';
                let elementHtml = "<onboarding-setup-state state='mockState'></onboarding-setup-state>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
            }
        );
    });

    it("should display pending state", () => {
        scope.mockState = 'pending';
        scope.$digest();
        expect(element.text()).toContain("Pending");
    });

    it("should display completed state", () => {
        scope.mockState = 'completed';
        scope.$digest();
        expect(element.text()).toContain("Completed");
    });
    
    it("should display userwait state", () => {
        scope.mockState = 'userwait';
        scope.$digest();
        expect(element.text()).toContain("Action Needed");
    });
    
    it("should display staffwait state", () => {
        scope.mockState = 'staffwait';
        scope.$digest();
        expect(element.text()).toContain("Awaiting Approval");
    });

    it("should display processing state", () => {
        scope.mockState = 'processing';
        scope.$digest();
        expect(element.text()).toContain("Processing");
    });

    it("should display staffwait state", () => {
        scope.mockState = 'failed';
        scope.$digest();
        expect(element.text()).toContain("Failed");
    });

    it("should display error state", () => {
        scope.mockState = 'error';
        scope.$digest();
        expect(element.text()).toContain("Error");
    });
});