describe('neurodataBreadcrumb', () => {
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
                    $stateParams: {
                        collection: 'collection1',
                        experiment: 'experiment1'
                    }
                },
                mockedBindings = {
                };
            controller = $componentController(
                'neurodataBreadcrumbComponent',
                mockedServices,
                mockedBindings
            );
            spyOn(
                controller.$state,
                'go'
            ).and.returnValue(browsePromise.promise);

        });
    });

    it('should browse root', () => {
        controller.onBrowseNeuroRoot();
        expect(controller.$state.go).toHaveBeenCalledWith('wb.data_depot.neurodata.collections', 
            {}, 
            {reload: true});
    });

    it('should browse collection', () => {
        controller.onBrowseCollection();
        expect(controller.$state.go).toHaveBeenCalledWith('wb.data_depot.neurodata.experiments', 
            {collection: 'collection1'}, 
            {reload: true});
    });

    it('should browse experiment', () => {
        controller.onBrowseExperiment();
        expect(controller.$state.go).toHaveBeenCalledWith('wb.data_depot.neurodata.channels', 
            {collection: 'collection1', experiment: 'experiment1'}, 
            {reload: true});
    });

});
