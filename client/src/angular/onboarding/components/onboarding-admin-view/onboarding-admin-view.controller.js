class OnboardingAdminViewCtrl {
    constructor(OnboardingAdminService, $window) {
        'ngInject';
        this.OnboardingAdminService = OnboardingAdminService;
        this.users = [ ];
        this.$window = $window;
    }

    $onInit(){
        this.OnboardingAdminService.list().then(
            (result) => {
                this.users = result;
            }
        )
    }

    showUser(user) {
        this.$window.location.href = "/onboarding/setup/" + user.username;
    }
};

export default OnboardingAdminViewCtrl; 
