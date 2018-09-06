import _ from 'underscore';
/**
 * Controller for member search.
 */
export default class ProjectMemberSearchCtrl {
    /**
     * Initialize Controller.
     * @param {Object} UserService
     */
    constructor(UserService) {
        'ngInject';
        this.UserService = UserService;
        this.ui = {};
        this.data = {};
    }
    /**
     * On Init
     */
    $onInit() {
        this.ui.title = this.resolve.title;
    }
    cancel(){
        this.dismiss({$value:'cancel'});
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
 ${this.data.member.last_name} : (${this.data.member.email})`;
    }
    select() {
        this.close({
            $value: {
                user: this.data.member,
            }
        });
    }
}
