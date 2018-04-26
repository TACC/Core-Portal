export default function DataBrowserCtrl($scope, $state, $stateParams, Django, DataBrowserService, SystemsService, ProjectService) {
    'ngInject';

    // get user data from SystemsService
    $scope.sysCommunityData = _.find(SystemsService.systems, { name: 'Community Data' });
    $scope.sysMyData = _.find(SystemsService.systems, { name: "My Data" });

    //  $stateParams is pulling info from the html section of the data-depot
    //  and we will swap the data based on the systemID variables we place there
    //  'options' will contain the different variables required to change the display
    var options = {
        system: ($stateParams.systemId),
        path: ($stateParams.filePath),
        name: ($stateParams.name),
        directory: ($stateParams.directory)
    };

    // display "My Data" for first visit or refresh...
    if (options.name == undefined || options.name == '') {
        $state.go('wb.data_depot.db', {
            systemId: $scope.sysMyData.systemId,
            name: $scope.sysMyData.name,
            directory: 'agave'
        });
    }
    


    if ($stateParams.name == 'My Data') {
        console.log('Directory for My Data...');

        // this should change based on variables in options
        $scope.data = {
            user: Django.user,
            customRoot: {
                name: $stateParams.name,
                href: $state.href('db', {
                    systemId: $stateParams.systemId,
                    filePath: $stateParams.filePath,
                    directory: $stateParams.directory
                })
            }
        };

        // TODO: This needs to change base on the "options" supplied
        DataBrowserService.apiParams.fileMgr = 'my-data';
        DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
        DataBrowserService.apiParams.searchState = 'dataSearch';


        // same
        $scope.browser = DataBrowserService.state();
        DataBrowserService.browse(options).then(function (resp) {
            $scope.browser = DataBrowserService.state();
            //this line below is new...
            $scope.searchState = DataBrowserService.apiParams.searchState;
        });

        // missing $scope.state object - community

        // same
        $scope.scrollToTop = function () {
            return;
        };
        // same
        $scope.scrollToBottom = function () {
            DataBrowserService.scrollToBottom();
        };
        // check - community
        $scope.onBrowse = function ($event, file) {
            $event.preventDefault();
            $event.stopPropagation();
            if (file.type === 'file') {
                DataBrowserService.preview(file, $scope.browser.listing);
            }
        };

        // same
        $scope.onSelect = function ($event, file) {
            $event.stopPropagation();
            if ($event.ctrlKey || $event.metaKey) {
                var selectedIndex = $scope.browser.selected.indexOf(file);
                if (selectedIndex > -1) {
                    DataBrowserService.deselect([file]);
                } else {
                    DataBrowserService.select([file]);
                }
            } else if ($event.shiftKey && $scope.browser.selected.length > 0) {
                var lastFile = $scope.browser.selected[$scope.browser.selected.length - 1];
                var lastIndex = $scope.browser.listing.children.indexOf(lastFile);
                var fileIndex = $scope.browser.listing.children.indexOf(file);
                var min = Math.min(lastIndex, fileIndex);
                var max = Math.max(lastIndex, fileIndex);
                DataBrowserService.select($scope.browser.listing.children.slice(min, max + 1));
            } else if (typeof file._ui !== 'undefined' &&
                file._ui.selected) {
                DataBrowserService.deselect([file]);
            } else {
                DataBrowserService.select([file], true);
            }
        };
        // missing showFullPath function - community
        // missing renderName function - community

        // same
        $scope.onDetail = function ($event, file) {
            $event.stopPropagation();
            DataBrowserService.preview(file, $scope.browser.listing);
        };


    } else if ($stateParams.name == 'My Projects') {
        console.log('Directory for My Projects...');

        $scope.ui = {};

        $scope.data = {
            customRoot: {
                name: $stateParams.name,
                href: $state.href('db', {
                    systemId: $stateParams.systemId,
                    filePath: $stateParams.filePath,
                    directory: $stateParams.directory
                })
            }
        };

        $scope.ui.busy = true;
        $scope.data.projects = [];
        ProjectService.list().then(function (projects) {
            console.log(projects);
            $scope.ui.busy = false;
            $scope.data.projects = projects;
        });

        $scope.onBrowse = function onBrowse($event, project) {
            $event.preventDefault();
            $state.go('db.projects.listing', {
                systemId: project.id,
                filePath: '/',
                projectTitle: project.name
            });
        };

    
    } else if ($stateParams.name == 'Community Data') {
        console.log('Directory for Community Data...');

        // this should change based on variables in options
        $scope.data = {
            customRoot: {
                name: $stateParams.name,
                href: $state.href('db', {
                    systemId: $stateParams.systemId,
                    filePath: $stateParams.filePath,
                    directory: $stateParams.directory
                })
            }
        };

        DataBrowserService.apiParams.fileMgr = 'shared';
        DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
        DataBrowserService.apiParams.searchState = 'dataSearch';

        $scope.browser = DataBrowserService.state();
        DataBrowserService.browse(options).then(function (resp) {
            $scope.browser = DataBrowserService.state();
        });

        $scope.state = {
            loadingMore: false,
            reachedEnd: false,
            page: 0
        };

        $scope.scrollToTop = function () {
            return;
        };

        $scope.scrollToBottom = function () {
            DataBrowserService.scrollToBottom();
        };

        $scope.onBrowse = function ($event, file) {
            $event.preventDefault();
            $event.stopPropagation();

            var systemId = file.system || file.systemId;
            var filePath;
            if (file.path == '/') {
                filePath = file.path + file.name;
            } else {
                filePath = file.path;
            }
            if (file.type === 'file') {
                DataBrowserService.preview(file, $scope.browser.listing);
            } else {
                $state.go('db', { systemId: file.system, filePath: file.path });
            }
        };

        $scope.onSelect = function ($event, file) {
            $event.stopPropagation();
            if ($event.ctrlKey || $event.metaKey) {
                var selectedIndex = $scope.browser.selected.indexOf(file);
                if (selectedIndex > -1) {
                    DataBrowserService.deselect([file]);
                } else {
                    DataBrowserService.select([file]);
                }
            } else if ($event.shiftKey && $scope.browser.selected.length > 0) {
                var lastFile = $scope.browser.selected[$scope.browser.selected.length - 1];
                var lastIndex = $scope.browser.listing.children.indexOf(lastFile);
                var fileIndex = $scope.browser.listing.children.indexOf(file);
                var min = Math.min(lastIndex, fileIndex);
                var max = Math.max(lastIndex, fileIndex);
                DataBrowserService.select($scope.browser.listing.children.slice(min, max + 1));
            } else if (typeof file._ui !== 'undefined' &&
                file._ui.selected) {
                DataBrowserService.deselect([file]);
            } else {
                DataBrowserService.select([file], true);
            }
        };

        $scope.showFullPath = function (item) {
            if ($scope.browser.listing.path != '$PUBLIC' &&
                item.parentPath() != $scope.browser.listing.path &&
                item.parentPath() != '/') {
                return true;
            } else {
                return false;
            }
        };

        $scope.onDetail = function ($event, file) {
            $event.stopPropagation();
            DataBrowserService.preview(file, $scope.browser.listing);
        };

        $scope.renderName = function (file) {
            if (typeof file.metadata === 'undefined' ||
                file.metadata === null ||
                _.isEmpty(file.metadata)) {
                return file.name;
            }
            var pathComps = file.path.split('/');
            var experiment_re = /^experiment/;
            if (file.path[0] === '/' && pathComps.length === 2) {
                return file.metadata.project.title;
            }
            else if (file.path[0] !== '/' &&
                pathComps.length === 2 &&
                experiment_re.test(file.name.toLowerCase())) {
                return file.metadata.experiments[0].title;
            }
            return file.name;
        };
        
    }
}