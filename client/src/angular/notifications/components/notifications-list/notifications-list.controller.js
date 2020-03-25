
export default class NotificationsListCtrl {

    constructor(Notifications) {
        'ngInject';
        this.service = Notifications;
         
        // predicate field provides a filtering function for notifications that
        // apper in this list
        this.notificationTypes = [
            {
                label: "All",
                predicate: (notif) => { return true; }
            },
            {
                label: "Interactive",
                predicate: (notif) => { 
                    return notif.event_type === "VNC" || notif.event_type === "WEB"
                }
            },
            {
                label: "Success",
                predicate: (notif) => { return notif.status === "SUCCESS" }
            },
            {
                label: "Running",
                predicate: (notif) => { return notif.extra && notif.extra.status === "RUNNING" }
            },
            {
                label: "Processing",
                predicate: (notif) => { 
                    return notif.extra &&
                            (notif.extra.status === "QUEUED" || 
                            notif.extra.status === "SUBMITTING" ||
                            notif.extra.status === "STAGED" ||
                            notif.extra.status === "PROCESSING_INPUTS");
                }
            },
            {
                label: "Pending",
                predicate: (notif) => { return notif.extra && notif.extra.status === "PENDING" }
            }
        ];
        this.notificationType = this.notificationTypes[0];
    }

    notes() {
        // Return filtered notifications list based on filtering predicate
        return this.service.notes.notifs.filter(this.notificationType.predicate);
    }

    delete(pk) {
        this.service.delete(pk).then(() => {
            this.service.list();
        });
    }
}
