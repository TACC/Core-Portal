
function Notifications($websocket, $location, $mdToast) {
  'ngInject';
  var protocol = $location.protocol();
  var host = $location.host();
  var port = $location.port();
  var wsurl = 'wss://' + host + '/ws/notifications?subscribe-broadcast&subscribe-user';
  var ws = $websocket(wsurl);
  ws.onMessage(function (message) {
    var data = JSON.parse(message.data);
    $mdToast.show({
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

export default Notifications;
