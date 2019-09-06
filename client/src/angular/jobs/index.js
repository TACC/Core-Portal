import angular from 'angular';
import './components';

function config($stateProvider, $urlRouterProvider) {
    'ngInject';
    $urlRouterProvider.when('/workbench/jobs/', '/workbench/jobs');
    $stateProvider
        .state('wb.jobs.list', {
            url: '',
            component: 'jobsList',
            resolve: {}
        })
        .state('wb.jobs.job', {
            url: '/:jobId',
            component: 'jobDetail',
            resolve: {
                jobId: function($transition$) {
                    return $transition$.params().jobId;
                }
            }
        })
}

let mod = angular.module('portal.jobs', [
    'portal.jobs.components'
]).config(config);

export default mod;
