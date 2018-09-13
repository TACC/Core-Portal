
describe("FileListing", function() {
  var $compile, $rootScope, $httpBackend;
  beforeEach(angular.mock.module("portal"));
  beforeEach( ()=> {
    angular.module('django.context', []).constant('Django', {user: 'test_user'});
    angular.mock.inject(function(_$compile_, _$rootScope_, _$httpBackend_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $httpBackend = _$httpBackend_;
      $httpBackend.whenGET(/.html*/).respond(200, '');
      // $httpBackend.whenGET(/api\/data-depot*/).respond(200, '');
      $httpBackend.flush();

    });
  });

  it('Should render a breadcrumb trail', ()=>{
    let listing = {};
    listing.trail = [
      {path: "", system: "test", name: ""},
      {path: "/dir1", system: "test", name: "dir1"}
    ];
    let scope = $rootScope.$new();
    scope.listing = listing;
    var element = $compile('<dd-breadcrumb listing="listing"></dd-breadcrumb>')(scope);
    scope.$digest();
    console.info(element);
    console.info(element.text());
    expect(element.text()).toContain('li');
  });

});
