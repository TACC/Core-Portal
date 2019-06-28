describe('DataDepotBreadcrumbCtrl', () => {
    let controller, deferred, $scope, browsePromise;

    // Mock requirements.
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            $componentController
        ) => {
            $scope = _$rootScope_.$new();
            deferred = _$q_.defer();
            browsePromise = _$q_.defer();
            const mockedServices = {},
                mockedBindings = {
                    params: {
                        systemId: 'test.system',
                        filePath: '/path/subpath',
                        customRoot: {
                            name: 'My Custom Root',
                            system: 'test.system',
                            path: '/',
                        },
                    },
                    skipRoot: false,
                    skipPath: false,
                    project: false,
                    onBrowse: () => { },
                    onBrowseProjectRoot: () => { },

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
        spyOn(controller, 'populateTrail');
        controller.$scope.$digest();
        expect(controller.populateTrail).toHaveBeenCalled();
    });

    it('should populate trail with correct values', () => {
        controller.$scope.$digest();
        expect(controller.trail).toEqual([
            { path: '', system: 'test.system', name: 'My Custom Root' },
            { path: '/path', system: 'test.system', name: 'path' },
            { path: '/path/subpath', system: 'test.system', name: 'subpath' },
        ]);
    });

    it('should skip root when skipRoot is true', () => {
        controller.skipRoot = true;
        controller.$onInit();
        controller.$scope.$digest();
        expect(controller.offset).toBe(1);
        expect(controller.trail).toEqual([
            // {path: '', system: 'test.system', name: 'My Custom Root'},
            { path: '/path', system: 'test.system', name: 'path' },
            { path: '/path/subpath', system: 'test.system', name: 'subpath' },
        ]);
    });

    it('should have empty trail if skipPath is true and no path passed', () => {
        controller.params = {};
        controller.skipPath = true;
        controller.$onInit();
        controller.$scope.$digest();
        expect(controller.trail).toEqual([]);
    });

    it('should populate external trail on $scope.$digest after init with external-resource dir', () => {
        spyOn(controller, 'populateExternalTrail');
        controller.params.directory = 'external-resources';
        controller.$onInit();
        controller.$scope.$digest();
        expect(controller.populateExternalTrail).toHaveBeenCalled();
    });

    it('should have basic trail if directory is external-resources and no trail passed', () => {
        controller.params.directory = 'external-resources';
        controller.$onInit();
        controller.$scope.$digest();
        expect(controller.trail).toEqual([
            { path: '', system: 'test.system', name: 'My Custom Root' },
            { path: '/path', system: 'test.system', name: 'path' },
            { path: '/path/subpath', system: 'test.system', name: 'subpath' },
        ]);
    });

    it('should skip root when skipRoot is true and dir is external-resources', () => {
        controller.skipRoot = true;
        controller.params.directory = 'external-resources';
        controller.$onInit();
        controller.$scope.$digest();
        expect(controller.offset).toBe(1);
        expect(controller.trail).toEqual([
            // {path: '', system: 'test.system', name: 'My Custom Root'},
            { path: '/path', system: 'test.system', name: 'path' },
            { path: '/path/subpath', system: 'test.system', name: 'subpath' },
        ]);
    });

    it('should have trail with ids if directory is external-resources and trail passed', () => {
        let trail = [
            {
                name: '',
                path: '/',
                id: 'root',
            },
            {
                name: 'Test',
                path: '/Test',
                id: 'testId1',
            },
            {
                name: 'Sub Test',
                path: '/Test/Sub Test',
                id: 'testId2',
            },
        ];

        controller.params.directory = 'external-resources';
        controller.params.trail = trail;
        controller.$onInit();
        controller.$scope.$digest();
        expect(controller.trail).toEqual([
            { path: '/', id: 'root', name: 'My Custom Root' },
            { path: '/Test', id: 'testId1', name: 'Test' },
            { path: '/Test/Sub Test', id: 'testId2', name: 'Sub Test' },
        ]);
    });
});
