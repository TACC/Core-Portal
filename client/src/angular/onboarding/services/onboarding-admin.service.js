export default class OnboardingAdminService {
    constructor($http, $q) {
        'ngInject';
        this.$http = $http;
        this.$q = $q;
        this.url = "/api/onboarding/admin"
    }

    list() {
        return this.$http.get(this.url).then(
            (resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            }
        )
    }
}