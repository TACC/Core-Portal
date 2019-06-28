describe('DataDepotNavCtrl', () => {
    let controller, $compile, $state, deferred, $scope, browsePromise;

    // Mock requirements.
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            _$compile_,
            _$state_,
            $componentController
        ) => {
            $scope = _$rootScope_.$new();
            $compile = _$compile_;
            $state = _$state_;
            deferred = _$q_.defer();
            browsePromise = _$q_.defer();
            const mockedServices = {},
                mockedBindings = {
                    systems: [
                        { systemId: 'test.data', name: 'My Data' },
                        { systemId: 'test.community', name: 'Community Data' },
                        { fileMgr: 'google-drive', name: 'Google Drive', directory: 'external-resources' },
                    ],
                    params: {
                        systemId: 'test.data',
                        filePath: '/',
                    },
                };
            controller = $componentController(
                'ddNavComponent',
                mockedServices,
                mockedBindings
            );
            controller.$onInit();
            $scope.systems = controller.systems;
        });
    });

    it('should initialize controller', () => {
        expect(controller).toBeDefined();
    });

    it('should set My Data active state', () => {
        $scope.systems = controller.systems;
        $scope.params = { systemId: 'test.data', filePath: '/' };
        let element = angular.element("<dd-nav-component systems='systems' params='params'></dd-nav-component>");
        element = $compile(element)($scope);
        $scope.$digest();
        expect(element.find('a').eq(0).attr('class')).toContain('active');
        expect(element.find('a').eq(1).attr('class')).not.toContain('active');
        expect(element.find('a').eq(2).attr('class')).not.toContain('active');
        expect(element.find('a').eq(3).attr('class')).not.toContain('active');
    });

    it('should set Community Data active state', () => {
        $scope.systems = controller.systems;
        $scope.params = { systemId: 'test.community', filePath: '/' };
        let element = angular.element("<dd-nav-component systems='systems' params='params'></dd-nav-component>");
        element = $compile(element)($scope);
        $scope.$digest();
        expect(element.find('a').eq(0).attr('class')).not.toContain('active');
        expect(element.find('a').eq(1).attr('class')).not.toContain('active');
        expect(element.find('a').eq(2).attr('class')).toContain('active');
        expect(element.find('a').eq(3).attr('class')).not.toContain('active');
    });

    it('should set External Resources active state', () => {
        $scope.systems = controller.systems;
        $scope.params = { fileMgr: 'google-drive', filePath: '/' };
        let element = angular.element("<dd-nav-component systems='systems' params='params'></dd-nav-component>");
        element = $compile(element)($scope);
        $scope.$digest();
        expect(element.find('a').eq(0).attr('class')).not.toContain('active');
        expect(element.find('a').eq(1).attr('class')).not.toContain('active');
        expect(element.find('a').eq(2).attr('class')).not.toContain('active');
        expect(element.find('a').eq(3).attr('class')).toContain('active');
    });
});
