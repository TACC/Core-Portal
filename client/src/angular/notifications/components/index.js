import angular from 'angular';
import notificationsBellComponent from 
    './notifications-bell/notifications-bell.component';
import notificationsDetailComponent from
    './notifications-detail/notifications-detail.component';
import notificationsListComponent from
    './notifications-list/notifications-list.component';
import notificationsModalComponent from 
    './notifications-modal/notifications-modal.component';

const mod = angular.module(
    'portal.notifications.components', 
    [
        'portal.notifications.service',
        'ui.bootstrap'
    ]
);

mod.component('notificationsBell', notificationsBellComponent);
mod.component('notificationsDetail', notificationsDetailComponent);
mod.component('notificationsList', notificationsListComponent);
mod.component('notificationsModal', notificationsModalComponent);

export default mod;
