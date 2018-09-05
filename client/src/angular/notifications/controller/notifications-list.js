
export default class NotificationsListCtrl {

  constructor(Notifications, $scope, $window) {
    'ngInject';
    this.service = Notifications;
    this.$scope = $scope;
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
