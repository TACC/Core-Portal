
export default class NotificationsListCtrl {

  constructor(Notifications) {
    'ngInject';
    this.NotificationsService = Notifications;
    this.list();
  }

  list() {
    console.log("listing notifications");
    this.NotificationsService.list().then( (resp)=>{
      this.notes = resp.notifs;
      console.log(this.notes)
      this.total = resp.total;
    });
  }
}
