describe("UserService", function() {
    var UserService, $httpBackend;
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject(function(_$httpBackend_, _UserService_) {
            UserService = _UserService_;
            $httpBackend = _$httpBackend_;
        });
    });

    it("Should have right methods", function() {
        expect(UserService.authenticate).toBeDefined();
        expect(UserService.usage).toBeDefined();
        expect(UserService.search).toBeDefined();
    });

    it("should handle a usage request", ()=> {
        var httpResponse;
        let data = {'total_storage_bytes': 10};

        //Use a regex so that any query param will pass through
        $httpBackend.whenGET('/api/users/usage/').respond(200, data);
        UserService.usage().then( resp => {
            httpResponse = resp;
        });
        $httpBackend.flush();
        expect(httpResponse.total_storage_bytes).toEqual(10);
    });

    it("should handle a auth request", ()=> {
        var httpResponse;
        let data = {
            "first_name": 'test_firstname',
            "username": 'test',
            "last_name": 'test_lastname',
            "email": 'test@test.com',
            "oauth": {
                "access_token": '123',
                "expires_in": '12345',
                "scope": 'scope',
            }
        };

        //Use a regex so that any query param will pass through
        $httpBackend.whenGET('/auth/user/').respond(200, data);
        UserService.authenticate().then( resp => {
            httpResponse = resp;
        });
        $httpBackend.flush();
        expect(UserService.currentUser.first_name).toEqual('test_firstname');
        expect(UserService.currentUser.username).toEqual('test');
    });

    it("should handle user search request", ()=>{
        let response;
        let data = [
            {
                'first_name': 'Test Name',
                'last_name': 'Test Last',
                'email': 'email@email.com',
                'username': 'username',
            },
            {
                'first_name': 'Test1 Name',
                'last_name': 'Test1 Lást',
                'email': 'email1@email1.com',
                'username': 'username1',
            },
        ];
        $httpBackend.whenGET('/api/users/?q=query+string&role=role+string').respond(200, data);
        UserService.search('query string', 'role string').then( (resp)=>{
            response = resp;
        });
        $httpBackend.flush();
        expect(response.length).toEqual(2);
        expect(response[0].first_name).toEqual(data[0].first_name);
        expect(response[0].last_name).toEqual(data[0].last_name);
        expect(response[0].email).toEqual(data[0].email);
        expect(response[0].username).toEqual(data[0].username);

        expect(response[1].first_name).toEqual(data[1].first_name);
        expect(response[1].last_name).toEqual(data[1].last_name);
        expect(response[1].email).toEqual(data[1].email);
        expect(response[1].username).toEqual(data[1].username);
    });
});
