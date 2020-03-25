describe("ModalRename", function() {
    var ctrl,
        $q,
        file,
        $componentController;


    // Mock only the necessary portal components
    beforeEach(angular.mock.module('portal'));
    beforeEach( ()=> {
        angular.mock.inject(function(_$componentController_) {
            $componentController = _$componentController_;
            file = {
                system: 'agave.system',
                path: '/filename.txt',
                name: 'filename.txt',
                preview: function () {}
            };
            ctrl = $componentController(
                'modalRenameComponent',
                {},
                {
                    resolve: {
                        file: file
                    },
                    close: ()=>{},
                    dismiss: ()=>{}
                }
            );
        });
    });


    it ('should init with the file name as the current value', function() {
        ctrl.$onInit();
        expect(ctrl.targetName).toEqual(file.name);
    });

    it ('should close the modal with the new name', function() {
        spyOn(ctrl, 'close');
        ctrl.$onInit();
        ctrl.targetName = 'test.txt';
        ctrl.doRenameFile();
        expect(ctrl.close).toHaveBeenCalledWith({$value: {
            file: file, renameTo: 'test.txt'
        }});
    });

    it('should cancel and close the modal', ()=> {
        spyOn(ctrl, 'dismiss');
        ctrl.$onInit();
        ctrl.cancel();
        expect(ctrl.dismiss).toHaveBeenCalled();
    })

  });
