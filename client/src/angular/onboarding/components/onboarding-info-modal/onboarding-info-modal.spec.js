import onboardingSetupStepListing from '../../fixtures/onboarding-setup-step-listing.json';

describe('OnboardingInfoModal', ()=>{
    let element, controller, scope, $compile, $q;
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, $componentController) => {
                $q = _$q_;
                $compile = _$compile_;

                // Services that we will spy on later

                scope = _$rootScope_.$new();

                scope.mockResolve = { 
                    "step" : "Step name",
                    "event" : {
                        "data" : {
                            "more_info" :  "<p>More Info</p>"
                        }
                    }
                }

                scope.$apply();

                let elementHtml = "<onboarding-info-modal resolve='mockResolve'></onboarding-info-modal>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest()
                controller = element.controller('onboarding-info-modal');
            }
        );
    });
    

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
    });

    it("should display the step name and info html", () => {
        expect(element.text()).toContain("Step name");
        expect(element.text()).toContain("More Info");
    });

    it("shoudl expect the close function to dismiss the modal", () => {
        spyOn(controller, 'dismiss');
        controller.close();
        expect(controller.dismiss).toHaveBeenCalled();
    });

});