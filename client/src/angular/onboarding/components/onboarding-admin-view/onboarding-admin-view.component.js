import OnboardingAdminViewCtrl from './onboarding-admin-view.controller';
import css from './onboarding-admin-view.css';

const onboardingAdminViewComponent = {
    template: require("./onboarding-admin-view.template.html"),
    bindings: {
        params: '<',
    },
    controller: OnboardingAdminViewCtrl,
};
export default onboardingAdminViewComponent;
