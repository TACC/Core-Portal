import onboardingSetupStepListing from '../../fixtures/onboarding-setup-step-listing.json';


describe('OnboardingSetupViewStaff', ()=>{
    let element, controller, scope, $compile, $q;
    let UserService, OnboardingSetupService;
    let mockNotifications;

    // Mock requirements.
    beforeEach(
        angular.mock.module(
            "portal", 
            ($provide) => {
                mockNotifications = {
                    subject: jasmine.createSpyObj('subject', ['subscribe'])
                };

                $provide.value('Notifications', mockNotifications);
            }
        )
    );    
    beforeEach( ()=> {
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, $componentController, 
                _UserService_, _OnboardingSetupService_) => {
                $q = _$q_;
                $compile = _$compile_;

                // Services that we will spy on later
                UserService = _UserService_;
                OnboardingSetupService = _OnboardingSetupService_;

                scope = _$rootScope_.$new();

                scope.mockUser = { 
                    "username" : "mockuser",
                    "last_name" : "mock",
                    "first_name" : "user",
                    "email" : "mock@user.com",
                    "isStaff" : false
                }

                scope.$apply();

                // Mock a UserService authentication result for
                // a staff user
                let deferredUserService = $q.defer();
                deferredUserService.resolve({
                    "username" : "staffuser",
                    "lastname" : "staff",
                    "firstname" : "user",
                    "email" : "staff@user.com",
                    "isStaff" : true
                });

                // Mock a setup step listing
                var deferredUserSetup = $q.defer();
                deferredUserSetup.resolve(onboardingSetupStepListing);

                spyOn(UserService, 'authenticate').and.returnValue(deferredUserService.promise);

                spyOn(OnboardingSetupService, 'list').and.returnValue(deferredUserSetup.promise);

                let elementHtml = "<onboarding-setup-view show-admin='true' username='mockuser'></onboarding-setup-view>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest()
                controller = element.controller('onboarding-setup-view');
            }
        );
    });
    

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
    });

    it("should load the user specified in the binding", () => {
        expect(OnboardingSetupService.list).toHaveBeenCalledWith("mockuser");
        expect(controller.viewingSelf).toEqual(false);
    });

    it("should show Administrative Actions", () => {
        expect(element.text()).toContain("Administrative Actions");
    });


    it("should append the result of a successful action to the event log for that step", () => {
        let deferred = $q.defer();
        deferred.resolve({
            "step" : "MockStep",
            "state" : "complete",
            "message" : "Completed successfully",
            "time" : "12:00:00"
        });
        spyOn(OnboardingSetupService, 'action').and.returnValue(deferred.promise);
        let mockStep = {
            "step" : "portal.MockStep",
            "state" : "staffwait",
            "displayName" : "Mock Step",
            "events" : []
        }
        controller.action(mockStep, "complete");
        scope.$digest();
        expect(mockStep.state).toEqual("complete");
        expect(mockStep.events[0].state).toEqual("complete");
    });

    it("should clear previous errors and display an error if a user action failed", () => {
        let deferredError = $q.defer();
        deferredError.reject({ status: 404 });
        spyOn(OnboardingSetupService, 'action').and.returnValue(deferredError.promise);
        let mockStep = { 
            "step" : "portal.MockStep",
            "displayName": "Mock Step"
        }
        controller.action(mockStep, "reset");
        scope.$digest();
        expect(mockStep.userError).toEqual(false);
        expect(mockStep.staffError).toEqual(true);
        expect(mockStep.errorSubject).toContain("reset");
        expect(mockStep.errorSubject).toContain("Mock Step");
        expect(mockStep.errorInfo).toContain("portal.MockStep")
    });

    it("should expanded and contract step events", () => {
        let step = { };
        controller.toggleStepLog(step);
        expect(step.expanded).toBeTruthy();
        controller.toggleStepLog(step);
        expect(step.expanded).toEqual(false);
    });

});

