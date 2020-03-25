describe('PublicDataViewCtrl', ()=>{
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
                DataBrowserService: _DataBrowserService_
            };
            const mockedBindings = {
                systems: [
                    {name: 'Public Data', systemId: 'test.public'}
                ]
            };
            controller = $componentController(
                'publicDataViewComponent',
                mockedServices,
                mockedBindings
            );
            spyOn(controller.$state, 'go')
            spyOn(
                controller.DataBrowserService,
                'browse'
            ).and.returnValue(browsePromise.promise);
            controller.$onInit();
        });
    });

    it('should initialize controller', () => {
        expect(controller).toBeDefined();
    });

    it('should go to correct state when browsing', () => {

        controller.onBrowse(
            {preventDefault: ()=>{return;},
            stopPropagation: ()=>{return;}},
            {system: 'test.public', path:'path/to/dir', type:'dir'},
        );
        expect(controller.$state.go).toHaveBeenCalledWith(
            'public_data',
            {
                directory: 'public',
                filePath: 'path/to/dir',
                query_string: null
            },
            {reload: true, inherit: false}
        );
    });

});
