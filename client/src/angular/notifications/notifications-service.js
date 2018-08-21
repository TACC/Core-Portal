
export default class Notifications {

  constructor($websocket, $location, $mdToast, $http, $q) {
    'ngInject';
    this.$websocket = $websocket;
    this.$location = $location;
    this.$mdToast = $mdToast;
    this.$http = $http;
    this.$q = $q;
  }

  subscribe() {
    let host = this.$location.host();
    let wsurl = 'wss://' + host + '/ws/notifications?subscribe-broadcast&subscribe-user';
    this.ws = this.$websocket(wsurl);
    this.ws.onMessage((message)=> {
      console.log(message);
      let data = JSON.parse(message.data);
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
    });
  }

  list() {
    return this.$http.get('/api/notifications').then( (resp)=>{
      let data = resp.data;
      data.notifs.forEach((d)=>{
        d.datetime= new Date(d.datetime*1000);
      });
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
