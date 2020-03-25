import JobHistoryExpandableCtrl from './job-history-expandable.controller';
import expandableCss from '../css/job-expandable.css';
import css from './job-history-expandable.css';

const jobHistoryExpandableComponent = {
    template: require("./job-history-expandable.template.html"),
    bindings: {
        history: '<'
    },
    controller: JobHistoryExpandableCtrl,
};
export default jobHistoryExpandableComponent;
