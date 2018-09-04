
export default class NotificationsListCtrl {

  constructor(Notifications) {
    'ngInject';
    if (window.NotificationsSingleton) {
      this.service = window.NotificationsSingleton;
      console.log("found singleton");
    } else {
      this.service = Notifications;
    }
    this.service.startToasts();
  }
}
