
describe('JobStatusPanelComponent', function() {
    let $q, $rootScope, $componentController, ctrl,
        Jobs, Notifications, $uibModal;
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject(function(_$rootScope_, _$componentController_, _Jobs_,
            _Notifications_, _$uibModal_, _$q_) {
            $componentController = _$componentController_;
            Jobs = _Jobs_;
            $rootScope = _$rootScope_;
            Notifications =_Notifications_;
            $uibModal = _$uibModal_;
            $q = _$q_;
        });
    });
    beforeEach(() => {
        spyOn(Notifications, 'list').and.returnValue($q.when({}));
        spyOn(Jobs, 'list').and.returnValue($q.when([]));
        ctrl = $componentController('jobStatusPanel', {
            Jobs: Jobs,
            Notifications: Notifications,
            $uibModal: $uibModal,
        });

        ctrl.$onInit();
    });

    it('should have called Jobs.list on init', () => {
        expect(Jobs.list).toHaveBeenCalled();
    });

    it('should reload the jobs list when a notification is received', ()=>{
        spyOn(ctrl, 'refresh');
        spyOn(Notifications, 'showToast');
        Notifications.toasting = true;
        Notifications.processMessage({
            event_type: 'job',
            message: 'Hello World',
        });
        expect(ctrl.refresh).toHaveBeenCalled();
    });
});
