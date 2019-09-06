import angular from 'angular';
import Notifications from './notifications-service';

const mod = angular.module('portal.notifications.service', [ ]);

mod.service('Notifications', Notifications);

export default mod;
