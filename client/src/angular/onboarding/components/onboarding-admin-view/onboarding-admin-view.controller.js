class OnboardingAdminViewCtrl {
    constructor(OnboardingAdminService, $window) {
        'ngInject';
        this.OnboardingAdminService = OnboardingAdminService;
        this.users = [ ];
        this.$window = $window;
        this.loading = false;
        this.currentPage = 1;
        this.limit = 10;
        this.pageLimitOptions = [ 10, 50 ];
    }

    $onInit(){
        this.loading = true;
        this.OnboardingAdminService.list(this.currentPage, this.limit).then(
            (result) => {
                this.users = result.users;
            }
        ).finally(
            () => {
                this.loading = false;
            }
        )
    }

    showUser(user) {
        this.$window.location.href = "/onboarding/setup/" + user.username;
    }

    indexInPage($index) {
        let firstIndex = (this.currentPage - 1) * this.limit;
        let lastIndex = firstIndex + this.limit;
        return $index >= firstIndex && $index < lastIndex;
    }

};

export default OnboardingAdminViewCtrl; 
