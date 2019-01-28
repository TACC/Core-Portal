import template from './job-details-modal.template.html';

class JobDetailsModalCtrl {
    constructor ($http, Jobs) {
        'ngInject';
        this.Jobs = Jobs;
    }

    $onInit () {
        this.job = this.resolve.job;
    }

    close () {
        this.dismiss('cancel');
    }

    deleteJob () {
        this.Jobs.delete(this.job).then( ()=> {
            this.dismiss();
        }, (err)=>{

        });

    }

    cancelJob () {
        this.Jobs.cancel(this.job).then( ()=> {
            this.dismiss();
        });
    }

}


const jobDetailsModal = {
    template: template,
    controller: JobDetailsModalCtrl,
    bindings: {
        close: '&',
        dismiss: '&',
        resolve: '<'
    }
};

export default jobDetailsModal;
