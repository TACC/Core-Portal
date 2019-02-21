import fileListing from '../../fixtures/file-listing.json';

describe("ModalUpload", function() {
    var ctrl,
        $q,
        Modernizr,
        FileListing,
        scope,
        fl,
        $componentController;


    // Mock only the necessary portal components
    beforeEach(angular.mock.module('portal'));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject(function(_$componentController_, _$q_, _$rootScope_, _Modernizr_, _FileListing_) {
            $componentController = _$componentController_;
            $q = _$q_;
            scope = _$rootScope_.$new();
            Modernizr = _Modernizr_;
            FileListing = _FileListing_;
            fl = FileListing.init(fileListing);
            spyOn(fl, 'fetch').and.returnValue($q.when({}));
            ctrl = $componentController(
                'modalUploadComponent',
                {
                    $q: $q,
                    Modernizr:Modernizr
                },
                {
                    close: ()=>{},
                    dismiss: ()=>{},
                    resolve: {
                        currentState: {
                            listing: fl
                        }
                    }
                }
            );
        });
    });


    it ('should init with no files', function() {
        ctrl.$onInit();
        expect(ctrl.uploads.length).toEqual(0);
    });

    it('should cancel and close the modal', ()=> {
        spyOn(ctrl, 'dismiss');
        ctrl.$onInit();
        ctrl.cancel();
        expect(ctrl.dismiss).toHaveBeenCalled();
    });

    describe('Uploading Files', ()=>{
        let f1 = new Blob([""], {type: 'text/html'});
        let f2 = new Blob([""], {type: 'text/html'});
        let f3 = new Blob([""], {type: 'text/html'});
        f1.name = 'test1';
        f2.name = 'test2';
        f3.name = 'test3';

        it('should allow retry on multiple files', ()=> {
            spyOn(fl, 'upload').and.returnValue($q.reject({}));
            ctrl.$onInit();
            ctrl.uploads = [{file:f1}, {file:f2}, {file:f3}];
            ctrl.upload();
            scope.$digest();
            expect(ctrl.retry).toBe(true);
            expect(ctrl.uploads[0].state).toEqual('error');
            expect(ctrl.uploads[1].state).toEqual('error');
            expect(ctrl.uploads[2].state).toEqual('error');
        })

        it('should upload and close the modal', ()=> {
            spyOn(fl, 'upload').and.returnValue($q.when({}));
            spyOn(ctrl, 'close');
            ctrl.$onInit();
            ctrl.uploads = [{file:f1}, {file:f2}, {file:f3}];
            ctrl.upload();
            scope.$digest();
            expect(ctrl.retry).toBe(false);
            expect(ctrl.close).toHaveBeenCalled();
        });
    });

 });
