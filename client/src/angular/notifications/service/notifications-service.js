import { WebSocketSubject } from 'rxjs/webSocket';
import $ from 'jquery';
import modalInteractiveDetailsTemplate from '../template/interactive-details-modal.html';

export default class Notifications {

    constructor($location, $mdToast, $http, $uibModal, $rootScope) {
        'ngInject';
        this.$location = $location;
        this.$mdToast = $mdToast;
        this.$http = $http;
        this.$rootScope = $rootScope;
        let host = this.$location.host(),
            wsurl = 'wss://' + host + '/ws/notifications?subscribe-broadcast&subscribe-user';
        this.subject = new WebSocketSubject(wsurl);
        this.toasting = false;
        this.notes = {
            unread: 0,
            notifs: []
        };
        this.subject.subscribe(
            (data) => {
                this.processMessage(data);
            },
            (error) => {
                console.log('Notifications Websocket error', error);
            },
            () => {
                console.log('Notifications websocket ended');
            }
        );

        this.processors = {
            interactive: {
                process: function notifyProcessor(msg) {
                    $uibModal.open({
                        template: modalInteractiveDetailsTemplate,
                        controller: function($uibModalInstance, msg) {
                            'ngInject';
                            this.msg = msg;
                            this.dismiss = function() {
                                $uibModalInstance.dismiss('cancel');
                            };
                        },
                        controllerAs: 'vm',
                        resolve: {
                            msg: msg,
                        },
                    });
                }
            }
        };
        this.list();
    }

    list() {
        return this.$http.get('/api/notifications/').then((resp) => {
            let data = resp.data;
            data.notifs.forEach((d) => {
                d.datetime = new Date(d.datetime * 1000);
            });
            this.notes = data;
            return data;
        }, (err) => {
            return this.$q.reject(err);
        });
    }

    delete(pk) {
        return this.$http.delete('/api/notifications/delete/' + pk);
    }

    markRead(id) {
        return this.$http.post('/api/notifications/', {
            id: id,
            read: true
        });
    }

    /*
        callback MUST be a fat-arrow function (msg)=>{ this.doSomething(msg) }
    */
    subscribe (callback) {
        this.$rootScope.$on('notification', (ev, data) => {
            callback(data);
        });
    }

    processMessage(msg) {
        this.notes.unread++;
        this.notes.notifs.unshift(msg);
        this.$rootScope.$broadcast('notification', msg);
        // suppress first (old) message
        if (!this.toasting) {
            this.toasting = true;
            return;
        }

        let eventType = msg.event_type.toLowerCase();
        if (eventType === 'vnc' || eventType === 'web') {
            eventType = 'interactive';
        }

        if (typeof this.processors[eventType] !== 'undefined' &&
            typeof this.processors[eventType].process !== 'undefined' &&
            typeof this.processors[eventType].process === 'function') {
            this.processors[eventType].process(msg);
        } else {
            this.showToast(msg);
        }
    }

    showToast(data) {
        const toastLevel = data.status.toLowerCase();

        // Convert operation name to title case.
        // Operation name might be something like 'copy_file', 'job_submission' or 'publish'
        const toastTitle = data.operation.replace(/_/g, ' ').replace(/\w\S*/,
            s => {
                return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
            });
        const toastViewLink = data.action_link;
        let toast = this.$mdToast.simple({
            template:
                '<md-toast>' +
                    '<div class="md-toast-content">' +
                        '<div class="custom-toast">' +
                            '<h5>' + toastTitle + '</h5>' +
                            '<p>' + data.message + '</p>' +
                        '</div>' +
                        '<md-button ng-if="vm.content.action_link" class="md-action" ng-click="toast.resolve()">' +
                            'View' +
                        '</md-button>' +
                    '</div>' +
                '</md-toast>',
            hideDelay: 6000,
            parent: $('#toast-container'),
            toastClass: toastLevel,
            controller: [function() {
                this.content = data;
            }],
            controllerAs: 'vm',
        });

        this.$mdToast.show(toast).then(function(response) {
            if (response == 'ok') {
                window.location.href = toastViewLink;
            }
        });
    }
}
