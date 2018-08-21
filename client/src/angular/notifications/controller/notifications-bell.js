export default class NotificationsBellCtrl {

    constructor(Notifications) {
      'ngInject';
      this.service = Notifications;
      this.bouncing = false;
      this.subscription = this.service.subject.subscribe(
        (data) => { 
          // play animation here, somehow?
        },
        (error) => {
        },
        () => {
        }
      );
    }
  }
  