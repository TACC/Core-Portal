describe('neurodataCollectionsComponent', () => {
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
                },
                mockedBindings = {
                };
            controller = $componentController(
                'neurodataCollectionsComponent',
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
        expect(controller.DataBrowserService.browse).toHaveBeenCalledWith({
            system: 'collection',
            path: 'collection',
        });
    });

    it('should go to correct state', () => {
        controller.onBrowse(null, {name: 'testfile'})
        expect(controller.$state.go).toHaveBeenCalledWith(
            'wb.data_depot.neurodata.experiments', 
            {collection: 'testfile'});
    })

});
