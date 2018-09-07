
export default class NotificationsListCtrl {

  constructor(Notifications) {
    'ngInject';
    this.service = Notifications;
    this.service.startToasts();
  }

  delete(note) {
    this.service.delete(note.pk).then(
      (data) => {
        this.service.list();
      },
      (error) => {
      }
    );
  }
}
