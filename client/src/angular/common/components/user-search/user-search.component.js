import template from './user-search.template.html';
import css from './user-search.css';
import UserSearchCtrl from './user-search.controller.js';

const userSearchComponent = {
    template: template,
    controller: UserSearchCtrl,
    bindings: {
        label: '@',
        warning: '@',           // If there is a warning, a confirmation will be given before onSelect
        onSelect: '&',
        onCancel: '&'
    }
};

export default userSearchComponent;
