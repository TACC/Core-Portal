import OnboardingSetupViewCtrl from './onboarding-setup-view.controller';
import css from './onboarding-setup-view.css';
import commons_css from '../css/onboarding-common.css';

const onboardingSetupViewComponent = {
    template: require("./onboarding-setup-view.template.html"),
    bindings: {
        username: '@',
    },
    controller: OnboardingSetupViewCtrl,
};
export default onboardingSetupViewComponent;
