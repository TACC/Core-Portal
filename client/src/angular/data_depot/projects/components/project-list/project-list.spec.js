describe('ProjectListCtrl', ()=>{
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
            };
            controller = $componentController(
                'projectListComponent',
                mockedServices,
                mockedBindings
            );
            spyOn(controller.ProjectService, 'list').and.returnValue(deferred.promise)
            controller.$onInit();
        });
    });

    it('should initialize controller', () => {
        expect(controller).toBeDefined();
        expect(controller.onBrowse).toBeDefined();
        expect(controller.onBrowseProjectRoot).toBeDefined();
    });
    it('should resolve project list promise', () => {
        deferred.resolve('project response')
        $scope.$apply();
        expect(controller.data.projects).toBe('project response')
    })
    it('should set search state', () => {
        expect(controller.DataBrowserService.apiParams.searchState).toBe('wb.data_depot.projects.list')
    })
});
