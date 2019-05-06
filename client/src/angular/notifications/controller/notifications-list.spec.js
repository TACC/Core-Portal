
describe('NotificationsListCtrl', function() {
    var Notifications, controller, $q;
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject(function($rootScope, $componentController, _Notifications_) {
            Notifications = _Notifications_;
            controller = $componentController('notificationsList', { Notifications: Notifications });
        });
    });

    it('Should have a delete method', function() {
        expect(controller.delete).toBeDefined();
    });

    it('should handle a delete', angular.mock.inject(($q) => {
        var fakePromise = $q.when(),
            note = { pk: 1 };
        spyOn(Notifications, 'delete').and.returnValue(fakePromise);
        controller.delete(note.pk);
        expect(Notifications.delete).toHaveBeenCalledWith(1);
    }));

    it('should have a service attached to it', () => {
        expect(controller.service).toBeDefined();
    });
});
