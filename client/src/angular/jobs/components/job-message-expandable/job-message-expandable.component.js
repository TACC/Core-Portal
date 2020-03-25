import JobMessageExpandableCtrl from './job-message-expandable.controller';
import expandableCss from '../css/job-expandable.css';

const jobMessageExpandableComponent = {
    template: require("./job-message-expandable.template.html"),
    bindings: {
        job: '<'
    },
    controller: JobMessageExpandableCtrl,
};
export default jobMessageExpandableComponent;
