describe('DataDepotCtrl', function() {
    var $q,
        scope,
        $controller, 
        $state, 
        $stateParams, 
        ctrl,
        ctrlParams,
        Django,
        DataBrowserService, 
        systems;

    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        //these get passed into controller via a resolve in ui-router
        systems = [{ systemId: 1, name: 'My Data' }, { systemId: 2, name: 'Community Data'}];
        angular.mock.inject(function(_$rootScope_, _$controller_,
            _DataBrowserService_, _$q_, 
            _Django_) {
            $controller = _$controller_;
            DataBrowserService = _DataBrowserService_;
            $q = _$q_;
            scope = _$rootScope_.$new();

            spyOn(DataBrowserService, 'state').and.returnValue({});

            Django = _Django_;
            systems = systems;
            ctrlParams = {
                $scope: scope,
                $state: $state,
                $stateParams: $stateParams,
                Django: Django,
                DataBrowserService: DataBrowserService,
                systems: systems
            };
            ctrl = $controller('DataDepotCtrl', ctrlParams);
    
        });
    });

    it('Should find Agave storage systems', function() {
        expect(scope.sysMyData).toBeTruthy();
        expect(scope.sysCommunityData).toBeTruthy();
    });

    it('Should load DataBrowserService state', function() {
        expect(DataBrowserService.state).toHaveBeenCalled();
        expect(scope.browser).toBeTruthy();
        
    });
});
