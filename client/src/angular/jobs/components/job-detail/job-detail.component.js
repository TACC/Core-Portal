import JobDetailCtrl from './job-detail.controller';
import css from './job-detail.css';

const jobDetailComponent = {
    template: require("./job-detail.template.html"),
    bindings: {
        jobId: '<'
    },
    controller: JobDetailCtrl,
};
export default jobDetailComponent;
