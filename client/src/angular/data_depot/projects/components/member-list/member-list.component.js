import template from './member-list.template.html';
import css from './member-list.css';
import projectsComponentsCss from '../projects.components.css';
import MemberListCtrl from './member-list.controller.js';

const memberListComponent = {
    template: template,
    controller: MemberListCtrl,
    bindings: {
        meta: '<',              // object with with member arrays
        field: '@',             // object fieldname - "coPis" or "teamMembers"
        memberType: '@',        // Data service member type name "co_pi" or "team_member"
        label: '@',             // label for field
        buttonText: '@',        // "Add button" text
        editable: '<',          // boolean expression if this list is editable
        validator: '&'          // Function that validates new members. 
                                //      Should accept a $user object and return an error message
                                //      or a falsy value if it's okay to add the member
    }
};

export default memberListComponent;
