describe('FileListingCtrl', () => {
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
                    params: {
                        systemId: '',
                        filePath: '/',
                        browseState: '',
                        directory: 'agave',
                    },
                    onBrowse: () => { },
                };
            controller = $componentController(
                'fileListingComponent',
                mockedServices,
                mockedBindings
            );
            spyOn(
                controller.DataBrowserService,
                'browse'
            ).and.returnValue(browsePromise.promise);

            controller.$onInit();
        });
    });

    it('should initialize controller', () => {
        expect(controller.browser).toBeDefined();
    });
    it('should browse onInit', () => {
        expect(controller.DataBrowserService.browse).toHaveBeenCalledWith({
            system: '',
            path: '/',
            offset: 0,
            limit: 100,
            queryString: undefined,
            id: undefined,
        });
    });

    it('should show/hide the Show More Files button depending on browser state', () => {
        // hide button when listing.children is undefined, e.g. when an error occurs
        controller.browser = { listing: {}, busyListing: false, busy: false, reachedEnd: false };
        expect(controller.showMoreFilesButton()).toBe(false);
        // hide button when a listing is completed and the reachedEnd flag has been set to true
        controller.browser = { listing: { children: [] }, busyListing: false, busy: false, reachedEnd: true };
        expect(controller.showMoreFilesButton()).toBe(false);
        // hide button while initial listing is being retrieved
        controller.browser = { listing: { children: [] }, busyListing: true, busy: true, reachedEnd: false };
        expect(controller.showMoreFilesButton()).toBe(false);
        // show button when listing.children is defined but reachedEnd is still false
        controller.browser = { listing: { children: [] }, busyListing: false, busy: false, reachedEnd: false };
        expect(controller.showMoreFilesButton()).toBe(true);
    });
});


describe('FileListingComponent', function() {
    let $scope, $q, $compile, element, DataBrowserService, FileListing;

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
            _$compile_,
            _FileListing_
        ) => {
            $q = _$q_;
            DataBrowserService = _DataBrowserService_;
            FileListing = _FileListing_;
            $compile = _$compile_;
            $scope = _$rootScope_.$new();
            $scope.onBrowse = (f) => { };
            $scope.listingParams = { systemId: 'test', limit: 100, offset: 0 };
            let componentHtml = '<file-listing-component params="listingParams" on-browse="onBrowse($event, file)"></file-listing-component>';
            element = angular.element(componentHtml);

        });
    });

    // TODO: Add more file listing tests in here

    it('Should have a message if there are no files in the listing', () => {
        spyOn(FileListing, 'get').and.returnValue(
            $q.when({ name: 'test', path: '/test', children: [] })
        );
        element = $compile(element)($scope);
        $scope.$digest();
        expect(element.html()).toContain('No files to show!');
    });

    it('Should not have the no files message when there are files in a listing', () => {
        spyOn(FileListing, 'get').and.returnValue(
            $q.when({ name: 'test', path: '/test', children: [{}, {}] })
        );
        element = $compile(element)($scope);
        $scope.$digest();
        expect(element.html()).not.toContain('No files to show!');
    });
});


// TODO: This functionality should be moved to data-view.controller
describe('FileListingCtrl file modal open', function() {
    let controller, $scope, $q;

    // Mock requirements.
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            _DataBrowserService_,
            _$state_,
            _$stateParams_,
            $componentController
        ) => {
            $q = _$q_;
            $scope = _$rootScope_.$new();
            const mockedServices = {
                    $state: _$state_,
                    DataBrowserService: _DataBrowserService_,
                },
                mockedBindings = {
                    params: {
                        systemId: '',
                        filePath: '/',
                        browseState: '',
                    },
                };

            controller = $componentController(
                'fileListingComponent',
                mockedServices,
                mockedBindings
            );

            spyOn(controller.DataBrowserService, 'browse').and.callFake(function() {
                let deferred = $q.defer();
                deferred.resolve('Response');
                return deferred.promise;
            });
            spyOn(controller.DataBrowserService, 'preview');
            spyOn(controller.DataBrowserService, 'state').and.returnValue(
                {
                    listing: {
                        type: 'file',
                    },
                    children: {
                        length: 0,
                    },
                }
            );
            controller.$onInit();
            $scope.$digest();
        });
    });

    it('should open a file preview modal', () => {
        expect(controller.DataBrowserService.browse).toHaveBeenCalled();
        expect(controller.DataBrowserService.state).toHaveBeenCalled();
        expect(controller.DataBrowserService.preview).toHaveBeenCalled();
    });
});
