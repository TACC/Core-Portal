import JobsListCtrl from './jobs-list.controller';
import css from './jobs-list.css';

const jobsListComponent = {
    template: require("./jobs-list.template.html"),
    bindings: {
        modal: '<'
    },
    controller: JobsListCtrl,
};
export default jobsListComponent;
