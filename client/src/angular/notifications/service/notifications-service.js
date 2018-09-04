import { Observable } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';

export default class Notifications {

  constructor($location, $mdToast, $http, $q) {
    'ngInject';
    this.$location = $location;
    this.$mdToast = $mdToast;
    this.$http = $http;
    this.$q = $q;
    let host = this.$location.host();
    let wsurl = 'wss://' + host + '/ws/notifications?subscribe-broadcast&subscribe-user';
    this.subject = new WebSocketSubject(wsurl);
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
  }

  startToasts() {
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
      return data;
    }, (err)=>{
      return this.$q.reject(err);
    });
  }

  delete() {

  }

  showToast() {

  }

}
