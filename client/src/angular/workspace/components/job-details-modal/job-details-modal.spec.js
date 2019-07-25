describe('JobDetailsModal', function() {
    var $q, $componentController, ctrl, $rootScope, Jobs, $uibModal, jobTemplate, modalParams, modal;
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject(function(_$componentController_, _Jobs_, _$q_, _$rootScope_, _$uibModal_) {
            $componentController = _$componentController_;
            Jobs = _Jobs_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            $uibModal = _$uibModal_;
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
        jobTemplate = {
            id: '1345-abcd',
            appId: 'test_appId',
            created: 'test_created',
            ended: 'test_ended',
            status: 'test_status',
        };
        ctrl = $componentController('jobDetailsModal', {
            Jobs: Jobs,
        }, {
            resolve: {
                job: jobTemplate
            }
        });
        ctrl.dismiss = () => { };
        ctrl.$onInit();
        modalParams = {
            component: 'jobDetailsModal',
            resolve: {
                job: jobTemplate,
            },
        };

        modal = $uibModal.open(modalParams);
        $rootScope.$digest();
    });

    it('Should have a job attached to the controller', () => {
        expect(ctrl.job).toBeDefined();
    });

    it('Should call the Jobs.delete method', () => {
        spyOn(ctrl, 'dismiss');
        ctrl.deleteJob();
        expect(Jobs.delete).toHaveBeenCalled();
        $rootScope.$digest();
        expect(ctrl.dismiss).toHaveBeenCalled();
    });

    it('Should cancel a job and close the modal', () => {
        spyOn(ctrl, 'dismiss');
        ctrl.cancelJob();
        expect(Jobs.cancel).toHaveBeenCalled();
        $rootScope.$digest();
        expect(ctrl.dismiss).toHaveBeenCalled();
    });

    it('should load the modal', () => {
        expect(modal.opened).toBeTruthy();
    });

    it('Should render job details in template', () => {

        let elements = angular.element(document).find('job-details-modal').find('dd');
        $rootScope.$digest();
        let descriptions = [];
        angular.forEach(elements, (dd) => {
            descriptions.push(dd);
        });
        descriptions = descriptions.map((dd) => dd = dd.innerText);
        Object.values(jobTemplate).forEach((v) => {
            expect(descriptions).toContain(v);
        });
    });
});
