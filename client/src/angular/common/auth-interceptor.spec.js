// import SearchService from './search-service';

// let service;

describe("AuthInterceptor", function() {
  var AuthInterceptor, $q, httpProvider, $http, $window, $httpBackend;
  beforeEach(
    angular.mock.module("portal", ($httpProvider, $provide) => {
      httpProvider = $httpProvider;
      $provide.value('$window', {
          location: {href: '/test'}
      });
    })
  );
  beforeEach( ()=> {
    angular.mock.inject(function(_$q_, _AuthInterceptor_, _$http_, _$window_, _$httpBackend_) {
      AuthInterceptor = _AuthInterceptor_;
      $q = _$q_;
      $http = _$http_;
      $window = _$window_;
      $httpBackend = _$httpBackend_;
    });
  });

  it('should register an interceptor', ()=> {
    expect(httpProvider.interceptors).toContain('AuthInterceptor');
  });

  it("Should redirect to /login on 401", ()=> {
    $http.get('/mock/route').then(
        function(response) {},
        function(err) {}
    );

    $httpBackend.whenGET('/mock/route').respond(401, {});
    $httpBackend.flush();
    expect($window.location.href).toEqual('/login');
  });

  it("Should do nothing to for 200", ()=> {
    $http.get('/mock/route').then(
        function(response) {},
        function(err) {}
    );

    $httpBackend.whenGET('/mock/route').respond(200, {});
    $httpBackend.flush();
    expect($window.location.href).toEqual('/test');
  });



});
