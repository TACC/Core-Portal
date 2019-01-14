describe('FileListingCtrl', ()=>{
    let controller, deferred, $scope, browsePromise;

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
            $scope = _$rootScope_.$new();
            deferred = _$q_.defer();
            browsePromise = _$q_.defer();
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
            {system: 'mock.system', path:'path/to/dir', type:'dir'}
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
