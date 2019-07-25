class FileListingCtrl {
    constructor($state, $stateParams, DataBrowserService, SystemsService, $uibModal) {
        'ngInject';
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.DataBrowserService = DataBrowserService;
        this.SystemsService = SystemsService;
        this.$uibModal = $uibModal;

        // this.systemId and this.filePath are binded using
        // AngularJS binding from ui-router resolve.
    }

    $onInit() {
        this.options = {
            offset: this.params.offset || 0,
            limit: this.params.limit || 100,
            system: this.params.systemId,
        };

        // TODO: DataBrowserService.browse call should be moved into data-view.controller
        this.DataBrowserService.browse({
            system: this.params.systemId,
            path: this.params.filePath,
            offset: this.options.offset,
            limit: this.options.limit,
            queryString: this.params.queryString,
            id: this.params.id,
        })
        .then((resp)=> {
            if (this.DataBrowserService.currentState.listing.type == "file") {
                this.DataBrowserService.preview(this.DataBrowserService.currentState.listing);
            }
            if (this.DataBrowserService.currentState.listing.children.length < this.options.limit) {
                this.DataBrowserService.currentState.reachedEnd = true
            }
        });
    }

    onSelect($event, file) {
        $event.stopPropagation();
        if ($event.ctrlKey || $event.metaKey) {
            let selectedIndex = this.DataBrowserService.currentState.selected.indexOf(file);
            if (selectedIndex > -1) {
                this.DataBrowserService.deselect([file]);
            } else {
                this.DataBrowserService.select([file]);
            }
        } else if ($event.shiftKey && this.DataBrowserService.currentState.selected.length > 0) {
            let lastFile = this.DataBrowserService.currentState.selected[
                this.DataBrowserService.currentState.selected.length - 1
            ],
            lastIndex = this.DataBrowserService.currentState.listing.children.indexOf(lastFile),
            fileIndex = this.DataBrowserService.currentState.listing.children.indexOf(file),
            min = Math.min(lastIndex, fileIndex),
            max = Math.max(lastIndex, fileIndex);
            this.DataBrowserService.select(
                this.DataBrowserService.currentState.listing.children.slice(min, max + 1)
            );
        } else if (
            typeof file._ui !== 'undefined' &&
            file._ui.selected
        ) {
            this.DataBrowserService.deselect([file]);
        } else {
            this.DataBrowserService.select([file], true);
        }
    }

    loadMore() {
        this.DataBrowserService.scrollToBottom(this.options);
    }

    showMoreFilesButton() {
        return typeof (this.DataBrowserService.currentState.listing || {}).children === 'object'
            && !(this.DataBrowserService.currentState.busyListing
                || this.DataBrowserService.currentState.busy
                || this.DataBrowserService.currentState.reachedEnd
                )
    }

    openPushPublicKeyForm() {
        this.DataBrowserService.currentState.ui.pushKeyModalOpening = true;
        this.SystemsService.get(this.options.system)
            .then((sys) => {
                return this.$uibModal.open({
                    component: 'SystemPushKeysModal',
                    resolve: {
                        sys: () => {
                            return sys;
                        },
                    },
                }).result;
            }, (err) => {
                this.DataBrowserService.currentState.error.message = err.data;
                this.DataBrowserService.currentState.error.status = err.status;
            }).then(() => {
                this.DataBrowserService.currentState.error = null;
                this.DataBrowserService.currentState.ui.message.class = 'alert-success';
                this.DataBrowserService.currentState.ui.message.show = true;
                this.DataBrowserService.currentState.ui.message.content = 'Public key pushed ' +
                    'successfully. Please click on My Data again';
            }).finally(() => {
                this.DataBrowserService.currentState.ui.pushKeyModalOpening = false;
            });
    }
}

export default FileListingCtrl;
