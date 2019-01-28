describe('DataDepotBreadcrumbCtrl', ()=>{
    let controller, deferred, $scope, browsePromise;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            $componentController
        ) => {
            $scope = _$rootScope_.$new();
            deferred = _$q_.defer();
            browsePromise = _$q_.defer();
            const mockedServices = {
            };
            const mockedBindings = {
                params: {
                    systemId: 'test.system',
                    filePath: '/path/subpath',
                    customRoot: {
                        name: 'My Custom Root',
                        system: 'test.system',
                        path: '/'
                    }
                },
                skipRoot: false,
                skipPath: false,
                project: false,
                onBrowse: () => {},
                onBrowseProjectRoot: () => {}

            };
            controller = $componentController(
                'ddBreadcrumbComponent',
                mockedServices,
                mockedBindings
            );
            controller.$onInit();
        });
    });
    it('should initialize controller', () => {
        expect(controller).toBeDefined();
    });
    it('should populate trail on $scope.$digest after init', () => {
        spyOn(controller, 'populate_trail');
        controller.$scope.$digest();
        expect(controller.populate_trail).toHaveBeenCalled();
    });
    it('should populate trail with correct values', () => {
        controller.$scope.$digest();
        expect(controller.trail).toEqual([
            {path: '', system: 'test.system', name: 'My Custom Root'},
            {path: '/path', system: 'test.system', name: 'path'},
            {path: '/path/subpath', system: 'test.system', name: 'subpath'},
        ]); 
    });
    it('should skip root when skipRoot is true', () => {
        controller.skipRoot = true;
        controller.$onInit();
        controller.$scope.$digest();
        expect(controller.offset).toBe(1);
        expect(controller.trail).toEqual([
            //{path: '', system: 'test.system', name: 'My Custom Root'},
            {path: '/path', system: 'test.system', name: 'path'},
            {path: '/path/subpath', system: 'test.system', name: 'subpath'},
        ]); 
    })
    it('should have empty trail if skipPath is true and no path passed', () => {
        controller.params = {}
        controller.skipPath = true
        controller.$onInit();
        controller.$scope.$digest();
        expect(controller.trail).toEqual([])
    })

});
