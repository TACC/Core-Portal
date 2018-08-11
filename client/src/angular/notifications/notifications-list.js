
export default class NotificationsListCtrl {

  constructor(Notifications) {
    'ngInject';
    this.Notifications = Notifications;
    this.list();
  }

  list() {
    console.log("listing notifications");
    this.Notifications.list().then( (resp)=>{
      this.notes = resp.notifs;
      this.total = resp.total;
    });
  }
}
