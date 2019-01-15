import previewModalTemplate from './../modals/data-browser-service-preview.html';

describe("ModalPreview", function() {
    var $uibModal;
    var modalParams;
    var modal;
    var scope;

    // Mock only the necessary portal components
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.module('ui.bootstrap');
        // Setup our component test
        angular.mock.inject(function(_$rootScope_, _$q_, _$uibModal_) {
            scope = _$rootScope_.$new(); 
            $uibModal = _$uibModal_;

            // $uibModal.open parameter
            let file = {
                system: "agave.system",
                path: "/filename.txt"
            };
            modalParams = {
                template: previewModalTemplate,
                bindToController: scope,
                controller: 'ModalPreview',
                size: 'lg',
                resolve: {
                  file: function() { return file; },
                  listing: function() { return undefined; },
                } 
            }

            modal = $uibModal.open(modalParams);
            scope.$digest();
        });
    });

    it ('should load the modal', function() {
        expect(modal.opened).toBeTruthy();
    });
  });
  