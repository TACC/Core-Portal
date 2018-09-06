describe('ProjectMemberSearchCtrl', ()=>{
    let element, complied, controller, $q, scope, $compile, UserService;
    const user = {
        'first_name': 'First Name',
        'last_name': 'Last Name',
        'email': 'email@email.com',
        'username': 'username'
    };
    const MockUserService = {
        search: (q) => {
            return [user];
        }
    };

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject(
            (_$rootScope_, _$q_, $componentController) => {
                $q = _$q_;
                scope = _$rootScope_.$new();

                scope.mock_resolve = {
                    "something": {},
                };

                scope.$apply();

                const mockedServices = {
                    UserService: MockUserService,
                };
                const mockedBindings = {
                    resolve: {
                        title: 'This modal\'s title'
                    },
                    close: (ret) => { return ret; },
                    dismiss: (ret) => { return ret; }
                };
                controller = $componentController(
                    'projectMemberSearch',
                    mockedServices,
                    mockedBindings
               );

                controller.$onInit();
            }
        );
    });

    it('should get title from resolve', () => {
        expect(controller.ui.title).toEqual('This modal\'s title');
    });

    it('should search for a user', () => {
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
});
