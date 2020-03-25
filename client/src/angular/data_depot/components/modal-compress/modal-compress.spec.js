describe("ModalCompress", function() {
    let ctrl;
    let scope;
    let element;
    let $compile;


    // Mock only the necessary portal components
    beforeEach(angular.mock.module('portal'));
    beforeEach( ()=> {
        angular.mock.inject(function(_$componentController_,
            _$rootScope_, _$q_, _$compile_) {
            $compile = _$compile_;
            scope = _$rootScope_.$new();

            scope.mockResolve = { 
                targzSupport: false
            }
            
            scope.$apply();

            let componentHtml = `
                <modal-compress-component 
                    resolve="mockResolve">
                </modal-compress-component>
            `;

            element = angular.element(componentHtml);
            element = $compile(element)(scope);

            scope.$digest();
            ctrl = element.controller('modal-compress-component');
            ctrl.close = () => { };
            ctrl.dismiss = () => { };
        });
    });

    it ('should init with a controller', function() {
        expect(ctrl).toBeTruthy();
    });

    it ('should selectively display .tar.gz options', () => {
        expect(element.text()).not.toContain("Compression type");

        scope.mockResolve = {
            targzSupport: true
        }
        scope.$apply()
        let componentHtml = `
            <modal-compress-component 
                resolve="mockResolve">
            </modal-compress-component>
        `;
        let targzElement = angular.element(componentHtml);
        targzElement = $compile(targzElement)(scope);
        scope.$digest();

        expect(targzElement.text()).toContain("Compression type");
    });

    it ('should append an extension to a destination if necessary', function() {
        expect(ctrl.appendExtension("file")).toEqual("file.zip");
        expect(ctrl.appendExtension("file.ZIP")).toEqual("file.ZIP");

        ctrl.compressionType = "tgz";
        expect(ctrl.appendExtension("file")).toEqual("file.tar.gz");
        expect(ctrl.appendExtension("file.tar.GZ")).toEqual("file.tar.GZ");
    });

    it ('should close the modal with the zipfile name', function() {
        spyOn(ctrl, 'close');
        ctrl.$onInit();
        ctrl.targetName = 'test.zip';
        ctrl.doCompressFile();
        expect(ctrl.close).toHaveBeenCalledWith({$value: {
            destination: 'test.zip',
            compressionType: 'zip'
        }});
    });

    it('should cancel and close the modal', ()=> {
        spyOn(ctrl, 'dismiss');
        ctrl.$onInit();
        ctrl.cancel();
        expect(ctrl.dismiss).toHaveBeenCalled();
    })

  });
