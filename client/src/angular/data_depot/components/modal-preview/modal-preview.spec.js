describe("ModalPreview", function() {
    var $uibModal,
        modalParams,
        modal,
        scope,
        ctrl,
        $q,
        file,
        $sce,
        $componentController;


    // Mock only the necessary portal components
    beforeEach(angular.mock.module('portal'));
    beforeEach( ()=> {
        angular.module('ui.bootstrap');
        // Setup our component test
        angular.mock.inject(function(_$rootScope_, _$q_, _$uibModal_, _$componentController_, _$sce_) {
            scope = _$rootScope_.$new();
            $sce = _$sce_;
            $q = _$q_;
            $uibModal = _$uibModal_;
            $componentController = _$componentController_;
            // $uibModal.open parameter
            file = {
                system: 'agave.system',
                path: '/filename.txt',
                name: 'filename.txt',
                preview: function () {}
            };
            ctrl = $componentController(
                'modalPreviewComponent',
                { $sce: $sce, $scope: scope },
                { resolve: {
                    file: file
                } }
            );
            modalParams = {
                component: 'modalPreviewComponent',
                size: 'lg',
                resolve: {
                    file: file,
                    listing: undefined,
                }
            };

            modal = $uibModal.open(modalParams);
            scope.$digest();

        });
    });

    it ('should load the modal', function() {
        expect(modal.opened).toBeTruthy();
    });

    it ('should have called the preview method on the file object', function() {
        spyOn(file, 'preview').and.returnValue($q.when({ href: 'www.test.com' }))
        ctrl.$onInit();
        scope.$digest();
        expect(file.preview).toHaveBeenCalled();
        // The controller uses $sce to ensure safety, have to compare this way
        expect($sce.getTrustedResourceUrl(ctrl.previewHref)).toEqual('www.test.com');
    });

  });
