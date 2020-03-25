import _ from 'underscore';

/**
 * Controller for a project metadata.
 */
export default class ProjectMetadataCtrl {
    /**
     * Initialize controller.
     * @param {Object} ProjectService
     */
    constructor(ProjectService, $uibModal, UserService) {
        'ngInject';
        this.$uibModal = $uibModal;
        this.ProjectService = ProjectService;
        this.UserService = UserService;
        this.ui = {
            loading: true,
        };
        this.data = {};
    }
    /**
     * On Init
     */
    $onInit() {
        this.ui.loading = true;
        this.ProjectService.getBySystemId(
            {
                id: this.systemId
            }
        )
        .then((resp) => {
            this.data.meta = resp.response;
            return this.data.meta;
        },
        (err) => {
            this.ui.error = {
                status: err.status,
                message: err.message
            };
        })
        .finally(()=> {
            this.ui.loading = false;
        });
    }

    /**
     * Edit Project Info button handler
     */
    editMetadata() {
        let modal = this.$uibModal.open({
            component: 'editProjectMetadataModal',
            resolve: this.getModalResolve()
        });
    }

    /**
     * Edit Members button handler
     */
    editMembers() {
        let modal = this.$uibModal.open({
            component: 'editProjectMembersModal',
            resolve: this.getModalResolve()
        });
    }

    /**
     * Generate data to pass to modals
     */
    getModalResolve() {
        return {
            meta: this.data.meta,
            roles: this.getRoles()
        }
    }

    canEdit() {
        if (this.data.meta && !this.data.meta.pi && this.isOwner()) {
            return true;
        }
        return this.isPI() || this.isCoPI();
    }

    /**
     * Returns true if the current user is the PI of this project
     *
     * @return {Boolean}
     */
    isPI() {
        return this.data.meta && this.data.meta.pi && this.UserService.currentUser.username == this.data.meta.pi.username;
    }

    /**
     * Returns true if the current user is a Co-PI of this project
     */
    isCoPI() {
        return this.data.meta && _.findWhere(this.data.meta.coPis, {username: this.UserService.currentUser.username}) !== undefined;
    }

    /**
     * Returns true if the current user created this project
     */
    isOwner() {
        return this.data.meta && this.data.meta.owner && this.UserService.currentUser.username == this.data.meta.owner.username;
    }

    /**
     * Returns an object describing this user's project role
     */
    getRoles() {
        return {
            isPI: this.isPI(),
            isCoPI: this.isCoPI(),
            isOwner: this.isOwner()
        }
    }

}
