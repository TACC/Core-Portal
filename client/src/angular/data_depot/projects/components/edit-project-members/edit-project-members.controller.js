import _ from 'underscore';
/**
 * Controller for member search.
 */
export default class EditProjectMembersCtrl {
    /**
     * Initialize Controller.
     */
    constructor(ProjectService, UserService) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.UserService = UserService;
        this.meta = { };
        this.roles = { };
        this.resolve = { };

        // Controller variables
        this.piSearch = false;
        this.isSavingPI = false;
        this.piChangeWarning = "Are you sure you wish to change the PI?";

    }
    /**
     * On Init
     */
    $onInit() {
        this.meta = this.resolve.meta;
        this.roles = this.resolve.roles;
        this.setPIWarning();
    }

    /**
     * Sets a different warning when changing the PI depending
     * on the current user's role
     */
    setPIWarning() {
        if (this.roles.isOwner && !this.roles.isPI) {
            this.piChangeWarning = "Once you set a PI for this project, " +
                                   "only the new PI will be able to change " +
                                   "the project PI and add Co-PI's. " + 
                                   "Are you sure you wish to continue?";
        }
        if (this.roles.isPI) {
            this.piChangeWarning = "You are removing yourself as the PI for this project. " +
                                   "Only the new PI or Co-PIs may change who is PI for this project." +
                                   "Are you sure you wish to continue?";
        }
        if (this.roles.isCoPI) {
            this.piChangeWarning = "You are replacing the current PI for this project. " +
                                   "Are you sure you wish to continue?";
        }
    }

    /**
     * Returns true if PI control buttons should be displayed
     * 
     * @return {Boolean}
     */
    showPIControls() {
        return this.canSetPI() && !this.piSearch && !this.isSavingPI && !this.askPIChange;
    }

    /**
     * "Set PI" button handler
     * 
     * Reveals the project members search box so
     * a user can set the project's PI.
     */
    showPISearch() {
        this.piSearch = true;
    }

    /**
     * Callback for when user selects a new PI from user-search
     * Should hide the member search and transition to the PI change confirmation
     * 
     * @param {*} $user Return value from user-search
     */
    setPI($user) {
        this.piSearch = false;

        // Sanity check to prevent setting the PI to nobody
        if (!$user || !$user.username || $user.username.length == 0) {
            return;
        }

        this.isSavingPI = true;

        // Change theP
        this.ProjectService.addMember(
            this.meta.projectId,
            "pi",
            $user.username
        ).then(
            (resp) => {
                // Copy the new metadata into the old one, but
                // do not replace the object completely (otherwise)
                // the bound metadata reference will be invalid!
                Object.assign(this.meta, resp.response);
                this.roles.isPI = this.meta.pi && this.meta.pi.username === this.UserService.currentUser.username;
            } 
        ).finally(
            () => {
                this.isSavingPI = false;
                this.setPIWarning();
            }
        )
    }

    /**
     * Callback for cancelling a PI search
     */
    cancelSetPI() {
        this.piSearch = false;
    }

    /**
     * Checks if it's valid to set a PI.
     * A project can only have one PI.
     * If a project has no PI, the project owner (creator)
     * can set the PI. If a Project has PI, only the 
     * PI or Co-PIs can set the PI to someone else.
     * @return {Boolean}
     */
    canSetPI() {
        return (
            !this.meta.pi && this.roles.isOwner ||
            this.roles.isPI || 
            this.roles.isCoPI
        );
    }

    /**
     * Returns true if user can add a Co-PI
     */
    canAddCoPI() {
        return this.roles.isPI || this.roles.isCoPI;
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
     * validator for member-list component when a user is adding a Co-PI
     * that already has a different role on the project
     * @param {*} $user 
     */
    coPIValidator($user) {
        if (this.meta.pi.username == $user.username) {
            return $user.fullName + " is currently the project's PI. " + 
                    "If you wish to make them a Co-PI, you must first set a new project PI.";
        }
        if (this.meta.teamMembers.find((teamMember) => teamMember.username == $user.username)) {
            return $user.fullName + " is currently a Team Member. " +
                    "If you wish to make them a Co-PI, " + 
                    "please first remove them from the Team Member list.";
        }
        return false;
    }

    /**
     * validator for member-list component when a user is adding a team member
     * that already has a different role on the project
     * @param {*} $user 
     */
    teamMemberValidator($user) {
        if (this.meta.pi.username == $user.username) {
            return $user.fullName + " is currently the project's PI.";
        }
        if (this.meta.coPis.find((coPi) => coPi.username == $user.username)) {
            return $user.fullName + " is currently a Co-PI. " +
                    "If you wish to make them a team member, " +
                    "please first remove them from the Co-PI list.";
        }
        return false;
    }
}
