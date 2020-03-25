class PublicDataViewCtrl {
    constructor($stateParams, $state, $window, DataBrowserService) {
        'ngInject';
        this.$stateParams = $stateParams;
        this.$state = $state;
        this.DataBrowserService = DataBrowserService;
    }

    $onInit() {
        this.system = this.systems.find(sys => {
            return sys.name == 'Public Data';
        })
        this.DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
        this.DataBrowserService.apiParams.searchState = 'public_data';
        this.DataBrowserService.apiParams.fileMgr = 'public';

        this.breadcrumbParams = {
            filePath: this.$stateParams.filePath,
            systemId: this.system.systemId,
            customRoot: {
                name: 'Public Data',
                path: '',
                route: `public_data({query_string: null, filePath: '', directory: "${this.$stateParams.directory}"})`,
        }}

        this.listingParams = {
            systemId: this.system.systemId,
            filePath: this.$stateParams.filePath,
            offset: this.$stateParams.offset || 0,
            limit: this.$stateParams.limit || 100,
            queryString: this.$stateParams.query_string,
            browseState: 'public_data',
        };
    }
    onBrowse($event, file) {
        if (file.type === 'file') {
            this.DataBrowserService.preview(file, this.DataBrowserService.currentState.listing);
        } else {
          this.$state.go('public_data',
              {
                  directory: 'public',
                  filePath: file.path,
                  query_string: null
              },
              {reload: true, inherit: false}
          );
        }
    }
}

export default PublicDataViewCtrl