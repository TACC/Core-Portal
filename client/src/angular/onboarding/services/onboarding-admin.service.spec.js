
describe('OnboardingAdminService', function() {
    let OnboardingAdminService;
    let $q;
    let $httpBackend;
    let sampleResponse;

    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject(function(_OnboardingAdminService_, _$q_, _$httpBackend_) {
            OnboardingAdminService = _OnboardingAdminService_;
            $q = _$q_;
            $httpBackend = _$httpBackend_;

            sampleResponse = {
                users: [
                    { 
                        "username" : "mockuser",
                        "lastName" : "user",
                        "firstName" : "mock",
                        "setupComplete" : false,
                        "dateJoined" : "today"
                    }
                ]
            };
        });
    });

    it ("should instantiate and have methods", () => {
        expect(OnboardingAdminService).toBeDefined();
    });

    it ("should get a list of users", () => {
        OnboardingAdminService.list().then(
            (response) => {
                expect(response["users"][0].username).toEqual("mockuser");
            }
        )
        $httpBackend.whenGET("/api/onboarding/admin").respond(sampleResponse);
        $httpBackend.flush();
    });

    it ("should reject error responses", () => {
        OnboardingAdminService.list().then(
            (response) => {

            },
            (error) => {
                expect(error.status).toEqual(404)
            }
        );
        $httpBackend.whenGET("/api/onboarding/admin").respond(404, '');
        $httpBackend.flush();
    });

});