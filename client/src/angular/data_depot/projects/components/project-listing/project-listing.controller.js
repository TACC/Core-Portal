class ProjectListingCtrl {
    constructor($state, $stateParams, ProjectService, DataBrowserService) {
        'ngInject';
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;

        this.onBrowse = this.onBrowse.bind(this);
        // this.systemId and this.filePath are binded using
        // AngularJS binding from ui-router resolve.
    }
    $onInit(){
        this.breadcrumbParams = {
            systemId: this.$stateParams.systemId,
            filePath: this.$stateParams.filePath,
            customRoot: ''
        }
        this.ui = {};
        this.DataBrowserService.apiParams.fileMgr = 'my-projects';
        this.DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
        this.DataBrowserService.apiParams.searchState = 'wb.data_depot.projects.listing';
        this.browser = this.DataBrowserService.state();
        this.searchState = this.DataBrowserService.apiParams.searchState;

        this.ProjectService.getBySystemId(
            {
                id: this.$stateParams.systemId
            }
        )
        .then((resp) => {
            this.breadcrumbParams.customRoot = {name: resp.response.title, path: ''}
        },
        (err) => {
            this.ui.error = {
                status: err.status,
                message: err.message
            };
        })
    }
    onBrowseProjectRoot() {
        this.$state.go('wb.data_depot.projects.list')
    }
    onBrowse($event, file) {
        $event.preventDefault();
        $event.stopPropagation();
        if (file.type === 'file') {
            this.DataBrowserService.preview(file, this.browser.listing);
        } else {
          this.$state.go(
              this.params.browseState,
              {
                  systemId: file.system,
                  filePath: file.path,
              },
              {reload: true, inherit: false}
          );
        }
    }
}

export default ProjectListingCtrl; 
