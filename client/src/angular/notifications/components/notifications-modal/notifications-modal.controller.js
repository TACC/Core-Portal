export default class NotificationsModalCtrl {
    /**
     * Initialize Controller.
     */
    constructor() {
        'ngInject';
    }

    /**
     * On Init
     */
    $onInit() {
        this.note = this.resolve.note;
    }

    localTime() {
        return this.note.datetime.toString();
    }
}
