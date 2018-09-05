export default class NotificationsBellCtrl {

    constructor($scope, Notifications) {
      'ngInject';
      if (window.NotificationsSingleton) {
        this.service = window.NotificationsSingleton;
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
      this.$scope = $scope;
      this.$scope.deleteAll = () => {
        this.service.delete("all");
      }
    }

    list() {
    }

  }
  