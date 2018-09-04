export default class NotificationsBellCtrl {

    constructor(Notifications) {
      'ngInject';
      if (window.NotificationsSingleton) {
        this.service = window.NotificationsSingleton;
        console.log("Bell found singleton", this.service);
      } else {
        this.service = Notifications;
      }
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

    list() {
      console.log("list notifications plz");
    }
  }
  