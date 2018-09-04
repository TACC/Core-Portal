
export default class NotificationsListCtrl {

  constructor(Notifications) {
    'ngInject';
    this.service = Notifications;
    this.service.startToasts();
  }
}
