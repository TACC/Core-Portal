export default class NewProjectController {
    constructor(ProjectService){
        'ngInject';
        this.ProjectService = ProjectService;
        this.form = {};
        this.ui = {};
    }
    ok(){
        this.ui.loading = true;
        this.ProjectService.create(this.form)
        .then((resp)=>{
            this.ui.error = false;
            this.ui.status = resp.status;
            this.ui.message = "Project created successfully.";
            this.project = resp.response;
            return this.project;
        }, (err)=>{
            this.ui.error = true;
            this.ui.status = err.status;
            this.ui.message = err.message;
        })
        .finally(()=>{
            this.ui.loading = false;
            if ( !this.ui.error ){
                this.close({
                    $value: {
                        project: this.project
                    }
                });
            }
        });
    }
    cancel() {
        this.dismiss({$value:'cancel'});
    }
    $onInit() {
        this.form = {
            title: ''
        };
    }
}
