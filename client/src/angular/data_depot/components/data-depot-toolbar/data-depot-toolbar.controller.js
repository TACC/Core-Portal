class DataDepotToolbarCtrl {
    constructor(
        $scope,
        $state,
        $uibModal,
        DataBrowserService) {
        'ngInject';
        this.$scope = $scope;
        this.$state = $state;
        this.$uibModal = $uibModal;
        this.DataBrowserService = DataBrowserService;
    }

    $onInit() {
        this.searchQuery = { queryString: '' };
        this.browser = this.DataBrowserService.state();

        this.DataBrowserService.subscribe(this.$scope, ($event, eventData) => {
            if (eventData.type === this.DataBrowserService.FileEvents.FILE_SELECTION) {
                this.updateToolbar();
            }
        });
        this.tests = {};
        /* Set initial toolbar status */
        this.updateToolbar();
        this.apiParams = this.DataBrowserService.apiParameters();
        this.toolbarOptions = this.DataBrowserService.toolbarOptions();
    }
    /**
    * Update the toolbar's status for various functions.
    */
    updateToolbar() {
        this.tests = this.DataBrowserService.allowedActions(this.browser.selected);
    }
    /* Map service functions to toolbar buttons */
    details() {
        // preview the last selected file or current listing if none selected
        if (this.browser.selected.length > 0) {
            this.DataBrowserService.preview(this.browser.selected.slice(-1)[0]);
        } else {
            this.ataBrowserService.preview(this.browser.listing);
        }
    }
    download() {
        this.DataBrowserService.download(this.browser.selected);
    }
    preview() {
        this.DataBrowserService.preview(this.browser.selected[0], this.browser.listing);
    }
    previewImages() {
        this.DataBrowserService.previewImages(this.browser.listing);
    }
    viewMetadata() {
        this.DataBrowserService.viewMetadata(this.browser.selected, this.browser.listing);
    }
    viewCategories() {
        this.DataBrowserService.viewCategories(this.browser.selected, this.browser.listing);
    }
    share() {
        this.DataBrowserService.share(this.browser.selected[0]);
    }
    copy() {
        this.DataBrowserService.copy(this.browser.selected);
    }
    move() {
        this.DataBrowserService.move(this.browser.selected, this.browser.listing);
    }
    rename() {
        this.DataBrowserService.rename(this.browser.selected[0]);
    }
    trash() {
        this.DataBrowserService.trash(this.browser.selected);
    }
    rm() {
        this.DataBrowserService.rm(this.browser.selected);
    }
    search() {
        var state = this.apiParams.searchState;
        this.$state.go(state, {
            'query_string': this.searchQuery.queryString,
            'systemId': this.browser.listing.system,
            'filePath': ''
        });
    }
};

export default DataDepotToolbarCtrl;