describe('OnboardingSetupViewSelf', ()=>{
    // Test UserSetupDetail control for when a user is viewing themselves
    let element, controller, scope, $compile, $q;
    let OnboardingSetupService, UserService;
    let mockNotifications;

    // Mock requirements.
    beforeEach(
        angular.mock.module(
            "portal", 
            ($provide) => {
                mockNotifications = {
                    subject: jasmine.createSpyObj('subject', ['subscribe'])
                };

                $provide.value('Notifications', mockNotifications);
            }
        )
    );
    beforeEach( ()=> {
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, $componentController, 
                _UserService_, _OnboardingSetupService_) => {
                $q = _$q_;
                $compile = _$compile_;

                OnboardingSetupService = _OnboardingSetupService_;
                UserService = _UserService_;

                scope = _$rootScope_.$new();
                scope.$apply();

                // Mock a UserService authentication result
                let deferredUserService = $q.defer();
                deferredUserService.resolve({
                    "username" : "mockuser",
                    "last_name" : "user",
                    "first_name" : "mock",
                    "email" : "mock@user.com",
                    "isStaff" : false
                });

                // Mock a setup step listing
                var deferredUserSetup = $q.defer();
                deferredUserSetup.resolve(onboardingSetupStepListing);

                spyOn(UserService, 'authenticate').and.returnValue(deferredUserService.promise);

                spyOn(OnboardingSetupService, 'list').and.returnValue(deferredUserSetup.promise);

                // No user='' binding for this test
                let elementHtml = "<onboarding-setup-view></onboarding-setup-view>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest()
                controller = element.controller('onboarding-setup-view');
            }
        );
    });

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
    });

    it("should load info for the authenticated user", () => {
        expect(OnboardingSetupService.list).toHaveBeenCalledWith("mockuser");
    });

    it("should subscribe to notifications", () => {
        expect(mockNotifications.subject.subscribe).toHaveBeenCalled()
    });

    it("should flag viewingSelf as true", () => {
        expect(controller.viewingSelf).toEqual(true);
    });

    it ("should not show Administrative Actions", () => {
        expect(element.text()).not.toContain("Administrative Actions");
    });

    it ("should show a Confirm button for userwait steps", () => {
        expect(element.text()).toContain("Confirm");
    });

    it ("should not display the Continue to Dashboard button if setup is not complete", () => {
        controller.user.setupComplete = false;
        scope.$digest();
        expect(element.text()).not.toContain("Continue to Dashboard");
    });

    it ("should display Continue to Dashboard button if setup is complete", () => {
        controller.user.setupComplete = true;
        scope.$digest();
        expect(element.text()).toContain("Continue to Dashboard");
    });

    it("should display the provided user's steps", () => {
        expect(element.text()).toContain("Completed successfully");
        expect(element.text()).toContain("Please confirm that you have setup MFA");
    });

    it("should clear previous errors and display an error if a user action failed", () => {
        let deferredError = $q.defer();
        deferredError.reject({ status: 404 });
        spyOn(OnboardingSetupService, 'action').and.returnValue(deferredError.promise);
        let mockStep = { 
            "step" : "portal.MockStep",
            "displayName": "Mock Step"
        }
        controller.action(mockStep, "user_confirm");
        scope.$digest();
        expect(mockStep.userError).toEqual(true);
        expect(mockStep.staffError).toEqual(false);
        expect(mockStep.errorSubject).toContain("user_confirm");
        expect(mockStep.errorSubject).toContain("Mock Step");
        expect(mockStep.errorInfo).toContain("portal.MockStep")
    });

    it("should display a submit ticket link for steps that have failed", () => {
        expect(element.text()).toContain("submit a ticket");
    });

    it("should process step events", () => {
        let event = { 
            username: "mockuser",
            step: "portal.apps.onboarding.steps.access.RequestAccess",
            state: "complete",
            message: "Event message",
            data: { "key" : "value" }
        }
        controller.processEvent(event);
        expect(controller.user.steps[1].events[0]).toEqual(event)
        expect(controller.user.steps[1].state).toEqual(event.state)
    });

    it("should process setup_complete state changes", () => {
        // This test will cause a page reload when the
        // user is forwarded to the dashboard, so we need to 
        // prevent that from happening or the test will crash.

        controller.$window = {
            location: {
                href: ""
            }
        }
        controller.user.setupComplete = true;
        let event = {
            username: "mockuser",
            step: "portal.apps.onboarding.execute.execute_setup_steps",
            data: { "setup_complete": true }
        }
        controller.processEvent(event);
        expect(controller.user.setupComplete).toEqual(true);
        expect(controller.$window.location.href).toEqual("/workbench/dashboard");
    });

    it("should determine if a user has setup events", () => {
        controller.user = {
            steps: [
                {
                    events: [ ]
                }
            ]
        }
        expect(controller.hasStepEvents()).toEqual(false);
        controller.user = { 
            steps: [
                {
                    events: [ "event1" ]
                }
            ]
        }
        expect(controller.hasStepEvents()).toEqual(true);
    });

});