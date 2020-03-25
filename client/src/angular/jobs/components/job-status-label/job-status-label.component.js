import template from './job-status-label.template.html';
import JobStatusLabelCtrl from './job-status-label.controller';
import './job-status-label.css';

const jobStatusLabelComponent = {
    template: template,
    bindings: {
        item: '<',
    },
    controller: JobStatusLabelCtrl,
};

export default jobStatusLabelComponent;
