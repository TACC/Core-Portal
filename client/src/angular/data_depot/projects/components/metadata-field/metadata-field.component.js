import template from './metadata-field.template.html';
import css from './metadata-field.css';
import projectsComponentsCss from '../projects.components.css';
import MetadataFieldCtrl from './metadata-field.controller.js';

const metadataFieldComponent = {
    template: template,
    controller: MetadataFieldCtrl,
    bindings: {
        meta: '<',              // object with fields
        field: '@',             // field to display and edit
        label: '@',             // label for field
        inputType: '@',         // any input type of "textarea"
        onSave: '&',            // on-save callback
        editable: '<',          // boolean if field should have edit button
        saving: '<'             // boolean if field should display "Saving" spinner
    }
};

export default metadataFieldComponent;
