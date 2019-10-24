
class JobDatetimeCtrl {
    constructor() {
        'ngInject';
    }

    $onInit() {
        this.date = new Date(this.datetime);
    }

    getTime() {
        return this.date.toLocaleTimeString();
    }

    getDate() {
        return this.date.toLocaleDateString();
    }
}

export default JobDatetimeCtrl;
