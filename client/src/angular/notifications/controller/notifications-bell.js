export default class NotificationsBellCtrl {

    constructor($scope, $window) {
      'ngInject';
      this.notes = { total: 0, notifs: [ ] };

      this.$scope = $scope;
      this.$scope.deleteAll = () => {
        this.service.delete("all");
      }
      this.$window = $window;

      // Listen for the Notifications service to be ready
      this.$window.addEventListener('portal.notifications.service.ready',
        (e) => {
          if (!this.service) {
            this.service = this.$window.portalNotificationsService;
            this.subscription = this.service.subject.subscribe(
              (data) => { 
              },
              (error) => {
              },
              () => {
              }
            );
          }
        }
      );

      // Request the notifications service
      this.$window.dispatchEvent(new Event('portal.notifications.service.request'));

      this.$window.addEventListener('portal.notifications.service.data',
        (e) => {
          this.notes = e.detail;
          this.$scope.$apply();
        }
      );
    }

    list() {
    }

  }
  