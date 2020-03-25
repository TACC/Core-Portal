import OnboardingSetupStateCtrl from './onboarding-setup-state.controller';
import css from './onboarding-setup-state.css';

const onboardingSetupStateComponent = {
    template: require("./onboarding-setup-state.template.html"),
    bindings: {
        state: '<',
    },
    controller: OnboardingSetupStateCtrl,
};
export default onboardingSetupStateComponent;
