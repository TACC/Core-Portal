describe('neurodataExperimentsComponent', () => {
    let controller, deferred, $scope, browsePromise, FileListing;

    // Mock requirements.
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            _DataBrowserService_,
            _$state_,
            _$stateParams_,
            $componentController,
            _FileListing_
        ) => {
            $scope = _$rootScope_.$new();
            deferred = _$q_.defer();
            browsePromise = _$q_.defer();
            FileListing = _FileListing_;
            const mockedServices = {
                    $state: _$state_,
                    DataBrowserService: _DataBrowserService_,
                    $stateParams: {
                        collection: 'collection1'
                    }
                },
                mockedBindings = {
                };
            controller = $componentController(
                'neurodataExperimentsComponent',
                mockedServices,
                mockedBindings
            );
            spyOn(
                controller.DataBrowserService,
                'browse'
            ).and.returnValue(browsePromise.promise);

            spyOn(
                controller.$state,
                'go'
            ).and.returnValue(browsePromise.promise);

            controller.$onInit();
        });
    });

    it('should browse onInit', () => {
        expect(controller.requesting).toBe(true);
        expect(controller.DataBrowserService.browse).toHaveBeenCalledWith({
            system: 'experiment',
            path: 'collection/collection1',
        });
        browsePromise.resolve();
        $scope.$apply();
        expect(controller.requesting).toBe(false);
    });

    it('should go to correct state', () => {
        controller.onBrowse(null, {name: 'testexpt'})
        expect(controller.$state.go).toHaveBeenCalledWith(
            'wb.data_depot.neurodata.channels', 
            {collection: 'collection1',
            experiment: 'testexpt'});
    })

});
