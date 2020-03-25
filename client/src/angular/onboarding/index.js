import angular from 'angular';
import './services';
import './components';

let mod = angular.module('portal.onboarding', [
    'portal.onboarding.services',
    'portal.onboarding.components',
    'ui.bootstrap',
]);

export default mod;
