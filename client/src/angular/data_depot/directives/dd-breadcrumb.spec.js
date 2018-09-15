
describe("FileListing", function() {
  var $compile, $rootScope, $httpBackend, FileListing;
  beforeEach(angular.mock.module("portal"));
  beforeEach( ()=> {
    angular.module('django.context', []).constant('Django', {user: 'test_user'});
    angular.mock.inject(function(_$compile_, _$rootScope_, _$httpBackend_, _FileListing_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $httpBackend = _$httpBackend_;
      FileListing = _FileListing_;
      $httpBackend.whenGET(/.html*/).respond(200, '');
      // $httpBackend.whenGET(/api\/data-depot*/).respond(200, '');
      $httpBackend.flush();
    });
  });

  it('Should render a breadcrumb trail', ()=>{
    var scope = $rootScope.$new();
    let listing = {
      'system': 'test',
      'trail': [
        {name: ""},
        {name: "dir1"},
      ]
    };
    var fl = FileListing.init(listing);
    let el = angular.element('<dd-breadcrumb listing="listing"></dd-breadcrumb>');
    var element = $compile(el)(scope);
    scope.listing = fl;
    scope.onBrowse = function(d) {};
    scope.itemHref = function(d) {};
    scope.$digest();
    let sc = element.isolateScope();
    expect(sc.offset).toEqual(0);
    expect(element.find('li').length).toEqual(2);
  });

  it('Should work with customRoot', ()=>{
    var scope = $rootScope.$new();
    let listing = {
      'system': 'test',
      'trail': [
        {name: ""},
        {name: "dir1"},
      ]
    };
    var fl = FileListing.init(listing);
    let el = angular.element('<dd-breadcrumb custom-root="customRoot" listing="listing"></dd-breadcrumb>');
    var element = $compile(el)(scope);
    scope.listing = fl;
    scope.customRoot= {
      route: 'db.test',
      name: 'My Data'
    };
    scope.$digest();
    let sc = element.isolateScope();
    expect(sc.offset).toEqual(0);
    expect(element.html()).toContain('My Data');
    expect(element.find('li').length).toEqual(3);
  });

  it('Should work with a project', ()=>{
    var scope = $rootScope.$new();
    let listing = {
      'system': 'test',
      'trail': [
        {name: ""},
        {name: "dir1"},
      ]
    };
    var fl = FileListing.init(listing);
    let el = angular.element('<dd-breadcrumb project="project" custom-root="customRoot" listing="listing"></dd-breadcrumb>');
    var element = $compile(el)(scope);
    scope.listing = fl;
    scope.customRoot= {
      route: 'db.test',
      name: 'My Projects'
    };
    scope.project = {name: 'Test Project'};
    scope.$digest();
    let sc = element.isolateScope();
    expect(sc.offset).toEqual(0);
    expect(element.html()).toContain('My Projects');
    expect(element.html()).toContain('Test Project');
    expect(element.find('li').length).toEqual(4);
  });
});
