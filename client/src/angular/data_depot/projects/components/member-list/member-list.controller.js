import _ from 'underscore';
/**
 * Controller for member-list.
 */
export default class MemberListCtrl {
    /**
     * Initialize Controller.
     */
    constructor(ProjectService) {
        'ngInject';
        this.ProjectService = ProjectService;

        // Binding defaults
        this.meta = { };
        this.field = "teamMembers";
        this.label = "Team Members";
        this.memberType = "team_member";
        this.buttonText = "Add a member";
        this.editable = false;

        // State variables
        this.memberSearch = false;
        this.isSaving = false;
        this.validatorMessage = null;
        this.memberRemovingStates = { };
        
    }

    $onInit() {
        this.meta[this.field].forEach(
            (member) => {
                this.memberRemovingStates[member.username] = false;
            }
        )
    }

    dismissValidatorWarning() {
        this.validatorMessage = null;
    }

    showMemberSearch() {
        this.memberSearch = true;
    }

    cancelMemberSearch() {
        this.memberSearch = false;
    }

    /**
     * Handler for adding a Co-PI
     * 
     * @param {*} $user user provided by user-search component
     */
    addMember($user) {
        this.memberSearch = false;

        $user.fullName = $user.last_name + ", " + $user.first_name;

        // Validate the selected user
        if (this.validator) {
            this.validatorMessage = this.validator({ $user: $user });
        }

        // If valdiation failed, validationMessage will have a value.
        if (this.validatorMessage) {
            return;
        }

        this.isSaving = true;


        this.ProjectService.addMember(
            this.meta.projectId,
            this.memberType,
            $user.username
        ).then(
            (resp) => {
                // Copy the new metadata into the old one, but
                // do not replace the object completely (otherwise)
                // the bound metadata reference will be invalid!
                Object.assign(this.meta, resp.response);
            }
        ).finally(
            () => {
                this.isSaving = false;
            }
        ) 

    }

    /**
     * Handler for the remove button for any Co-PI
     * 
     * @param {*} member
     */
    removeMember(member) {
        this.memberRemovingStates[member.username] = true;
        this.ProjectService.deleteMember(
            this.meta.projectId,
            this.memberType,
            member.username
        ).then(
            (resp) => {
                Object.assign(this.meta, resp.response);
            }
        ).finally(
            () => {
                this.memberRemovingStates[member.username] = false;
            }
        )
    }

}
