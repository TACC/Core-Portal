import _ from 'underscore';

/**
 * Data Depot Controller
 * @function
 * @param {Object} $state - UI-Router state object
 * @param {Object} $stateParams - UI-Router state params object
 * @param {Object} $uibModal - uib Modal service
 * @param {Object} DataBrowserService - Data Browser Service
 * @param {Object} ProjectService - ProjectService
 * @param {Object} systems - Array of systems
 */

class DataViewCtrl {
    constructor(
        $stateParams,
        $state,
        DataBrowserService,
        UserService
    ) {
        'ngInject';
        // get user data from service
        this.$stateParams = $stateParams;
        this.DataBrowserService = DataBrowserService;
        this.UserService = UserService;
        this.$state = $state;
    }

    onBrowse (ev, item) {
        this.$state.go('wb.data_depot.db',
            {
                directory: this.$stateParams.directory,
                systemId: item.system,
                filePath: item.path,
            }
        );
    }

    $onInit() {
        this.listingParams = {
            systemId: this.$stateParams.systemId,
            filePath: this.$stateParams.filePath,
            offset: this.$stateParams.offset || 0,
            limit: this.$stateParams.limit || 100,
            queryString: this.$stateParams.query_string,
            browseState: 'wb.data_depot.db',
        };
        //  $stateParams is pulling info from the html section of the data-depot
        //  and we will swap the data based on the systemID variables we place there
        //  'options' will contain the different variables
        //  required to change the display
        this.options = {
            system: this.$stateParams.systemId,
            path: this.$stateParams.filePath,
            name: this.$stateParams.name,
            directory: this.$stateParams.directory,
        };

        this.browser = this.DataBrowserService.state();

        if (this.options.name == 'My Data' || this.options.directory == 'agave') {
            this.data = {
                user: this.UserService.currentUser,
                customRoot: {
                    name: 'My Data',
                    path: this.$stateParams.filePath,
                    route: `wb.data_depot.db({systemId: "${this.$stateParams.systemId}", query_string: null, filePath: '', directory: "${this.$stateParams.directory}"})`,
                },
            };

            this.DataBrowserService.apiParams.fileMgr = 'my-data';
            this.DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
            this.DataBrowserService.apiParams.searchState = 'wb.data_depot.db';

        } else if (this.options.name == 'Community Data' || this.options.directory == 'public') {
            this.data = {
                user: this.UserService.currentUser,
                customRoot: {
                    name: 'Community Data',
                    path: this.$stateParams.filePath,
                    route: `wb.data_depot.db({systemId: "${this.$stateParams.systemId}", query_string: null, filePath: '', directory: "${this.$stateParams.directory}"})`,
                },
            };

            this.DataBrowserService.apiParams.fileMgr = 'shared';
            this.DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
            this.DataBrowserService.apiParams.searchState = 'wb.data_depot.db';
        }
    }
}

export default DataViewCtrl;
