import angular from "angular";
import NotificationsListCtrl from './notifications-list';
import NotificationDetailCtrl from './notification-detail';
import Notifications from './notifications-service';

import notificationDetailTemplate from './notification-detail.html';
import notificationListTemplate from './notifications-list.html';

let mod = angular.module('portal.notifications', []);

mod.service('Notifications', Notifications);

mod.component('notificationsList', {
  template: notificationListTemplate,
  controller: NotificationsListCtrl,
  controllerAs: "vm"
}),

mod.component('notificationDetail', {
  template: notificationDetailTemplate,
  controller: NotificationDetailCtrl,
  conttrollerAs: "vm",
  bindings: {
    "note": '<',
    "delete": "&"
  }
});

export default mod;
