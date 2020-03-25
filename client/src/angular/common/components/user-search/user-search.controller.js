import _ from 'underscore';
/**
 * Controller for member search.
 */
export default class UserSearchCtrl {
    /**
     * Initialize Controller.
     * @param {Object} UserService
     */
    constructor(UserService) {
        'ngInject';
        this.UserService = UserService;
        this.data = {};
        this.warning = null;
        this.showConfirm = false;
        this.hideCancel = false;
    }

    $onInit() {
        if (!this.selectText) {
            this.selectText = "Select User";
        }
    }

    /**
     * Cancel button handler
     */
    cancel() {
        this.onCancel();
    }
    
    /**
     * Select button handler
     */
    select() {
        if (!this.warning) {
            this.confirm();
        } else {
            this.showConfirm = true;
        }
    }

    /**
     * Send the data back
     */
    confirm() {
        this.onSelect({ $user: this.data.member });
    }

    /**
     * Search a user
     * @param {String} q - Query string to search on first name, last name or email.
     */
    search(q) {
        return this.UserService.search(q);
    }

    /**
     * Format typeahead selection
     * @return {String}
     */
    formatSelection() {
        if (!this.data.member){
            return '';
        }
        return `${this.data.member.first_name}\
 ${this.data.member.last_name} (${this.data.member.username}) : ${this.data.member.email}`;
    }

}
