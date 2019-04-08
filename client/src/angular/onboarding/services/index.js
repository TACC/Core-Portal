import angular from 'angular';
import OnboardingAdminService from './onboarding-admin.service';
import OnboardingSetupService from './onboarding-setup.service';

let mod = angular.module('portal.onboarding.services', []);

mod.service('OnboardingAdminService', OnboardingAdminService);
mod.service('OnboardingSetupService', OnboardingSetupService);

export default mod;
