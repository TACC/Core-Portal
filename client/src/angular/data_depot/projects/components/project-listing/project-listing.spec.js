describe('ProjectListingCtrl', ()=>{
    let controller, deferred, $scope, browsePromise;
    const systemOne = {
        'id': 'prtl.project.PRJ-123',
        'name': 'PRJ-123',
        'description': 'Project Title 123',
        'uuid': 'uuid-123',
    };
    const systemTwo = {
        'id': 'prtl.project.PRJ-456',
        'name': 'PRJ-456',
        'description': 'Project Title 456',
        'uuid': 'uuid-456',
    };
    const projectsListing = [systemOne, systemTwo];

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            _ProjectService_,
            _DataBrowserService_,
            _$state_,
            $componentController
        ) => {
            $scope = _$rootScope_.$new();
            deferred = _$q_.defer();
            browsePromise = _$q_.defer();
            const mockedServices = {
                $state: _$state_,
                ProjectService: _ProjectService_,
                DataBrowserService: _DataBrowserService_
            };
            const mockedBindings = {
                params: {
                    systemId: '',
                    filePath: '/',
                }
            };
            controller = $componentController(
                'projectListingComponent',
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
        expect(controller.data.customRoot).toBeDefined();
        expect(controller.browser).toBeDefined();
        expect(controller.DataBrowserService.apiParams.fileMgr).toEqual('my-projects');
    });
    it('should browse onInit', () => {
        expect(controller.DataBrowserService.browse).toHaveBeenCalledWith({
            system: '',
            path: '/',
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
            'wb.data_depot.projects.listing',
            {
                systemId: 'mock.system',
                filePath: 'path/to/dir',
            }
        );
    });
});
