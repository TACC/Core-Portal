
describe("DashboardCtrl", function() {
  var Notifications, controller, $q,
      Jobs, Apps, SystemsService, UserService, scope,
      $uibModal, $rootScope, $controller, controller,
      $httpBackend, fakePromise;
  beforeEach(angular.mock.module("portal"));
  beforeEach( ()=> {
    angular.module('django.context', []).constant('Django', {user: 'test_user'});
    angular.mock.inject(function(_$rootScope_, _$controller_, _Jobs_, _Apps_,
        _$uibModal_, _SystemsService_, _UserService_, _$q_, _$httpBackend_) {
      $controller = _$controller_;
      Jobs = _Jobs_;
      Apps = _Apps_;
      SystemsService = _SystemsService_;
      UserService = _UserService_;
      $uibModal = _$uibModal_;
      $rootScope = _$rootScope_;
      $q = _$q_;
      $httpBackend = _$httpBackend_;
      fakePromise = $q.when();
      $httpBackend.whenGET(/.html*/).respond(200, '');
    });
  });
  beforeEach( ()=> {
    scope = $rootScope.$new();
    spyOn(Jobs, 'list').andReturn(fakePromise);
    spyOn(Apps, 'list').andReturn(fakePromise);
    spyOn(SystemsService, 'list').andReturn(fakePromise);
    spyOn(UserService, 'usage').andReturn(fakePromise);
    controller = $controller('DashboardCtrl', {
      $uibModal:$uibModal, Apps: Apps, $scope: scope,
      Jobs: Jobs, SystemsService:SystemsService, UserService:UserService
    });
    console.info(controller);
  });

  it("Should have the needed methods", function() {
    expect(scope.testSystem).toBeDefined();
    expect(scope.publicKey).toBeDefined();
    expect(scope.resetKeys).toBeDefined();
    expect(scope.pushKey).toBeDefined();
  });

  it("Should call the apps, jobs and systems services", ()=> {
    expect(Jobs.list).toHaveBeenCalled();
    expect(Apps.list).toHaveBeenCalled();
    expect(UserService.usage).toHaveBeenCalled();
    expect(SystemsService.list).toHaveBeenCalled();
  });

  it("Should have a chart", ()=> {
    expect(scope.chart).toBeDefined();
  });

  it("Should bin the jobs by date", ()=>{
    let data = [
      {"jobId": 1, appId: 'test', created: "2018-01-01"},
      {"jobId": 2, appId: 'test', created: "2018-01-02"},
    ];
    scope.first_jobs_date = new Date(2018, 1, 1);
    $httpBackend.when(/api\/workspace\/jobs*/).respond(200, data);
    $httpBackend.flush();
    console.log(scope.jobs)
    expect(scope.jobs.length).toEqual(2);
  });

});
