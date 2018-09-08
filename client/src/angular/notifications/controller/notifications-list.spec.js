
describe("NotificationsListCtrl", function() {
  var Notifications, controller, $q;
  beforeEach(angular.mock.module("portal"));
  beforeEach( ()=> {
    angular.module('django.context', []).constant('Django', {user: 'test_user'});
    angular.mock.inject(function($rootScope, $componentController, _Notifications_) {
      Notifications = _Notifications_;
      controller = $componentController('notificationsList', {Notifications: Notifications});
    });
  });

  it("Should have a delete method", function() {
    expect(controller.delete).toBeDefined();
  });

  it("should handle a delete", angular.mock.inject( ($q) => {
    var fakePromise = $q.when();
    spyOn(Notifications, 'delete').andReturn(fakePromise);
    controller.delete({pk:1});
    expect(Notifications.delete).toHaveBeenCalledWith(1);

  }));



});
