import _ from 'underscore';

class FileListingCtrl {
    constructor($state, $stateParams, DataBrowserService, SystemsService, $uibModal) {
        'ngInject';
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.DataBrowserService = DataBrowserService;
        this.SystemsService = SystemsService;
        this.$uibModal = $uibModal;

        this.browser = DataBrowserService.state();
        // this.systemId and this.filePath are binded using
        // AngularJS binding from ui-router resolve.
    }
    $onInit(){
        this.options = {
            offset: this.params.offset || 0,
            limit: this.params.limit || 100,
            system: this.params.systemId

        }

        // TODO: DataBrowserService.browse call should be moved into data-view.controller
        this.DataBrowserService.browse({
            system: this.params.systemId,
            path: this.params.filePath,
            offset: this.options.offset,
            limit: this.options.limit,
            queryString: this.params.queryString
        })
        .then((resp)=> {
            this.browser = this.DataBrowserService.state();
            if (this.browser.listing.type == "file") {
                this.DataBrowserService.preview(this.browser.listing);
            }
            if (this.browser.listing.children.length < this.options.limit) {
                this.browser.reachedEnd = true
            }
        });
    }
    onSelect($event, file) {
        $event.stopPropagation();
        if ($event.ctrlKey || $event.metaKey) {
            let selectedIndex = this.browser.selected.indexOf(file);
            if (selectedIndex > -1) {
                this.DataBrowserService.deselect([file]);
            } else {
                this.DataBrowserService.select([file]);
            }
        } else if ($event.shiftKey && this.browser.selected.length > 0) {
            let lastFile = this.browser.selected[
                this.browser.selected.length - 1
            ];
            let lastIndex = this.browser.listing.children.indexOf(lastFile);
            let fileIndex = this.browser.listing.children.indexOf(file);
            let min = Math.min(lastIndex, fileIndex);
            let max = Math.max(lastIndex, fileIndex);
            this.DataBrowserService.select(
                this.browser.listing.children.slice(min, max + 1)
            );
        } else if(
            typeof file._ui !== 'undefined' &&
            file._ui.selected
        ){
            this.DataBrowserService.deselect([file]);
        } else {
            this.DataBrowserService.select([file], true);
        }
    }
    onBrowse($event, file) {
        $event.preventDefault();
        $event.stopPropagation();
        if (file.isFile()) {
            this.DataBrowserService.preview(file, this.browser.listing);
        } else {
          this.$state.go(
              this.params.browseState,
              {
                  systemId: file.system,
                  filePath: file.path,
                  query_string: null
              }
          );
        }
    }
    loadMore() {
        this.DataBrowserService.scrollToBottom(this.options)
    }
    showMoreFilesButton() {
        return typeof (this.browser.listing || {}).children === 'object'
            && !(this.browser.busyListing
                || this.browser.busy
                || this.browser.reachedEnd
                )
    }
    openPushPublicKeyForm() {
        this.browser.ui.pushKeyModalOpening = true;
        this.SystemsService.get(this.options.system)
        .then((sys)=>{
            console.log(sys)
            return this.$uibModal.open({
                component: 'SystemPushKeysModal',
                resolve: {
                    sys: ()=>{
                        return sys;
                    },
                },
            }).result;
        }, (err)=>{
            this.browser.error.message = err.data;
            this.browser.error.status = err.status;
        }).then(()=>{
            this.browser = DataBrowserService.state();
            this.browser.error = null;
            this.browser.ui.message.class = 'alert-success';
            this.browser.ui.message.show = true;
            this.browser.ui.message.content = 'Public key pushed ' +
            'successfully. Please click on My Data again';
        }).finally(()=>{
            this.browser.ui.pushKeyModalOpening = false;
        });
    };
};

export default FileListingCtrl;
