import _ from 'underscore';

/**
 * Data Depot Controller
 * @function
 * @param {Object} $scope - Angular scope object
 * @param {Object} $state - UI-Router state object
 * @param {Object} $stateParams - UI-Router state params object
 * @param {Object} $uibModal - uib Modal service
 * @param {Object} Django - Django service
 * @param {Object} DataBrowserService - Data Browser Service
 * @param {Object} SystemsService - System Service
 * @param {Object} ProjectService - ProjectService
 * @param {Object} systems - Array of systems
 */
export default function DataDepotCtrl(
    $scope,
    $state,
    $stateParams,
    $uibModal,
    Django,
    DataBrowserService,
    SystemsService,
    ProjectService,
    systems
) {
    'ngInject';
    // get user data from service
    $scope.sysCommunityData = _.find(
        systems,
        {name: 'Community Data'}
    );
    $scope.sysMyData = _.find(
        systems,
        {name: 'My Data'}
    );

    //  $stateParams is pulling info from the html section of the data-depot
    //  and we will swap the data based on the systemID variables we place there
    //  'options' will contain the different variables
    //  required to change the display
    const options = {
        system: ($stateParams.systemId),
        path: ($stateParams.filePath),
        name: ($stateParams.name),
        directory: ($stateParams.directory),
    };

    $scope.browser = DataBrowserService.state();
    
    $scope.openPushPublicKeyForm = ()=>{
        $scope.browser.ui.pushKeyModalOpening = true;
        SystemsService.get(options.system)
        .then((sys)=>{
            return $uibModal.open({
                component: 'SystemPushKeysModal',
                resolve: {
                    sys: ()=>{
                        return sys;
                    },
                },
            }).result;
        }, (err)=>{
            $scope.browser.error.message = err.data;
            $scope.browser.error.status = err.status;
        }).then(()=>{
            $scope.browser = DataBrowserService.state();
            $scope.browser.error = null;
            $scope.browser.ui.message.class = 'alert-success';
            $scope.browser.ui.message.show = true;
            $scope.browser.ui.message.content = 'Public key pushed ' +
            'successfully. Please click on My Data again';
        }).finally(()=>{
            $scope.browser.ui.pushKeyModalOpening = false;
        });
    };
    console.log($stateParams) 
    if (options.name == 'My Data' || options.directory == 'agave') {
        $scope.data = {
            user: Django.user,
            customRoot: {
                name: $stateParams.name,
                path: $stateParams.filePath,
                route: `wb.data_depot.db({systemId: "${$stateParams.systemId}", filePath: '', directory: "${$stateParams.directory}"})`,
            },
        };

        DataBrowserService.apiParams.fileMgr = 'my-data';
        DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
        DataBrowserService.apiParams.searchState = 'dataSearch';


        DataBrowserService.browse(options)
            .then((resp)=>{
                $scope.searchState = DataBrowserService.apiParams.searchState;
            }, (err)=>{
                $scope.browser = DataBrowserService.state();
                $scope.browser.error.message = err.data.message;
                $scope.browser.error.status = err.status;
            });

        $scope.scrollToTop = function() {
            return;
        };

        $scope.scrollToBottom = function() {
            DataBrowserService.scrollToBottom();
        };

        $scope.onBrowse = function($event, file) {
            $event.preventDefault();
            $event.stopPropagation();
            if (file.type === 'file') {
                DataBrowserService.preview(file, $scope.browser.listing);
            } else {
                $state.go('wb.data_depot.db', {systemId: file.system, filePath: file.path}, {reload: false});
            }
        };

        $scope.onSelect = function($event, file) {
            $event.stopPropagation();
            if ($event.ctrlKey || $event.metaKey) {
                let selectedIndex = $scope.browser.selected.indexOf(file);
                if (selectedIndex > -1) {
                    DataBrowserService.deselect([file]);
                } else {
                    DataBrowserService.select([file]);
                }
            } else if ($event.shiftKey && $scope.browser.selected.length > 0) {
                let lastFile = $scope.browser.selected[
                    $scope.browser.selected.length - 1
                ];
                let lastIndex = $scope.browser.listing
                    .children.indexOf(lastFile);
                let fileIndex = $scope.browser.listing
                    .children.indexOf(file);
                let min = Math.min(lastIndex, fileIndex);
                let max = Math.max(lastIndex, fileIndex);
                DataBrowserService.select(
                    $scope.browser.listing.children.slice(min, max + 1)
                );
            } else if (typeof file._ui !== 'undefined' &&
                file._ui.selected) {
                DataBrowserService.deselect([file]);
            } else {
                DataBrowserService.select([file], true);
            }
        };

        $scope.onDetail = function($event, file) {
            $event.stopPropagation();
            DataBrowserService.preview(file, $scope.browser.listing);
        };
    } else if (options.name == 'My Projects' || options.directory == 'projects') {
        $scope.ui = {};

        $scope.data = {
            user: Django.user,
            customRoot: {
                name: $stateParams.name,
                path: $stateParams.filePath,
                route: `wb.data_depot.db({systemId: "${$stateParams.systemId}", filePath: '', directory: "${$stateParams.directory}"})`,
            },
        };

        $scope.ui.busy = true;
        $scope.data.projects = [];
        ProjectService.list().then(function(projects) {
            $scope.ui.busy = false;
            $scope.data.projects = projects;
        });

        $scope.onBrowse = function onBrowse($event, project) {
            $event.preventDefault();
            $state.go('db.projects.listing', {
                systemId: project.id,
                filePath: '/',
                projectTitle: project.name,
            });
        };
    } else if (options.name == 'Community Data' || options.directory == 'public') {
        $scope.data = {
            user: Django.user,
            customRoot: {
                name: $stateParams.name,
                path: $stateParams.filePath,
                route: `wb.data_depot.db({systemId: "${$stateParams.systemId}", filePath: '', directory: "${$stateParams.directory}"})`,
            },
        };

        DataBrowserService.apiParams.fileMgr = 'shared';
        DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
        DataBrowserService.apiParams.searchState = 'dataSearch';

        $scope.browser = DataBrowserService.state();
        DataBrowserService.browse(options).then(function(resp) {
            $scope.browser = DataBrowserService.state();
        });

        $scope.state = {
            loadingMore: false,
            reachedEnd: false,
            page: 0,
        };

        $scope.scrollToTop = function() {
            return;
        };

        $scope.scrollToBottom = function() {
            DataBrowserService.scrollToBottom();
        };

        $scope.onBrowse = function($event, file) {
            $event.preventDefault();
            $event.stopPropagation();

            if (file.type === 'file') {
                DataBrowserService.preview(file, $scope.browser.listing);
            } else {
                $state.go('db', {systemId: file.system, filePath: file.path});
            }
        };

        $scope.onSelect = function($event, file) {
            $event.stopPropagation();
            if ($event.ctrlKey || $event.metaKey) {
                let selectedIndex = $scope.browser.selected.indexOf(file);
                if (selectedIndex > -1) {
                    DataBrowserService.deselect([file]);
                } else {
                    DataBrowserService.select([file]);
                }
            } else if ($event.shiftKey && $scope.browser.selected.length > 0) {
                let lastFile = $scope.browser.selected[
                    $scope.browser.selected.length - 1
                ];
                let lastIndex = $scope.browser.listing
                    .children.indexOf(lastFile);
                let fileIndex = $scope.browser.listing
                    .children.indexOf(file);
                let min = Math.min(lastIndex, fileIndex);
                let max = Math.max(lastIndex, fileIndex);
                DataBrowserService.select(
                    $scope.browser.listing.children.slice(min, max + 1)
                );
            } else if (typeof file._ui !== 'undefined' &&
                file._ui.selected) {
                DataBrowserService.deselect([file]);
            } else {
                DataBrowserService.select([file], true);
            }
        };

        $scope.showFullPath = function(item) {
            if ($scope.browser.listing.path != '$PUBLIC' &&
                item.parentPath() != $scope.browser.listing.path &&
                item.parentPath() != '/') {
                return true;
            }
            return false;
        };

        $scope.onDetail = function($event, file) {
            $event.stopPropagation();
            DataBrowserService.preview(file, $scope.browser.listing);
        };

        $scope.renderName = function(file) {
            if (typeof file.metadata === 'undefined' ||
                file.metadata === null ||
                _.isEmpty(file.metadata)) {
                return file.name;
            }
            let pathComps = file.path.split('/');
            let experimentRe = /^experiment/;
            if (file.path[0] === '/' && pathComps.length === 2) {
                return file.metadata.project.title;
            } else if (file.path[0] !== '/' &&
                pathComps.length === 2 &&
                experimentRe.test(file.name.toLowerCase())) {
                return file.metadata.experiments[0].title;
            }
            return file.name;
        };
    }
}
