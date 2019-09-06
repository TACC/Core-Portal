import template from './notifications-modal.template.html';
import css from './notifications-modal.css';
import NotificationsModalCtrl from './notifications-modal.controller';

const notificationsModalComponent = {
    template: template,
    controller: NotificationsModalCtrl,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
};

export default notificationsModalComponent;
