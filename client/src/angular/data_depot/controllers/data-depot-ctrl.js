import _ from 'underscore';

/**
 * Data Depot Controller
 * @function
 * @param {Object} $scope - Angular scope object
 * @param {Object} $state - UI-Router state object
 * @param {Object} $stateParams - UI-Router state params object
 * @param {Object} $uibModal - uib Modal service
 * @param {Object} Django - Django service
 * @param {Object} DataBrowserService - Data Browser Service
 * @param {Object} SystemsService - System Service
 * @param {Object} ProjectService - ProjectService
 * @param {Object} systems - Array of systems
 */
export default function DataDepotCtrl(
    $scope,
    $state,
    $stateParams,
    $uibModal,
    Django,
    DataBrowserService,
    SystemsService,
    ProjectService,
    systems,
    FileListing
) {
    'ngInject';
    // get user data from service
    $scope.sysCommunityData = _.find(
        systems,
        {name: 'Community Data'}
    );
    $scope.sysMyData = _.find(
        systems,
        {name: 'My Data'}
    );

    $scope.browser = DataBrowserService.state();
}
