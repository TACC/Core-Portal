import previewModalTemplate from './../modals/data-browser-service-preview.html';

describe("ModalPreview", function() {
    var $q;
    var $uibModal;
    var $httpBackend;
    var modalParams;
    var scope;

    // Mock only the necessary portal components
    beforeEach(angular.mock.module("portal"));
    beforeEach(angular.mock.module("ui.bootstrap")); 
    beforeEach( ()=> {
        // Setup our component test
        angular.mock.inject(function(_$rootScope_, _$q_, _$uibModal_, _$httpBackend_) {
            scope = _$rootScope_.$new(); 
            $q = _$q_;
            $uibModal = _$uibModal_;
            $httpBackend = _$httpBackend_;

            // $uibModal.open parameter
            let file = {
                system: "/system",
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
      });
    });
  });
  