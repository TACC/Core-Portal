describe('FileListingCtrl', ()=>{
    let controller, deferred, $scope, browsePromise;
    let FileListing;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
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
                DataBrowserService: _DataBrowserService_
            };
            const mockedBindings = {
                params: {
                    systemId: '',
                    filePath: '/',
                    browseState: ''
                }
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
            queryString: undefined
        });
    });
    it('should go to correct state when browsing', () => {
        spyOn(
            controller.$state,
            'go'
        );
        controller.onBrowse(
            {preventDefault: ()=>{return;},
            stopPropagation: ()=>{return;}},
            FileListing.init({system: 'mock.system', path:'path/to/dir', type:'dir'})
        );
        expect(controller.$state.go).toHaveBeenCalledWith(
            controller.params.browseState,
            {
                systemId: 'mock.system',
                filePath: 'path/to/dir',
            }
        );
    });
    it('should show/hide the Show More Files button depending on browser state', () => {
        //hide button when listing.children is undefined, e.g. when an error occurs
        controller.browser = {listing: {}, busyListing: false, busy: false, reachedEnd: false}
        expect(controller.showMoreFilesButton()).toBe(false)
        //hide button when a listing is completed and the reachedEnd flag has been set to true
        controller.browser = {listing: {children: []}, busyListing: false, busy: false, reachedEnd: true}
        expect(controller.showMoreFilesButton()).toBe(false)
        //hide button while initial listing is being retrieved
        controller.browser = {listing: {children: []}, busyListing: true, busy: true, reachedEnd: false}
        expect(controller.showMoreFilesButton()).toBe(false)
        //show button when listing.children is defined but reachedEnd is still false
        controller.browser = {listing: {children: []}, busyListing: false, busy: false, reachedEnd: false}
        expect(controller.showMoreFilesButton()).toBe(true)
    })
});

// TODO: This functionality should be moved to data-view.controller
describe('FileListingCtrl file modal open', function() {
    let controller, $scope, $q;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
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
                DataBrowserService: _DataBrowserService_
            };
            const mockedBindings = {
                params: {
                    systemId: '',
                    filePath: '/',
                    browseState: ''
                }
            };

            controller = $componentController(
                'fileListingComponent',
                mockedServices,
                mockedBindings
            );
            
            spyOn(controller.DataBrowserService, 'browse').and.callFake(function() {
                var deferred = $q.defer();
                deferred.resolve("Response");
                return deferred.promise;
            });
            spyOn(controller.DataBrowserService, 'preview');
            spyOn(controller.DataBrowserService, 'state').and.returnValue(
                {
                    listing: {
                        type: 'file'
                    },
                    children: {
                        length: 0
                    }
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
