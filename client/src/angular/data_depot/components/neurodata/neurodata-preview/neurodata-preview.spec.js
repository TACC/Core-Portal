describe('neurodataPreviewComponent', () => {
    let controller, deferred, $scope, browsePromise, coordPromise, FileListing;

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
            coordPromise = _$q_.defer();
            FileListing = _FileListing_;
            const mockedServices = {
                    $state: _$state_,
                    DataBrowserService: _DataBrowserService_,
                    $stateParams: {
                        collection: 'collection1',
                        experiment: 'experiment1'
                    }
                },
                mockedBindings = {
                    resolve: {file: {name: 'channel1', coordFrame: () => coordPromise.promise}},
                    dismiss: () => {}
                };
            controller = $componentController(
                'neurodataPreviewComponent',
                mockedServices,
                mockedBindings
            );
            spyOn(
                controller.DataBrowserService,
                'browse'
            ).and.returnValue(browsePromise.promise);
            spyOn(
                controller.DataBrowserService,
                'neurodataPreview'
            ).and.returnValue(browsePromise.promise);
            spyOn(
                controller.DataBrowserService,
                'neurodataSave'
            ).and.returnValue(browsePromise.promise);
            
            controller.$onInit();
        });
    });

    it('should browse onInit', () => {
        expect(controller.DataBrowserService.browse).toHaveBeenCalledWith({
            system: 'channel.preview',
            path: 'collection/collection1/experiment/experiment1/channel/channel1',
        });

        browsePromise.resolve({children: ['child1']});
        coordPromise.resolve('coord1');
        $scope.$apply();

        expect(controller.channel).toEqual('child1');
        expect(controller.coords).toEqual('coord1');

    });

    it('should change download type', () => {
        expect(controller.previewParams.type).toBe('.jpg');
        controller.downloadType('blosc');
        expect(controller.previewParams.type).toBe('blosc');

    })

    it('should save', () => {
        controller.previewParams.filename = 'testfile';
        controller.save();
        expect(controller.DataBrowserService.neurodataSave).toHaveBeenCalledWith(
            controller.resolve.file,
            controller.previewParams
        );
    })

    it('should close', () => {
        spyOn(controller, 'dismiss');
        controller.close();
        expect(controller.dismiss).toHaveBeenCalled();
    })

});
