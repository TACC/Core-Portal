import _ from 'underscore';

/**
 * Controller for a project metadata.
 */
export default class ProjectMetadataCtrl {
    /**
     * Initialize controller.
     * @param {Object} ProjectService
     */
    constructor(ProjectService, $uibModal, Django) {
        'ngInject';
        this.$uibModal = $uibModal;
        this.ProjectService = ProjectService;
        this.Django = Django;
        this.ui = {
            showMore: false,
            loading: true,
        };
        this.data = {};
        this.saveField.bind(this);
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
     * Checks if it's valid to add a PI.
     * A project can only have one PI.
     * @return {Boolean}
     */
    canAddPI() {
        if (!this.data.hasOwnProperty('meta') &&
            !this.data.hasOwnProperty('pi')){
            return false;
        }
        return (
            this.data.meta.pi === null ||
            _.isEmpty(this.data.meta.pi) &&
            this.canEditTeamMembers()
        );
    }
    /**
     * Check if user and project can remove PI.
     * @return{Boolean}
     */
    canRemovePI() {
        if (!this.data.hasOwnProperty('meta') &&
            !this.data.hasOwnProperty('pi')){
            return false;
        }
        return (
            !_.isEmpty(this.data.meta.pi) &&
            this.canEditTeamMembers()
        );
    }
    /**
     * Checks if user is a PI.
     * If it's a PI or a CoPI then user can edit team members.
     * If the project has no PI or CoPI then it'll allow anyone
     * to edit members.
     * If the project has no metadata or the metadata has no PI
     * or CoPIs attribute it will NOT allow editing members. This
     * is because it's assumed there's an error somewhere.
     * @return {Boolean}
     */
    canEditTeamMembers() {
        if (this.data.hasOwnProperty('meta') &&
            this.data.meta.hasOwnProperty('pi') &&
            this.data.meta.hasOwnProperty('coPis')){
            if ((_.isEmpty(this.data.meta.pi) || this.data.meta.pi === null) ||
                (_.isEmpty(this.data.meta.coPis) || this.data.meta.coPis === null)){
                return true;
            }
            return (this.Django.user === this.data.meta.pi.username ||
                    _.findWhere(this.data.meta.coPis, {username: this.Django.user}) !== undefined);
        }
        return false;
    }
    /**
     * Cancel edit mode.
     */
    cancelEdit() {
        this.ui.editing = false;
        this.ui.editingField = '';
    }
    /**
     * Delete a PI from the project.
     * @param {String} memberType - Member type [pi, co_pi, team_member].
     * @param {Object} user object.
     */
    deleteMember(memberType, user) {
        this.ui.loading = true;
        this.ProjectService.deleteMember(
            this.data.meta.projectId,
            memberType,
            user.username
        ).then((resp) => {
            this.data.meta = Object.assign(
                this.data.meta,
                resp.response
            );
        }).finally(()=>{
            this.ui.loading = false;
        });
    }
    /**
     * Returns the project's description or a default
     * @return {String} project's description
     */
    description() {
        if (!this.data.hasOwnProperty('meta') ||
            !this.data.meta.hasOwnProperty('description')){
            return 'Description ...';
        }
        else if (_.isEmpty(this.data.meta.description)){
            return 'Description ...';
        } 
        return this.data.meta.description;
    }
    /**
     * Start editing a project's field.
     * @param {String} fieldName - field name.
     */
    editField(fieldName) {
        if (this.editModeStatus()) {
            return;
        }
        this.ui.editing = true;
        this.ui.editingField = fieldName;
        this.data[fieldName] = this.data.meta[fieldName];
    }
    /**
     * Checks status of edit mode.
     * @return {Boolean}
     */
    editModeStatus() {
        return this.ui.editing;
    }
    /**
     * Checks if a field is being edited.
     * @param {String} fieldName - field name.
     * @return {Boolean}
     */
    isBeingEdited(fieldName) {
        return fieldName === this.ui.editingField;
    }
    /**
     * Open member search dialog.
     */
    openMemberSearch(memberType, title){
        let modal = this.$uibModal.open({
            component: 'projectMemberSearch',
            resolve: {
                title: ()=>{
                    return title;
                }
            }
        });
        modal.result.then(
            (res)=>{
                return res.user;
            }
        ).then(
            (user)=>{
                this.ui.loading = true;
                return this.ProjectService.addMember(
                    this.data.meta.projectId,
                    memberType,
                    user.username
                ).then((resp)=>{
                    this.data.meta = Object.assign(
                        this.data.meta,
                        resp.response
                    );
                },(err)=>{
                    this.ui.error = err;
                }).finally(()=>{
                    this.ui.loading = false;
                });
        });
    }
    /**
     * Saves edited field.
     * @param {String} fieldName - field name.
     */
    saveField(fieldName) {
        let value = this.data[fieldName];
        this.ui.loading = true;
        this.ui.editing = false;
        this.ui.editingField = '';
        let params = {};
        params[fieldName] = value;
        params.id = this.data.meta.projectId;
        this.ProjectService.update(params)
        .then((resp) => {
            this.data.meta = Object.assign(
                this.data.meta,
                resp.response
            );
        }, (err) => {
            this.ui.error = err.message;
            this.ui.status = err.status;
        })
        .finally(()=>{
            this.ui.loading = false;
        });
    }
    /**
     * Toggle flag to show more info.
     * @return {Boolean}
     */
    toggleShowMore() {
        this.ui.showMore = !this.ui.showMore;
    }
}
