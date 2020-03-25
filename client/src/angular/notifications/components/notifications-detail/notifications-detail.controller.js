export default class NotificationDetailCtrl {

    constructor($uibModal) {
        'ngInject';
        this.$uibModal = $uibModal;
    }

    modalLink() {
        return !this.note.action_link || this.modal;
    }

    openModal() {
        this.$uibModal.open({
            component: 'notificationsModal',
            resolve: {
                note: () => {
                    return this.note;
                }
            }
        });
    }
}
