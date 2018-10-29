export default class NotificationsBellCtrl {

    constructor(Notifications) {
      'ngInject';
      this.service = Notifications;
    }

    deleteAll() {
      this.service.delete("all");
    }

    list() {
    }

  }
  