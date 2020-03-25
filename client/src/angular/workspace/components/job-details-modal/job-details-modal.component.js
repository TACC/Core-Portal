import template from './job-details-modal.template.html';
import './job-details-modal.css';
import { trimHashVal } from '@uirouter/core';
import JobDetailsModalCtrl from './job-details-modal.controller';

const jobDetailsModal = {
    template: template,
    controller: JobDetailsModalCtrl,
    bindings: {
        close: '&',
        dismiss: '&',
        resolve: '<',
    },
};

export default jobDetailsModal;
