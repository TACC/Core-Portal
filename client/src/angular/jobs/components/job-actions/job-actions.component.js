import JobActionsCtrl from './job-actions.controller';
import css from './job-actions.css';

const jobActionsComponent = {
    template: require("./job-actions.template.html"),
    bindings: {
        job: '<',
        dismiss: '&'
    },
    controller: JobActionsCtrl,
};
export default jobActionsComponent;
