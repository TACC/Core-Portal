import moment from 'moment';

class JobHistoryExpandableCtrl {
    constructor(Jobs) {
        'ngInject';
        this.Jobs = Jobs;
        this.expandStatus = false;
        this.jobHistory = [ ];
    }

    statusToggle() {
        this.expandStatus = !this.expandStatus;
    }

    dateString(item) {
        let date = moment(item.created).toDate();
        return date.toLocaleString();
    }
}

export default JobHistoryExpandableCtrl;
