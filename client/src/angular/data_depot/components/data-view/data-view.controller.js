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
        DataBrowserService,
        UserService
    ) {
        'ngInject';
        // get user data from service
        this.$stateParams = $stateParams;
        this.DataBrowserService = DataBrowserService;
        this.UserService = UserService
    }
    $onInit() {
        this.listingParams = {
            systemId: this.params.systemId,
            filePath: this.params.filePath,
            offset: this.params.offset || 0,
            limit: this.params.limit || 100,
            queryString: this.params.query_string,
            browseState: 'wb.data_depot.db',
        }
        //  $stateParams is pulling info from the html section of the data-depot
        //  and we will swap the data based on the systemID variables we place there
        //  'options' will contain the different variables
        //  required to change the display
        this.options = {
            system: this.params.systemId,
            path: this.params.filePath,
            name: this.params.name,
            directory: this.params.directory,
        };

        this.browser = this.DataBrowserService.state();
        
        if (this.options.name == 'My Data' || this.options.directory == 'agave') {
            this.data = {
                user: this.UserService.currentUser,
                customRoot: {
                    name: 'My Data',
                    path: this.params.filePath,
                    route: `wb.data_depot.db({systemId: "${this.params.systemId}", query_string: null, filePath: '', directory: "${this.params.directory}"})`,
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
                    path: this.params.filePath,
                    route: `wb.data_depot.db({systemId: "${this.params.systemId}", query_string: null, filePath: '', directory: "${this.params.directory}"})`,
                },
            };

            this.DataBrowserService.apiParams.fileMgr = 'shared';
            this.DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
            this.DataBrowserService.apiParams.searchState = 'wb.data_depot.db';
        }
    }
}

export default DataViewCtrl;