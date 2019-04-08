export default class OnboardingSetupService {
    constructor($http, $q) {
        'ngInject';
        this.$http = $http;
        this.$q = $q;
        this.url = "/api/onboarding/user/{username}";
    }

    username_url(username) {
        return this.url.replace("{username}", username);
    }

    list(username) {
        return this.$http.get(
            this.username_url(username)
        ).then(
            (resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            }
        );
    }

    action(username, step, actionName, data) {
        return this.$http.post(
            this.username_url(username),
            {
                "step" : step,
                "action" : actionName,
                "data" : data
            }
        ).then(
            (resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            }
        );
    }
}