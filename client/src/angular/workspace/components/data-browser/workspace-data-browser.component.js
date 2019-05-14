import template from './workspace-data-browser.template.html';

import _ from 'underscore';

class WorkspaceDataBrowserCtrl {
    constructor ($scope, $rootScope, SystemsService, DataBrowserService, ProjectService) {
        'ngInject';
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.SystemsService = SystemsService;
        this.DataBrowserService = DataBrowserService;
        this.ProjectService = ProjectService;
    }

    $onInit () {
        this.collapsed = false;
        this.$rootScope.$on('wants-file', ($event, wantArgs)=> {
            this.data.wants = wantArgs;
            if (this.collapsed) {
                this.data.wants.wasCollapsed = true;
                this.collapsed = false;
            }
        });

        this.$rootScope.$on('cancel-wants-file', ($event, args)=> {
            if (this.data.wants && this.data.wants.requestKey === args.requestKey) {
                if (this.data.wants.wasCollapsed) {
                    this.collapsed = true;
                }
                this.data.wants = null;
            }
        });
        this.data = {
            loading: false,
            wants: null,
            systemList: [],
            filesListing: null,
            system: null,
            dirPath: [],
            filePath: '',
            loadingMore: false,
            reachedEnd: false,
            page: 0
        };


        this.SystemsService.listing().then((data)=> {
            let mydata_system = _.find(data, {
                name: 'My Data'
            });
            let comdata_system = _.find(data, {
                name: 'Community Data'
            });
            this.data.options = [{
                label: 'My Data',
                conf: {
                    system: mydata_system.systemId,
                    path: '',
                    offset: 0,
                    limit: 100
                },
                apiParams: {
                    fileMgr: 'my-data',
                    baseUrl: '/api/data-depot/files'
                }
            },
            {
                label: 'My Projects',
                conf: {
                    system: 'projects', 
                    path: '',
                    offset: 0,
                    limit: 100
                },
                apiParams: {
                    fileMgr: 'shared', 
                    baseUrl: '/api/data-depot/files'
                }
            },
            {
                label: 'Community Data',
                conf: {
                    system: comdata_system.systemId,
                    path: '',
                    offset: 0,
                    limit: 100
                },
                apiParams: {
                    fileMgr: 'shared',
                    baseUrl: '/api/data-depot/files'
                }
            }];
            this.data.cOption = this.data.options[0];
            this.dataSourceUpdated();
        });
    }

    togglePanel () {
        this.collapsed = !this.collapsed;
    }

    dataSourceUpdated () {
        this.data.filesListing = null;
        this.data.loading = true;
        this.data.reachedEnd = false;
        this.data.filePath = '';
        this.data.dirPath = [];
        this.data.page = 0;
        this.DataBrowserService.apiParams.fileMgr = this.data.cOption.apiParams.fileMgr;
        this.DataBrowserService.apiParams.baseUrl = this.data.cOption.apiParams.baseUrl;
        if (this.data.cOption.label !== 'My Projects') {
            this.data.listingProjects = false;
            this.data.project = null;
            this.DataBrowserService.browse(this.data.cOption.conf).then((listing)=> {
                this.data.filesListing = listing;
                if (this.data.filesListing.path == '/') {
                    this.data.dirPath = ['/'];
                } else {
                    this.data.filePath = this.data.filesListing.path;
                    this.data.dirPath = this.data.filePath.split('/');
                }
                this.data.loading = false;
                if (listing.children.length < this.data.cOption.conf.limit) {
                    this.data.reachedEnd = true;
                }
            }, (err)=> {
                this.data.error = 'Unable to list the selected data source: ' + err.statusText;
                this.data.loading = false;
            });
        } else {
            this.data.listingProjects = true;
            this.ProjectService.list()
            .then((projects)=> {
                this.data.projects = projects;
                this.data.loading = false;
            });
        }
    }

    scrollToTop () {
        return;
    }

    scrollToBottom () {
        if (this.data.loadingMore || this.data.reachedEnd) {
            return;
        }
        this.data.loadingMore = true;
        if (this.data.filesListing && this.data.filesListing.children &&
            this.data.filesListing.children.length < this.data.cOption.conf.limit) {
                this.data.reachedEnd = true;
                return;
            }
            this.data.page += 1;
            this.data.loadingMore = true;
            this.DataBrowserService.browsePage({
                system: this.data.filesListing.system,
                path: this.data.filesListing.path,
                page: this.data.page,
                offset: this.data.cOption.conf.offset,
                limit: this.data.cOption.conf.limit
            })
            .then((listing)=> {
                this.data.loadingMore = false;
                if (listing.children.length < this.data.cOption.conf.limit) {
                    this.data.reachedEnd = true;
                }
                this.data.loading = false;
            }, (err)=> {
                this.data.loadingMore = false;
                this.data.reachedEnd = true;
                this.data.loading = false;
            });
    }

    browseTrail ($event, index) {
        $event.stopPropagation();
        $event.preventDefault();
        if (this.data.dirPath.length <= index + 1) {
            return;
        }
        this.browseFile({
            type: 'dir',
            system: this.data.filesListing.system,
            resource: this.data.filesListing.resource,
            path: this.data.dirPath.slice(0, index + 1).join('/')
        });
    }

    selectProject (project) {
        this.data.project = project;
        this.DataBrowserService.apiParams.fileMgr = 'shared';
        this.DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
        this.data.loading = true;
        this.DataBrowserService.browse({
            system: project.id,
            path: ''
        }).then((listing)=> {
            this.data.listingProjects = false;
            this.data.loading = false;
            this.data.filesListing = listing;
            this.data.reachedEnd = listing.children.length < this.data.cOption.conf.limit;
        });
    }


    browseFile (file) {
        if (file.type !== 'folder' && file.type !== 'dir') {
            return;
        }
        this.data.filesListing = null;
        this.data.loading = true;
        this.DataBrowserService.browse(file)
        .then((listing)=> {
            this.data.loading = false;
            this.data.filesListing = listing;
            if (this.data.filesListing.path == '/') {
                this.data.dirPath = ['/'];
                this.browser.listing = this.data.filesListing;
            } else {
                this.data.filePath = this.data.filesListing.path;
                this.data.dirPath = this.data.filePath.split('/');
                this.browser.listing = this.data.filesListing;
            }
        }, (err)=> {
            this.data.loading = false;
            this.data.error = 'Unable to list the selected data source: ' + err.statusText;
        });
    }

    chooseFile (file) {
        if (this.data.wants) {
            this.$rootScope.$broadcast('provides-file', {
                requestKey: this.data.wants.requestKey,
                file: file
            });
        }
    }



}

const workspaceDataBrowser = {
    template: template,
    bindings: {
    },
    controller: WorkspaceDataBrowserCtrl,
};


export default workspaceDataBrowser;
