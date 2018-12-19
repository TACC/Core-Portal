export default class NotificationsBellCtrl {

    constructor(Notifications) {
        'ngInject';
        this.service = Notifications;
    }

    delete(pk) {
        this.service.delete(pk).then(() => {
            this.service.list();
        });
    }

    readAll(isOpen) {
        if (isOpen && this.service.notes.unread) {
            this.service.markRead('all').then(() => {
                this.service.notes.unread = 0;
            });
        } else if (!isOpen) {
            this.service.list();
        }
    }
}
