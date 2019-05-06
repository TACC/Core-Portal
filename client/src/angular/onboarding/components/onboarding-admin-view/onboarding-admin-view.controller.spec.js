describe('OnboardingAdminViewCtrl', ()=>{
    let element, controller, scope, $compile, $q;
    let OnboardingAdminService;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, $componentController, _OnboardingAdminService_) => {
                $q = _$q_;
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.$apply();

                OnboardingAdminService = _OnboardingAdminService_;

                let deferred = $q.defer();        
                deferred.resolve(
                    {
                        users: [
                            {
                                "username" : "mockuser",
                                "lastName" : "user",
                                "firstName" : "mock",
                                "setupComplete" : false,
                                "email" : "mock@user.com",
                                "dateJoined" : "yesterday",
                                "lastEvent" : {
                                    "time" : "yesterday",
                                    "message" : "Setup Event message",
                                    "step" : "MockStep"
                                }
                            }
                        ]
                    }
                );
                spyOn(OnboardingAdminService, 'list').and.returnValue(deferred.promise);
                let elementHtml = "<onboarding-admin-view></onboarding-admin-view>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
                controller = element.controller('onboarding-admin-view');
            }
        );
    });

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
        expect(element.text()).toContain("Administration");
    });

    it("should show a list of users", () => {
        expect(element.text()).toContain("user");
    });

    it("should calculate whether or not to show a user result", () => {
        controller.users = new Array(30);
        controller.currentPage = 2;
        controller.limit = 10;
        expect(controller.indexInPage(5)).toEqual(false);
        expect(controller.indexInPage(15)).toEqual(true);
        expect(controller.indexInPage(25)).toEqual(false);
    });
});