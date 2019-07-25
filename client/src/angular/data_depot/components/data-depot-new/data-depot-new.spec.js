describe('DataDepotNewCtrl', ()=>{
    let controller, UserService, DataBrowserService, $compile, $state, $stateProvider, deferred, $scope, browsePromise;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            _$compile_,
            _$state_,
            _UserService_,
            _DataBrowserService_,
            $componentController,
        ) => {
            $scope = _$rootScope_.$new();
            $compile = _$compile_;
            $state = _$state_;
            deferred = _$q_.defer();
            browsePromise = _$q_.defer();
            const mockedServices = {
                UserService: _UserService_,
                DataBrowserService: _DataBrowserService_
            };
            const mockedBindings = {
                systems: [
                    {systemId: 'test.data', name: 'My Data'},
                    {systemId: 'test.community', name: 'Community Data'}
                ],
                params: {
                    systemId: 'test.data',
                    filePath: '/'
                }
            };
            controller = $componentController(
                'ddNewComponent',
                mockedServices,
                mockedBindings
            );
            controller.UserService.currentUser = {username: 'testUser', oauth: true}
            
            controller.DataBrowserService.currentState = 
                {listing: {
                    listPermissions() {
                        return deferred.promise
                    }
                }}
            
            controller.$onInit();
            $scope.$digest();
        });
    });

    it('should initialize controller', () => {
        expect(controller).toBeDefined();
    });
    it('should set tests correctly when user has write permission', () => {
        controller.UserService.currentUser = {username: 'testUser', oauth: {}}
        controller.$onInit();
        deferred.resolve({response: [{
            username: 'testUser',
            permission: {write: true}
        }]})
        $scope.$apply();
        expect(controller.test).toEqual({
            enabled: true,
            createFiles: true,
            createProject: true
        })
    })
    it('should set tests correctly when user does not have write pems', () => {
        controller.UserService.currentUser = {username: 'testUser', oauth: {}}
        controller.$onInit();
        deferred.resolve({response: [{
            username: 'testUser',
            permission: {write: false}
        }]})
        $scope.$apply();
        expect(controller.test).toEqual({
            enabled: true,
            createFiles: false,
            createProject: true
        })
    })
    it('should set tests correctly when no user is logged in', () => {
        controller.UserService.currentUser = {}
        controller.$onInit();
        deferred.resolve({response: [{
            username: 'testUser',
            permission: {write: false}
        }]})
        $scope.$apply();
        expect(controller.test).toEqual({
            enabled: false,
            createFiles: false,
            createProject: false
        })
    })

});
