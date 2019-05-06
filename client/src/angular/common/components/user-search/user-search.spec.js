describe('UserSearchCtrl', ()=>{
    let element, controller, scope, $compile;
    let UserService;
    const user = {
        'first_name': 'First Name',
        'last_name': 'Last Name',
        'email': 'email@email.com',
        'username': 'username'
    };

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$rootScope_, _$compile_, $componentController, _UserService_) => {
                UserService = _UserService_;
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.onSelect = ($user) => { };
                scope.onCancel = () => { };
                scope.$apply();
                let elementHtml = `<user-search 
                                        label="mockLabel" 
                                        warning="mockWarning"
                                        on-select="onSelect($user)"
                                        on-cancel="onCancel()"></user-search>`;
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
                controller = element.controller('user-search');
            }
        );
    });

    it('should search for a user', () => {
        spyOn(UserService, 'search').and.returnValue( [user] );
        const searchResult = controller.search('first_name');
        expect(searchResult.length).toEqual(1);
        expect(searchResult[0].first_name).toEqual('First Name');
        expect(searchResult[0].last_name).toEqual('Last Name');
        expect(searchResult[0].email).toEqual('email@email.com');
        expect(searchResult[0].username).toEqual('username');
    });

    it('formats a user object', () => {
        controller.data.member = user;
        const formatted = controller.formatSelection();
        const expected = `${user.first_name} ${user.last_name} : (${user.email})`;
        expect(formatted).toEqual(expected);
    });

    it ('should display the provided label', () => {
        expect(element.text()).toContain("mockLabel");
    });

    it ('should display the provided warning', () => {
        controller.select();
        scope.$digest();
        expect(element.text()).toContain("mockWarning");
    });

    it ('should call the event handlers', () => {
        spyOn(scope, 'onSelect');
        controller.confirm();
        expect(scope.onSelect).toHaveBeenCalled();
        spyOn(scope, 'onCancel');
        controller.cancel();
        expect(scope.onCancel).toHaveBeenCalled();
    });
});
