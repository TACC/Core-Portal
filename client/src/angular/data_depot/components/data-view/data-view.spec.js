describe('DataViewCtrl', ()=>{
    let controller, deferred, $scope, browsePromise;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            _Django_,
            _DataBrowserService_,
            _$state_,
            _$stateParams_,
            $componentController
        ) => {
            $scope = _$rootScope_.$new();
            deferred = _$q_.defer();
            browsePromise = _$q_.defer();
            const mockedServices = {
                $state: _$state_,
                DataBrowserService: _DataBrowserService_,
                Django: _Django_
            };
            const mockedBindings = {
                params: {
                    systemId: '',
                    filePath: '/',
                    name: 'My Data',
                    directory: 'agave'
                }
            };
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
        controller.params.name = 'My Data';
        controller.params.directory = 'agave';
        controller.$onInit();
        expect(controller.DataBrowserService.apiParams.fileMgr).toBe('my-data');
        expect(controller.DataBrowserService.apiParams.baseUrl).toBe('/api/data-depot/files');
        expect(controller.DataBrowserService.apiParams.searchState).toBe('wb.data_depot.db');

        controller.params.name = 'Community Data';
        controller.params.directory = 'public';
        controller.$onInit();
        expect(controller.DataBrowserService.apiParams.fileMgr).toBe('shared');
        expect(controller.DataBrowserService.apiParams.baseUrl).toBe('/api/data-depot/files');
        expect(controller.DataBrowserService.apiParams.searchState).toBe('wb.data_depot.db');

    });

});
