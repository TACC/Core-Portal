describe('NewProjectController', ()=>{
    let controller, deferred, $scope;
    const system = {
        'id': 'prtl.project.PRJ-123',
        'name': 'PRJ-123',
        'description': 'Project Title',
        'uuid': 'uuid',
    };

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$q_, _$rootScope_, _ProjectService_, $componentController) => {
                $scope = _$rootScope_.$new();
                deferred = _$q_.defer();
                const mockedServices = {
                    ProjectService: _ProjectService_,
                };
                const mockedBindings = {
                    resolve: {},
                    close: (ret) => { return ret; },
                    dismiss: (ret) => { return ret; }
                };
                controller = $componentController(
                    'newProjectModal',
                    mockedServices,
                    mockedBindings
                );

                controller.$onInit();
            }
        );
    });

    it('should initialize controller', () => {
        expect(controller.ProjectService).toBeDefined();
        expect(controller.form).toEqual({title:''});
        expect(controller.ui).toEqual({});
    });
    it('Creates a project', () => {
        // Spy on create method to return a mocked promise.
        spyOn(
            controller.ProjectService,
            'create'
        ).and.returnValue(deferred.promise);
        // Spy on 'close' to check if called or not.
        spyOn(
            controller,
            'close'
        );
        // Mock form value.
        controller.form = {
            title: system.description,
        };
        // Mock clicking on 'save' button.
        controller.ok();
        // Resolve mocked promise.
        deferred.resolve({
            status: 200,
            response: system,
        });

        expect(controller.ui.loading).toBeTruthy();
        // After $apply() the promise will be resolved.
        $scope.$apply();

        expect(controller.ui.loading).toBeFalsy();
        expect(controller.project).toEqual(system);
        expect(controller.ui.error).toBeFalsy();
        expect(controller.ui.status).toEqual(200);
        expect(controller.ProjectService.create).toHaveBeenCalledWith({
            title: system.description,
        });
        expect(controller.close).toHaveBeenCalled();
    });
    it('Handles an error when creating a project', () => {
        // Spy on create method to return a mocked promise.
        spyOn(
            controller.ProjectService,
            'create'
        ).and.returnValue(deferred.promise);
        // Spy on 'close' to check if called or not.
        spyOn(
            controller,
            'close'
        );
        // Mock form value.
        controller.form = {
            title: system.description,
        };
        // Mock clicking on 'save' button.
        controller.ok();
        // Reject promise, as if the backend would've return an error.
        deferred.reject({
            status: 500,
            message: 'Error message.',
        });

        expect(controller.ui.loading).toBeTruthy();

        // After $apply() the promise will be resolved.
        $scope.$apply();

        expect(controller.ui.loading).toBeFalsy();
        expect(controller.project).toBeUndefined();
        expect(controller.ui.message).toEqual('Error message.');
        expect(controller.ui.error).toBeTruthy();
        expect(controller.ui.status).toEqual(500);
        expect(controller.ProjectService.create).toHaveBeenCalledWith({
            title: system.description,
        });
        expect(controller.close).not.toHaveBeenCalled();
    });
});
