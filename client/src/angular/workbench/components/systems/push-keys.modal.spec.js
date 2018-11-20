import template from './../../templates/components/push-keys.modal.html';

describe("systemPushKeysModal", function() {
    var element;
    var compiled;
    var controller;
    var $q;
    var scope;
    var SystemsService;
    var $compile;
    var authenticateButton;

    // Mock only the necessary portal components
    beforeEach(angular.mock.module("portal.workbench.components"));
    beforeEach(angular.mock.module("portal.data_depot.services"));
    beforeEach(angular.mock.module("portal.common"));
    
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        // Setup our component test
        angular.mock.inject(function(_$rootScope_, $componentController, _$compile_, _$q_) {
            
            // The $q provider allows us to mock promises
            $q = _$q_;

            // Bring in the $compile provider for UI testing
            $compile = _$compile_;
            
            // Create a fake root scope for the UI component, with mocked data
            scope = _$rootScope_.$new();
            scope.mock_resolve = { 
                "sys" : {
                    "name" : "mock name",
                    "storage" : {
                        "host" : "mock host"
                    }
                }
            };
            scope.$apply();

            // Spawn the UI element. 'resolve' is an input binding, so we will get the one we mocked in the root scope
            element = $compile('<system-push-keys-modal resolve="mock_resolve"></system-push-keys-modal>')(scope);
            scope.$digest();

            // Grab the controller from the compiled ui component
            controller = element.controller('system-push-keys-modal');
            
            // Grab the SystemsService from the created UI component, so we can spy on it later
            SystemsService = controller.SystemsService;
        });
    });

    
    it ("should display Success! when a user successfully authenticates", () => {
        // Setup a mocked result for SystemsService.pushKeys
        var mockPromise = $q.defer();

         // Mocked promise should resolve an HTTP 200
        mockPromise.resolve({ status: 200});
       
        // Intercept calls to SystemsService.pushKeys and return mocked promise
        spyOn(SystemsService, 'pushKeys').and.returnValue(mockPromise.promise);

        // Trigger Authenticate button code
        controller.ok();

        // Make angular fire off any scope changes
        scope.$apply();

        // Check UI elements to make sure they changed correctly
        expect(element.text()).not.toContain('Loading');
        expect(element.text()).toContain('Success!');
    });

    it ("should display an 'Authorization failed' message if the user has a bad password or token", () => {
        var mockPromise = $q.defer();
        mockPromise.reject({ status: 403, data: { message: "AuthenticationException "}});
        spyOn(SystemsService, 'pushKeys').and.returnValue(mockPromise.promise);
        controller.ok();
        scope.$apply();
        expect(controller.ui.error).toEqual(true);
        expect(controller.ui.status).toEqual(403);
        expect(element.text()).toContain('Authorization failed');
    });

    // Helper function to simulate error where Reset Keys button is displayed
    var causeResetKeys = function() {
        var mockPromise = $q.defer();
        mockPromise.reject({ status: 409, data: { message: "ValueError"} });
        spyOn(SystemsService, 'pushKeys').and.returnValue(mockPromise.promise);
        controller.ok();
        scope.$apply();
    };

    it ("should display the Reset Keys button if error 409", () => {
        causeResetKeys();
        expect(controller.ui.error).toEqual(true);
        expect(controller.ui.status).toEqual(409);
        expect(element.text()).toContain('Reset Keys');
    });

    it ("should display 'authorize again' after successfully resetting keys", () => {
        causeResetKeys();
        var mockPromise = $q.defer();
        mockPromise.resolve({ status: 200 });
        spyOn(SystemsService, 'resetKeys').and.returnValue(mockPromise.promise);
        controller.resetKeys();
        scope.$apply();
        expect(controller.ui.reset_keys_finished).toEqual(true);
        expect(controller.ui.reset_keys_success).toEqual(true);
        expect(controller.ui.loading).toEqual(false);
        expect(element.text()).not.toContain('Reset Keys');
        expect(element.text()).not.toContain('Loading');
        expect(element.text()).toContain('authorize again');
    });

    it ("should display 'submit a ticket' if reset keys failed", () => {
        causeResetKeys();
        var mockPromise = $q.defer();
        mockPromise.reject({ status: 409, data: { message: "Exception"} });
        spyOn(SystemsService, 'resetKeys').and.returnValue(mockPromise.promise);
        controller.resetKeys();
        scope.$apply();
        expect(controller.ui.reset_keys_finished).toEqual(true);
        expect(controller.ui.reset_keys_success).toEqual(false);
        expect(controller.ui.loading).toEqual(false);
        expect(element.text()).not.toContain('Reset Keys');
        expect(element.text()).not.toContain('Loading');
        expect(element.text()).toContain('submit a ticket');
    });

    it ("should display 'submit a ticket' for other error types", () => {
        var mockPromise = $q.defer();
        mockPromise.reject({ status: 500, data: { message: "Exception"} });
        spyOn(SystemsService, 'pushKeys').and.returnValue(mockPromise.promise);
        controller.ok();
        scope.$apply();
        expect(controller.ui.status).toBeGreaterThan( 500 - 1 );
        expect(controller.ui.error).toEqual(true);
        expect(element.text()).toContain('submit a ticket');
    });
 
  });
  
