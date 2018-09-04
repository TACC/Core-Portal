import angular from "angular";
import NotificationsListCtrl from './controller/notifications-list';
import NotificationDetailCtrl from './controller/notification-detail';
import NotificationsBellCtrl from './controller/notifications-bell';
import Notifications from './service/notifications-service';

import './css/animate.css';
import './css/notifications-bell.css';
import notificationDetailTemplate from './template/notification-detail.html';
import notificationListTemplate from './template/notifications-list.html';
import notificationsBellTemplate from './template/notifications-bell.html';

let mod = angular.module('portal.notifications', ['ngMaterial']);

mod.service('Notifications', Notifications);

mod.component('notificationsList', {
  template: notificationListTemplate,
  controller: NotificationsListCtrl,
  controllerAs: "vm"
}),

mod.component('notificationDetail', {
  template: notificationDetailTemplate,
  controller: NotificationDetailCtrl,
  controllerAs: "vm",
  bindings: {
    "note": '<',
    "delete": "&"
  }
});

mod.component('notificationsBell', {
  template: notificationsBellTemplate,
  controller: NotificationsBellCtrl,
  controllerAs: "vm"
});

export default mod;
