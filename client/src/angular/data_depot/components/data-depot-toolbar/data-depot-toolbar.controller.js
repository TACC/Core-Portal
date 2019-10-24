class DataDepotToolbarCtrl {
    constructor(
        $scope,
        $state,
        $uibModal,
        DataBrowserService,
        UserService,
        ZipService) {
        'ngInject';
        this.$scope = $scope;
        this.$state = $state;
        this.$uibModal = $uibModal;
        this.DataBrowserService = DataBrowserService;
        this.ZipService = ZipService;
        this.UserService = UserService;
    }

    $onInit() {
        this.searchQuery = { queryString: '' };

        this.DataBrowserService.subscribe(this.$scope, ($event, eventData) => {
            if (eventData.type === this.DataBrowserService.FileEvents.FILE_SELECTION) {
                this.updateToolbar();
            }
        });
        this.tests = {};
        /* Set initial toolbar status */
        this.updateToolbar();
        this.toolbarOptions = this.DataBrowserService.toolbarOptions();
        if (this.UserService.currentUser && this.UserService.currentUser.username) {
            this.ZipService.init();
        }
    }
    /**
    * Update the toolbar's status for various functions.
    */
    updateToolbar() {
        this.tests = this.DataBrowserService.allowedActions(this.DataBrowserService.currentState.selected);
    }
    /* Map service functions to toolbar buttons */
    details() {
        // preview the last selected file or current listing if none selected
        if (this.DataBrowserService.currentState.selected.length > 0) {
            this.DataBrowserService.preview(this.DataBrowserService.currentState.selected.slice(-1)[0]);
        } else {
            this.ataBrowserService.preview(this.DataBrowserService.currentState.listing);
        }
    }
    download() {
        this.DataBrowserService.download(this.DataBrowserService.currentState.selected);
    }
    preview() {
        this.DataBrowserService.preview(this.DataBrowserService.currentState.selected[0], this.DataBrowserService.currentState.listing);
    }
    previewImages() {
        this.DataBrowserService.previewImages(this.DataBrowserService.currentState.listing);
    }
    viewMetadata() {
        this.DataBrowserService.viewMetadata(this.DataBrowserService.currentState.selected, this.DataBrowserService.currentState.listing);
    }
    viewCategories() {
        this.DataBrowserService.viewCategories(this.DataBrowserService.currentState.selected, this.DataBrowserService.currentState.listing);
    }
    share() {
        this.DataBrowserService.share(this.DataBrowserService.currentState.selected[0]);
    }
    copy() {
        this.DataBrowserService.copy(this.DataBrowserService.currentState.selected);
    }
    move() {
        this.DataBrowserService.move(this.DataBrowserService.currentState.selected, this.DataBrowserService.currentState.listing);
    }
    rename() {
        this.DataBrowserService.rename(this.DataBrowserService.currentState.selected[0]);
    }
    trash() {
        this.DataBrowserService.trash(this.DataBrowserService.currentState.selected);
    }
    rm() {
        this.DataBrowserService.rm(this.DataBrowserService.currentState.selected);
    }
    publicUrl() {
        this.DataBrowserService.publicUrl(this.DataBrowserService.currentState.selected[0]);
    }
    search() {
        var state = this.DataBrowserService.apiParams.searchState;
        this.$state.go(state, {
            'query_string': this.searchQuery.queryString,
            'systemId': (this.DataBrowserService.currentState.listing || {}).system,
            'filePath': ''
        });
    }

    compress() {
        this.ZipService.compress(this.DataBrowserService.currentState.selected);
    }

    extract() {
        this.ZipService.extract(this.DataBrowserService.currentState.selected);
    }

    compressButtonDisabled() {
        return this.ZipService.compressing || 
               !this.tests.canCompress || 
               this.DataBrowserService.currentState.busy || 
               this.DataBrowserService.currentState.busyListing;
    }

    compressButtonClass() {
        return this.ZipService.compressing
                    ? 'fa fa-spinner fa-spin data-depot-compress'
                    : 'icon-compress data-depot-compress';
    }

    extractButtonDisabled() {
        return this.ZipService.extracting ||
                !this.tests.canExtract || 
                this.DataBrowserService.currentState.busy || 
                this.DataBrowserService.currentState.busyListing;
    }

    extractButtonClass() {
        return this.ZipService.extracting
                        ? 'fa fa-spinner fa-spin data-depot-compress' 
                        : 'icon-extract data-depot-compress'
    }
};

export default DataDepotToolbarCtrl;
