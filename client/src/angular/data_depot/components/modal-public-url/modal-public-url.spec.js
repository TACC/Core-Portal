describe('ModalPublicUrlCtrl', () => {
    let controller, file, dismiss, $q, $scope, UserService, DataBrowserService, 
        $compile, $state, $stateProvider, deferred, browsePromise;
 

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            _$compile_,
            _$state_,
            _UserService_,
            _DataBrowserService_,
            $componentController,
        ) => {

            $q = _$q_
            $scope = _$rootScope_.$new()
        
            dismiss = jasmine.createSpy('dismiss')

            file = {
                system: 'agave.system',
                path: '/filename.txt',
                name: 'filename.txt',
                publicUrl: function () {}
            };

            const mockedBindings = {
                resolve: {
                    file: file,
                },
                dismiss: dismiss
            };

            const mockedServices = {}

            controller = $componentController(
                'modalPublicUrlComponent',
                mockedServices,
                mockedBindings
            );

            //spyOn(dismiss)

            spyOn(file, 'publicUrl').and.returnValue($q.when({ 
                file_id: 'cep.test//file01',
                expires: '2020-05-01 14:51:15.472382',
                updated: '2019-05-01 14:51:15.472382',
                postit_url: 'http://postit_url',
                 }))
        });
    });
    it('should initialize controller', () => {
        expect(controller).toBeDefined();

        controller.$onInit();

        expect(file.publicUrl).toHaveBeenCalledWith(false);
        // Set busy state to true at start of listing
        expect(controller.busy).toBe(true)
        $scope.$digest()
        // Set busy state to false after listing resolves
        expect(controller.busy).toBe(false)
    });
    it('refresh should trigger confirm dialog', () => {
        controller.$onInit();
        $scope.$digest();
        expect(controller.confirmDialog).toBe(false)

        controller.confirmRefresh();
        expect(controller.confirmDialog).toBe(true)

        controller.cancelRefresh();
        expect(controller.confirmDialog).toBe(false)
    })
    it('refresh should call file method with correct arg', () => {
        controller.$onInit();
        $scope.$digest();

        controller.refresh();
        $scope.$digest();

        expect(file.publicUrl).toHaveBeenCalledWith(true);
        expect(controller.busy).toBe(false);
    })
    it('dismiss should call bound dismiss method', () => {
        controller.$onInit();
        $scope.$digest();

        controller.close();
        expect(dismiss).toHaveBeenCalled()

    })
    

});
