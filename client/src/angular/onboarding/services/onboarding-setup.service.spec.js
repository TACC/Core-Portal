
describe('OnboardingSetupService', function() {
    let OnboardingSetupService;
    let $q;
    let $httpBackend;
    let sampleResponse;
    let sampleEvent;
    let scope;
    let $http;

    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject(function(_$rootScope_, _OnboardingSetupService_, _$q_, _$http_, _$httpBackend_) {
            $http = _$http_;
            OnboardingSetupService = _OnboardingSetupService_;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
            scope = _$rootScope_.$new();
            scope.$apply();

            sampleEvent = { 
                "step" : "MockStep",
                "time" : "01-01-2000 00:00:00",
                "state" : "pending",
                "message" : "message"
            }

            sampleResponse = [
                { 
                    "step" : "MockStep",
                    "events" : [
                        sampleEvent
                    ]
                }
            ];
        });
    });

    it ("should instantiate and have methods", () => {
        expect(OnboardingSetupService).toBeDefined();
    });

    it ("should generate urls per username", () => {
        expect(OnboardingSetupService.username_url("test")).toEqual("/api/onboarding/user/test");
    });

    it ("should get a list of user steps", () => {
        OnboardingSetupService.list("test").then(
            (response) => {
                expect(response).toEqual(sampleResponse);
            }
        );
        $httpBackend.whenGET("/api/onboarding/user/test").respond(sampleResponse);
        $httpBackend.flush();
    });

    it ("should post to /api/onboarding/user/{username}", () => {
        // Mock $http.post and result
        let deferred = $q.defer();
        deferred.resolve({ data: sampleEvent });
        spyOn($http, 'post').and.returnValue(deferred.promise);

        let data = { "key" : "value" }
        OnboardingSetupService.action("test", "MockStep", "complete", data);

        expect($http.post).toHaveBeenCalledWith(
            "/api/onboarding/user/test", 
            { "step" : "MockStep", "action" : "complete", "data" : data }
        );
    });

    it ("should reject errors", () => {
        // Flags to make sure callbacks happened
        let listError = false;
        let confirmError = false;
        let approveError = false;

        $httpBackend.whenGET("/api/onboarding/user/test").respond(404, '');
        $httpBackend.whenPOST("/api/onboarding/user/test").respond(403, '');

        OnboardingSetupService.list("test").then(
            (response) => { },
            (error) => {
                expect(error.status).toEqual(404);
                listError = true;
            }
        );

        OnboardingSetupService.action("test", "MockStep", "staff_approve").then(
            (response) => { },
            (error) => {
                expect(error.status).toEqual(403);
                approveError = true;
            }
        )
        $httpBackend.flush();

        // Trigger promises
        scope.$digest();

        expect(listError).toEqual(true);
        expect(approveError).toEqual(true);
    });

});