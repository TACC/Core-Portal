class ProjectListingCtrl {
    constructor($state, ProjectService, DataBrowserService) {
        'ngInject';
        this.$state = $state;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        // this.systemId and this.filePath are binded using
        // AngularJS binding from ui-router resolve.
    }
    $onInit(){
        this.data = {
            customRoot: {
                name: 'My Projects',
                route: 'wb.data_depot.projects.list'
            }
        };
        this.ui = {};
        this.DataBrowserService.apiParams.fileMgr = 'my-projects';
        this.DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
        this.DataBrowserService.apiParams.searchState = 'dataSearch';
        this.browser = this.DataBrowserService.state();
        this.searchState = this.DataBrowserService.apiParams.searchState;
    }
};

export default ProjectListingCtrl; 
