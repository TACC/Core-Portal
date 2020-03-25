import _ from 'underscore';
/**
 * Controller for member search.
 */
export default class EditProjectMetadataCtrl {
    /**
     * Initialize Controller.
     */
    constructor(ProjectService) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.meta = { };
        this.roles = { };
        this.resolve = { };

        // Controller variables
        this.fieldSaving = { 
            "title": false,
            "description": false
        }
    }

    /**
     * On Init
     */
    $onInit() {
        this.meta = this.resolve.meta;
        this.roles = this.resolve.roles;
    }

    /**
     * OK button handler
     * 
     * Calls dismiss binding from $uibModal
     */
    ok() {
        this.dismiss();
    }

    /**
     * Handler for when user clicks "Save" in metadata-field component
     * @param {*} $value metadata-field callback value with field name and new value
     */
    saveField($value) {
        // Mark field as being saved (for metdata-field component)
        this.fieldSaving[$value.field] = true;

        // Create params to send to ProjectService.update
        let params = { };
        params[$value.field] = $value.value;
        params.id = this.meta.projectId;

        // Issue update
        this.ProjectService.update(params).then(
            (resp) => {
                // Copy response to this.meta object
                // We are not reassigning the result of Object.assign
                // because this.meta object reference should not change
                Object.assign(this.meta, resp.response)
            },
            (error) => {
                // Error saving a field
            }
        ).finally(
            () => {
                // Mark field saving as complete
                this.fieldSaving[$value.field] = false;
            }
        );
    }
    
    /**
     * Checks if user can edit project metadata and team members.
     * 
     * If it's a PI or CoPI then user can edit the project.
     * 
     * If the project has no PI or CoPI then it'll allow anyone
     * to edit the project.
     * 
     * If the project has no metadata or the metadata has no PI
     * or CoPIs attribute it will NOT allow editing. This
     * is because it's assumed there's an error somewhere.
     * @return {Boolean}
     */
    canEdit() {
        if (this.meta.hasOwnProperty('pi') &&
            this.meta.hasOwnProperty('coPis')){
            if ((_.isEmpty(this.meta.pi) || this.meta.pi === null) ||
                (_.isEmpty(this.meta.coPis) || this.meta.coPis === null)){
                return true;
            }
            return (this.roles.isPI || this.roles.isCoPI);
        }
        return false;
    }

}
