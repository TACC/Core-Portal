
describe('NotificationsBellCtrl', function() {
    var Notifications, controller, $q;
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function($rootScope, $componentController, _Notifications_) {
            Notifications = _Notifications_;
            controller = $componentController('notificationsBell', { Notifications: Notifications });
        });
    });

    it('Should have a delete method', function() {
        expect(controller.delete).toBeDefined();
    });

    it('should handle a delete', angular.mock.inject(($q) => {
        var fakePromise = $q.when();
        spyOn(Notifications, 'delete').and.returnValue(fakePromise);
        controller.delete('all');
        expect(Notifications.delete).toHaveBeenCalledWith('all');
    }));

    it('Should have a readAll method', function() {
        expect(controller.readAll).toBeDefined();
    });

    it('should handle a readAll request', angular.mock.inject(($q) => {
        spyOn(Notifications, 'markRead').and.callFake(() => {
            return {
                then: function(callback) {
                    return callback({ status: 200 });
                },
            };
        });

        Notifications.notes = { unread: 1 };
        controller.readAll(true);
        expect(Notifications.markRead).toHaveBeenCalledWith('all');
        expect(Notifications.notes.unread).toEqual(0);
    }));
});
