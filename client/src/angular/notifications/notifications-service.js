
export default class Notifications {

  constructor($websocket, $location, $mdToast, $http, $q) {
    'ngInject';
    this.$websocket = $websocket;
    this.$location = $location;
    this.$mdToast = $mdToast;
    this.$http = $http;
    this.$q = $q;
    var host = $location.host();
    var wsurl = 'wss://' + host + '/ws/notifications?subscribe-broadcast&subscribe-user';
    this.ws = $websocket(wsurl);
    this.ws.onMessage(function (message) {
      var data = JSON.parse(message.data);
      this.$mdToast.show({
          template: '<md-toast>\
              {{ vm.content }}\
          </md-toast>',
          controller: [function  () {
              this.content = data.message;
          }],
          controllerAs: 'vm',
          hideDelay: 3000
      });
    });
  }

  list() {
    return this.$http.get('/api/notifications').then( (resp)=>{
      return resp.data;
    }, (err)=>{
      return this.$q.reject(err);
    });
  }

  delete() {

  }

  showToast() {

  }

}
