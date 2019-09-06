import template from './notifications-detail.template.html';
import css from './notifications-detail.css';
import NotificationsDetailCtrl from './notifications-detail.controller';

const notificationsDetailComponent = {
    template: template,
    bindings: {
        "note": '<',
        "modal": '<',
        "delete": "&"
    },
    controller: NotificationsDetailCtrl,
};

export default notificationsDetailComponent;