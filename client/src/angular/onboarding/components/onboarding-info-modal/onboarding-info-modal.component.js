import OnboardingInfoModalCtrl from './onboarding-info-modal.controller';
import css from './onboarding-info-modal.css';
import commons_css from '../css/onboarding-common.css';

const onboardingInfoModalComponent = {
    template: require("./onboarding-info-modal.template.html"),
    bindings: {
        resolve: '<',
        dismiss: '&'
    },
    controller: OnboardingInfoModalCtrl,
};
export default onboardingInfoModalComponent;
