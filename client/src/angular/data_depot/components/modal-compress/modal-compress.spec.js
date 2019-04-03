describe("ModalCompress", function() {
    var ctrl,
        $q,
        file,
        $componentController;


    // Mock only the necessary portal components
    beforeEach(angular.mock.module('portal'));
    beforeEach( ()=> {
        angular.mock.inject(function(_$componentController_) {
            $componentController = _$componentController_;
            ctrl = $componentController(
                'modalCompressComponent',
                {},
                {
                    close: ()=>{},
                    dismiss: ()=>{}
                }
            );
        });
    });

    it ('should init with a controller', function() {
        expect(ctrl).toBeTruthy();
    });

    it ('should append .zip to a destination if necessary', function() {
        expect(ctrl.appendZipExtension("file")).toEqual("file.zip");
        expect(ctrl.appendZipExtension("file.ZIP")).toEqual("file.ZIP");
    });

    it ('should close the modal with the zipfile name', function() {
        spyOn(ctrl, 'close');
        ctrl.$onInit();
        ctrl.targetName = 'test.zip';
        ctrl.doCompressFile();
        expect(ctrl.close).toHaveBeenCalledWith({$value: {
            destination: 'test.zip'
        }});
    });

    it('should cancel and close the modal', ()=> {
        spyOn(ctrl, 'dismiss');
        ctrl.$onInit();
        ctrl.cancel();
        expect(ctrl.dismiss).toHaveBeenCalled();
    })

  });
