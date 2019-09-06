class JobDetailCtrl {
    constructor(Jobs, $state, Notifications) {
        'ngInject';
        this.Jobs = Jobs;
        this.job = null;
        this.$state = $state;
        this.expandStatus = false;
        this.Notifications = Notifications;
    }

    $onInit() {
        this.Jobs.get(this.jobId).then((resp) => {
            if (resp.status === 'RUNNING' && resp._embedded.metadata) {
                for (let i = 0; i < resp._embedded.metadata.length; i++) {
                    if (resp._embedded.metadata[i].name === 'interactiveJobDetails') {
                        let meta = resp._embedded.metadata[i];
                        resp.interactive = true;
                        resp.connection_address = meta.value.action_link;
                        break;
                    }
                }
            }
            this.job = resp;
            this.jobFinished = this.Jobs.jobIsFinished(this.job);
        });
        this.Notifications.subscribe(
            (msg) => {
                this.job = this.Jobs.updateJobFromNotification(this.job, msg);
            }
        )
    }

    renderAgaveURI(uri) {
        return "<a href='/workbench/data-depot/agave/" + uri.substring("agave://".length) + "'>" + uri + "</a>";
    }

    renderInput(input) {
        if (typeof(input) === "string" && input.startsWith("agave://")) {
            return this.renderAgaveURI(input);
        }
        if (Array.isArray(input)) {
            let htmlString = "";
            input.forEach(
                (element) => {
                    htmlString += "<li>";
                    if (typeof(element) === "string" && element.startsWith("agave://")) {
                        htmlString += this.renderAgaveURI(element);
                    } else {
                        htmlString += element;
                    }
                    htmlString += "</li>";
                }
            )
            return "<ul>" + htmlString + "</ul>"
        }
        return input;
    }

    convertDate(date) {
        return new Date(date).toLocaleString();
    }

    statusToggle() {
        this.expandStatus = !this.expandStatus;
    }
}

export default JobDetailCtrl;
