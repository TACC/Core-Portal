// import SearchService from './search-service';

// let service;

describe("UserService", function() {
  var UserService, $httpBackend;
  beforeEach(angular.mock.module("portal"));
  beforeEach( ()=> {
    angular.module('django.context', []).constant('Django', {user: 'test_user'});
    angular.mock.inject(function(_$httpBackend_, _UserService_) {
      UserService = _UserService_;
      $httpBackend = _$httpBackend_;

      // This fixes some issues with angular requesting templates
      // and promises in the route resolves
      $httpBackend.whenGET(/.html*/).respond(200, '');
      $httpBackend.whenGET(/api\/data-depot*/).respond(200, '');
      $httpBackend.flush();

    });
  });

  it("Should have right methods", function() {
    expect(UserService.authenticate).toBeDefined();
    expect(UserService.usage).toBeDefined();
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



});
