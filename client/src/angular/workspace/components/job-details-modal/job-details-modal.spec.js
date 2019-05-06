describe('JobDetailsModal', function() {
    var $q, $componentController, ctrl, $rootScope,
        Jobs;
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject(function(_$componentController_,  _Jobs_, _$q_, _$rootScope_) {
            $componentController = _$componentController_;
            Jobs = _Jobs_;
            $q = _$q_;
            $rootScope = _$rootScope_;
        });
    });
    beforeEach(() => {
        spyOn(Jobs, 'delete').and.returnValue($q.when({
            data: {
                response: { status: 'ok' }
            }
        }));
        spyOn(Jobs, 'cancel').and.returnValue($q.when({
            data: {
                response: { status: 'ok' }
            }
        }));
        ctrl = $componentController('jobDetailsModal', {
            Jobs: Jobs,
        }, {
            resolve: {
                job: {
                    id: 1,
                    name: 'test'
                }
            }
        });
        ctrl.dismiss = ()=>{};
        ctrl.$onInit();
    });

    it('Should have a job attached to the controller', () => {
        expect(ctrl.job).toBeDefined();
    });

    it('Should call the Jobs.delete method', ()=> {
        spyOn(ctrl, 'dismiss');
        ctrl.deleteJob();
        expect(Jobs.delete).toHaveBeenCalled();
        $rootScope.$digest();
        expect(ctrl.dismiss).toHaveBeenCalled();
    });

    it('Should cancel a job and close the modal', ()=> {
        spyOn(ctrl, 'dismiss');
        ctrl.cancelJob();
        expect(Jobs.cancel).toHaveBeenCalled();
        $rootScope.$digest();
        expect(ctrl.dismiss).toHaveBeenCalled();
    });

});
