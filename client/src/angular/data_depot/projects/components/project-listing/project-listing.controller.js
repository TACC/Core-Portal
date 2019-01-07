import _ from 'underscore';

class ProjectListingCtrl {
    constructor($state, ProjectService, DataBrowserService) {
        'ngInject';
        this.$state = $state;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.data = {
            customRoot: {
                name: 'My Projects',
                route: 'wb.data_depot.projects.list'
            }
        };
        this.ui = {};
        this.options = {
            offset: 0,
            limit: 100
        }
        this.DataBrowserService.apiParams.fileMgr = 'my-projects';
        this.DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
        this.DataBrowserService.apiParams.searchState = 'dataSearch';
        this.browser = DataBrowserService.state();
        // this.systemId and this.filePath are binded using
        // AngularJS binding from ui-router resolve.
    }
    $onInit(){
        this.DataBrowserService.browse({
            system: this.params.systemId,
            path: this.params.filePath
        })
        .then((resp)=>{
            this.browser = this.DataBrowserService.state();
            if (this.browser.listing.children.length < this.options.limit) {
                this.browser.reachedEnd = true
            }
        });

        this.searchState = this.DataBrowserService.apiParams.searchState;
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
        if (file.type === 'file') {
            this.DataBrowserService.preview(file, this.browser.listing);
        } else {
          this.$state.go(
              'wb.data_depot.projects.listing',
              {
                  systemId: file.system,
                  filePath: file.path
              }
          );
        }
    }

    showMoreFilesButton() {
        return typeof (this.browser.listing || {}).children === 'object'
            && !(this.browser.busyListing 
                || this.browser.busy 
                || this.browser.reachedEnd
                )
    }
};

export default ProjectListingCtrl; 
