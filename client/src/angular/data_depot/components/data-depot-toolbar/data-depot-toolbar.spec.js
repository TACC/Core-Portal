describe('DataDepotToolbarCtrl', () => {
    let controller, UserService, DataBrowserService, 
        $compile, $state, $stateProvider, deferred, $scope, browsePromise;
 

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach(() => {
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            _$compile_,
            _$state_,
            _UserService_,
            _DataBrowserService_,
            $componentController,
        ) => {
            $scope = _$rootScope_.$new();
            $compile = _$compile_;
            $state = _$state_;
            deferred = _$q_.defer();
            browsePromise = _$q_.defer();

            const mockedServices = {
                UserService: _UserService_,
                DataBrowserService: _DataBrowserService_,
                ZipService: jasmine.createSpyObj('ZipService', [ 'compress', 'extract' ])
            };
            const mockedBindings = {
                systems: [
                    { systemId: 'test.data', name: 'My Data' },
                    { systemId: 'test.community', name: 'Community Data' }
                ],
                params: {
                    systemId: 'test.data',
                    filePath: '/'
                }
            };
            controller = $componentController(
                'ddToolbarComponent',
                mockedServices,
                mockedBindings
            );
            spyOn(controller.DataBrowserService, 'allowedActions').and.returnValue({
                canDownload: true,
                canPreview: true,
                canViewMetadata: true,
                canShare: true,
                canCopy: true,
                canMove: true,
                canRename: true,
                canViewCategories: true

            });
            spyOn(controller.DataBrowserService, 'apiParameters').and.returnValue({
                searchState: 'test.state'
            });
            spyOn(controller.DataBrowserService, 'toolbarOptions');
            controller.$onInit();
            $scope.$digest();
        });
    });
    it('should initialize controller', () => {
        expect(controller).toBeDefined();
        spyOn(controller, 'updateToolbar')
        controller.$onInit();
        expect(controller.updateToolbar).toHaveBeenCalled();
    });
    it('should get tests from the data browser service', () => {
        expect(controller.tests).toEqual({
            canDownload: true,
            canPreview: true,
            canViewMetadata: true,
            canShare: true,
            canCopy: true,
            canMove: true,
            canRename: true,
            canViewCategories: true
        })
    })

});
