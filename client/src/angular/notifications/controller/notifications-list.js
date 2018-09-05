
export default class NotificationsListCtrl {

  constructor(Notifications, $scope) {
    'ngInject';
    if (window.NotificationsSingleton) {
      this.service = window.NotificationsSingleton;
    } else {
      this.service = Notifications;
    }
    this.$scope = $scope;
    this.service.startToasts();
  }

  delete(note) {
    this.service.delete(note.pk).then(
      (data) => {
        this.$scope.$apply();
      },
      (error) => {
      }
    );
  }
}
