describe('DataDepotMainCtrl', ()=>{
    let controller, deferred, $scope, browsePromise;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject((
            _$q_,
            _$rootScope_,
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
            };
            const mockedBindings = {
                params: {
                    systemId: '',
                },
                systems: [{
                    systemId: 'test_system',
                    name: 'My Data'
                }]
            };
            controller = $componentController(
                'ddMainComponent',
                mockedServices,
                mockedBindings
            );
            spyOn(controller.$state, 'go')
            controller.$onInit();
        });
    });

    it('should initialize controller', () => {
        expect(controller).toBeDefined();
    });
    it('should reroute if no system is provided', () => {
        expect(controller.$state.go).toHaveBeenCalledWith(
            'wb.data_depot.db',
            {
                systemId: 'test_system',
                filePath: '',
                directory: 'agave',
                name: 'My Data'
            }
        )
    });

});
