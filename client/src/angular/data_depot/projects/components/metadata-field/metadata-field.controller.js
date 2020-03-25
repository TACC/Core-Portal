import _ from 'underscore';
/**
 * Controller for metadata-field.
 */
export default class MetadataFieldCtrl {
    /**
     * Initialize Controller.
     */
    constructor() {
        'ngInject';
        this.meta = { };
        this.field = "";
        this.label = "";
        this.inputType = "text";
        this.isBeingEdited = false;
        this.editable = false;
        this.saving = false;
        this.value = "";
    }

    /**
     * On Init
     */
    $onInit() {
        this.value = this.meta[this.field];
    }

    /**
     * Start editing a project's field.
     */
    editField() {
        this.isBeingEdited = true;
    }

    /**
     * Cancel editing without saving
     */
    cancelEdit() {
        this.isBeingEdited = false;
    }

    /**
     * 
     */
    saveField() {
        this.isBeingEdited = false;
        this.onSave({
            $value: {
                field: this.field,
                value: this.value
            }
        });
    }

}
