import template from './job-status.template.html';
import JobStatusCtrl from './job-status.controller';
import './job-status.css';

const jobStatusComponent = {
    template: template,
    bindings: {
        job: '<',
        modal: '<'
    },
    controller: JobStatusCtrl,
};

export default jobStatusComponent;
