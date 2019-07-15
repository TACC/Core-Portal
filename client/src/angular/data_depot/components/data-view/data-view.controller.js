/**
 * Data Depot View Controller
 * @function
 * @param {Object} $scope - $scope object
 * @param {Object} $stateParams - UI-Router state params object
 * @param {Object} $state - UI-Router state object
 * @param {Object} DataBrowserService - Data Browser Service
 * @param {Object} SystemsService - SystemsService
 */

class DataViewCtrl {
    constructor(
        $scope,
        $stateParams,
        $state,
        DataBrowserService,
        SystemsService,
        UserService
    ) {
        'ngInject';
        // get user data from service
        this.$scope = $scope;
        this.$stateParams = $stateParams;
        this.DataBrowserService = DataBrowserService;
        this.$state = $state;
        this.onBrowse = this.onBrowse.bind(this);
        this.SystemsService = SystemsService;
        this.UserService = UserService;
    }

    onBrowse($event, file) {
        $event.preventDefault();
        $event.stopPropagation();
        if (file.type === 'file') {
            this.DataBrowserService.preview(file, this.browser.listing);
        } else if (this.$stateParams.directory == 'external-resources') {
            // wait for fileId before browsing external resource
            if (file.path == '') {
                file.id = 'root';
            }
            if (!file.id) {
                return;
            }
            this.$state.go('wb.data_depot.external_resources',
                {
                    filePath: file.path,
                    id: file.id,
                    name: this.$stateParams.name,
                    fileMgr: this.$stateParams.fileMgr,
                },
                { reload: true }
            );
        } else {
          this.$state.go('wb.data_depot.db',
              {
                  systemId: file.system,
                  filePath: file.path,
                  query_string: null,
                  offset: null,
                  limit: null
              },
              {reload: true}
          );
        }
    }

    $onInit() {
        this.listingParams = {
            systemId: this.$stateParams.systemId,
            filePath: this.$stateParams.filePath,
            offset: this.$stateParams.offset || 0,
            limit: this.$stateParams.limit || 100,
            queryString: this.$stateParams.query_string,
            browseState: this.$stateParams.browseState || 'wb.data_depot.db',
            id: this.$stateParams.id,
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

        this.breadcrumbParams = {
            filePath: this.$stateParams.filePath,
            systemId: this.$stateParams.systemId,
            directory: this.$stateParams.directory,
        };

        this.$scope.$watch(() => this.browser.listing, () => {
            if (this.options.directory == 'external-resources' && this.browser.listing && ('trail' in this.browser.listing) && !this.browser.busyListing) {
                this.breadcrumbParams.trail = this.browser.listing.trail;
            }
        });

        if (this.options.name == 'My Data' || this.options.directory == 'agave') {
            this.DataBrowserService.apiParams.fileMgr = 'my-data';
            this.DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
            this.DataBrowserService.apiParams.searchState = 'wb.data_depot.db';
            this.breadcrumbParams.customRoot = { name: 'My Data', path: '' };

        } else if (this.options.name == 'Community Data' || this.options.directory == 'shared') {
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
            this.breadcrumbParams.customRoot = { name: 'Community Data', path: '' };
        } else if (this.options.directory == 'external-resources') {
            if (!this.options.name) {
                let externalSys = this.SystemsService.systems.find((sys) => {
                    return sys.fileMgr == this.$stateParams.fileMgr;
                });
                this.$stateParams.name = externalSys.name;
            }

            this.DataBrowserService.apiParams.fileMgr = this.$stateParams.fileMgr;
            this.DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
            this.DataBrowserService.apiParams.searchState = 'wb.data_depot.db';
            this.DataBrowserService.apiParams.directory = 'external-resources';
            this.breadcrumbParams.customRoot = { name: this.$stateParams.name, path: '' };
        }
        else if (this.options.name == 'Public Data' || this.options.directory == 'public') {
            this.data = {
                user: this.UserService.currentUser,
                customRoot: {
                    name: 'Public Data',
                    path: this.$stateParams.filePath,
                    route: `wb.data_depot.db({systemId: "${this.$stateParams.systemId}", query_string: null, filePath: '', directory: "${this.$stateParams.directory}"})`,
                },
            };

            this.DataBrowserService.apiParams.fileMgr = 'public';
            this.DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
            this.DataBrowserService.apiParams.searchState = 'wb.data_depot.db';
            this.breadcrumbParams.customRoot = {name: 'Public Data', path: ''}
        }
    }
}

export default DataViewCtrl;
