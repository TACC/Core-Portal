import { Observable } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';

export default class Notifications {

  constructor($location, $mdToast, $http, $window) {
    'ngInject';
    this.$window = $window;
    this.$location = $location;
    this.$mdToast = $mdToast;
    this.$http = $http;
    this.$window = $window;
    let host = this.$location.host();
    let wsurl = 'wss://' + host + '/ws/notifications?subscribe-broadcast&subscribe-user';
    this.subject = new WebSocketSubject(wsurl);
    this.toasting = false;
    this.subject.subscribe(
      (data) => {
        this.list();
      },
      (error) => {
      },
      () => {
      }
    );
    this.list();
    // Make a single service instance accessible to the browser window
    this.$window.portalNotificationsService = this;
    // Signal that the service is ready
    this.serviceEvent = new Event('portal.notifications.service.ready');
    this.$window.dispatchEvent(this.serviceEvent);
    // Respond to requests for the service that it is ready
    this.$window.addEventListener('portal.notifications.service.request',
      (e) => {
        this.$window.dispatchEvent(this.serviceEvent);
      }
    );
 }

  startToasts() {
    this.toasting = true;
    this.subject.subscribe(
      (data) => {
        this.$mdToast.show({
            template: '<md-toast>\
                {{ vm.content }}\
            </md-toast>',
            controller: [function  () {
                this.content = data.message;
            }],
            position: 'top-right',
            controllerAs: 'vm',
            hideDelay: 3000
        });
      },
      (error) => {
        console.log("Notifications Websocket error", error);
      },
      () => {
        console.log("Notifications websocket ended");
      }
    );
  }

 list() {
    return this.$http.get('/api/notifications').then( (resp)=>{
      let data = resp.data;
      data.notifs.forEach((d)=>{
        d.datetime= new Date(d.datetime*1000);
      });
      this.notes = data;
      // Dispatch updated notifications data across the window
      var dataEvent = new CustomEvent('portal.notifications.service.data', { detail: data });
      this.$window.dispatchEvent(dataEvent);
      return data;
    }, (err)=>{
      return this.$q.reject(err);
    });
  }

  delete(pk) {
    return this.$http.delete('/api/notifications/delete/' + pk).then(
      (resp) => {
        return this.list();
      },
      (error) => {
        return this.$q.reject(error);
      }
    );
  }

  showToast() {

  }

}
