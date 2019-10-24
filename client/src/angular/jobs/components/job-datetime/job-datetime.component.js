import template from './job-datetime.template.html';
import JobDatetimeCtrl from './job-datetime.controller';
import './job-datetime.css';

const jobDateTimeComponent = {
    template: template,
    bindings: {
        datetime: '<',
    },
    controller: JobDatetimeCtrl,
};

export default jobDateTimeComponent;
