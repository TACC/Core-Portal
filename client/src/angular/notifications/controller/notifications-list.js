
export default class NotificationsListCtrl {

    constructor(Notifications) {
        'ngInject';
        this.service = Notifications;
    }

    delete(pk) {
        this.service.delete(pk).then(() => {
            this.service.list();
        });
    }
}
