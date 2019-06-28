describe('DataViewCtrl', () => {
    let controller, deferred, $scope, browsePromise, SystemsService;

    // Mock requirements.
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            _DataBrowserService_,
            _UserService_,
            _$state_,
            _$stateParams_,
            _SystemsService_,
            $componentController
        ) => {
            SystemsService = _SystemsService_;
            SystemsService.systems = [
                { systemId: 'test.data', name: 'My Data' },
                { systemId: 'test.community', name: 'Community Data' },
                { fileMgr: 'google-drive', name: 'Google Drive', directory: 'external-resources' },
            ];
            $scope = _$rootScope_.$new();
            deferred = _$q_.defer();
            browsePromise = _$q_.defer();
            const mockedServices = {
                    $scope: $scope,
                    $stateParams: {
                        systemId: '',
                        filePath: '/',
                        name: 'My Data',
                        directory: 'agave',
                    },
                    $state: _$state_,
                    DataBrowserService: _DataBrowserService_,
                    SystemsService: SystemsService,
                },
                mockedBindings = {};
            controller = $componentController(
                'dataViewComponent',
                mockedServices,
                mockedBindings
            );
            controller.$onInit();
        });
    });

    it('should initialize controller', () => {
        expect(controller.browser).toBeDefined();
    });

    it('should set apiParams correctly on init', () => {
        controller.$stateParams.name = 'My Data';
        controller.$stateParams.directory = 'agave';
        controller.$onInit();
        expect(controller.DataBrowserService.apiParams.fileMgr).toBe('my-data');
        expect(controller.DataBrowserService.apiParams.baseUrl).toBe('/api/data-depot/files');
        expect(controller.DataBrowserService.apiParams.searchState).toBe('wb.data_depot.db');
        expect(controller.breadcrumbParams.customRoot.name).toBe('My Data');

        controller.$stateParams.name = 'Community Data';
        controller.$stateParams.directory = 'public';
        controller.$onInit();
        expect(controller.DataBrowserService.apiParams.fileMgr).toBe('shared');
        expect(controller.DataBrowserService.apiParams.baseUrl).toBe('/api/data-depot/files');
        expect(controller.DataBrowserService.apiParams.searchState).toBe('wb.data_depot.db');
        expect(controller.breadcrumbParams.customRoot.name).toBe('Community Data');

        controller.$stateParams.name = 'Google Drive';
        controller.$stateParams.directory = 'external-resources';
        controller.$stateParams.fileMgr = 'google-drive';
        controller.$onInit();
        expect(controller.DataBrowserService.apiParams.fileMgr).toBe('google-drive');
        expect(controller.DataBrowserService.apiParams.baseUrl).toBe('/api/data-depot/files');
        expect(controller.DataBrowserService.apiParams.searchState).toBe('wb.data_depot.db');
        expect(controller.breadcrumbParams.customRoot.name).toBe('Google Drive');

    });

    it('should go to correct state when browsing', () => {
        spyOn(
            controller.$state,
            'go'
        );
        controller.onBrowse(
            {
                preventDefault: () => { return; },
                stopPropagation: () => { return; },
            },
            { system: 'mock.system', path: 'path/to/dir', type: 'dir' }
        );
        expect(controller.$state.go).toHaveBeenCalledWith(
            'wb.data_depot.db',
            {
                systemId: 'mock.system',
                filePath: 'path/to/dir',
                directory: 'agave',
            },
            { reload: true, inherit: false }
        );
        expect(controller.$state.go).toHaveBeenCalledTimes(1);

        // No call should be made for external-resource with no id
        controller.$stateParams.directory = 'external-resources';
        controller.$stateParams.name = 'Google Drive';
        controller.$stateParams.fileMgr = 'google-drive';
        controller.onBrowse(
            {
                preventDefault: () => { return; },
                stopPropagation: () => { return; },
            },
            { path: 'path/to/dir', type: 'dir', id: null }
        );
        expect(controller.$state.go).toHaveBeenCalledTimes(1);

        // expect call for external-resource with id
        controller.onBrowse(
            {
                preventDefault: () => { return; },
                stopPropagation: () => { return; },
            },
            { path: 'path/to/dir', type: 'dir', id: 'testId' }
        );
        expect(controller.$state.go).toHaveBeenCalledWith(
            'wb.data_depot.external_resources',
            {
                filePath: 'path/to/dir',
                id: 'testId',
                name: 'Google Drive',
                fileMgr: 'google-drive',
            },
            { reload: true }
        );
        expect(controller.$state.go).toHaveBeenCalledTimes(2);
    });

    it('should preview obj onBrowse if obj is type file', () => {
        spyOn(controller.DataBrowserService, 'preview');
        controller.onBrowse(
            {
                preventDefault: () => { return; },
                stopPropagation: () => { return; },
            },
            { system: 'mock.system', path: 'path/to/dir', type: 'file' }
        );
        expect(controller.DataBrowserService.preview).toHaveBeenCalled();
    });

    it('should set breadcrumbParams trail when dir is external-resource and browser has listing', () => {
        spyOn(controller.DataBrowserService, 'state').and.returnValue(
            {
                listing: undefined,
                busyListing: false,
            }
        );

        controller.$stateParams.name = 'Google Drive';
        controller.$stateParams.directory = 'external-resources';
        controller.$stateParams.fileMgr = 'google-drive';
        controller.$onInit();
        expect(controller.breadcrumbParams.trail).toBeUndefined();

        controller.browser.listing = { trail: [] };
        $scope.$digest();
        expect(controller.breadcrumbParams.trail).toBeDefined();
        expect(controller.breadcrumbParams.trail).toEqual([]);
    });

    it('should find name for external resources with no name', () => {
        controller.$stateParams.name = undefined;
        controller.$stateParams.directory = 'external-resources';
        controller.$stateParams.fileMgr = 'google-drive';
        controller.$onInit();

        expect(controller.breadcrumbParams.customRoot.name).toBe('Google Drive');
    });
});
