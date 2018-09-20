
describe("DashboardCtrl", function() {
  var Notifications, controller, $q,
      Jobs, Apps, SystemsService, UserService, scope,
      $uibModal, $rootScope, $controller, ctrl,
      $httpBackend, fakePromise, systems;
  beforeEach(angular.mock.module("portal"));
  beforeEach( ()=> {
    angular.module('django.context', []).constant('Django', {user: 'test_user'});
    //these get passed into controller via a resolve in ui-router
    systems = [{systemId : 1, name: 'My Data'}];
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
      systems = systems;
      fakePromise = $q.when();
      $httpBackend.whenGET(/.html*/).respond(200, '');
    });
  });
  beforeEach( ()=> {
    scope = $rootScope.$new();
    let jobs_data = [
      {"jobId": 1, appId: 'test', created: new Date("2018-1-2")},
      {"jobId": 2, appId: 'test', created: new Date("2018-1-3")},
      {"jobId": 3, appId: 'test', created: new Date("2018-1-3")},

    ];
    spyOn(Jobs, 'list').andReturn($q.when(jobs_data));
    spyOn(Apps, 'list').andReturn(fakePromise);
    spyOn(SystemsService, 'list').andReturn(fakePromise);
    spyOn(UserService, 'usage').andReturn(fakePromise);
    ctrl = $controller('DashboardCtrl', {
      $uibModal:$uibModal, Apps: Apps, $scope: scope,
      Jobs: Jobs, SystemsService:SystemsService, UserService:UserService,
      systems: systems
    });
    ctrl.first_jobs_date = new Date("2018-1-1");
    ctrl.$onInit();
  });

  it("Should have the needed methods", function() {
    expect(ctrl.testSystem).toBeDefined();
    expect(ctrl.publicKey).toBeDefined();
    expect(ctrl.resetKeys).toBeDefined();
    expect(ctrl.pushKey).toBeDefined();
  });

  it("Should call the apps, jobs and systems services", ()=> {
    expect(Jobs.list).toHaveBeenCalled();
    expect(Apps.list).toHaveBeenCalled();
    expect(UserService.usage).toHaveBeenCalled();
    expect(SystemsService.list).toHaveBeenCalled();
  });

  it("Should have a chart", ()=> {
    expect(ctrl.chart).toBeDefined();
  });

  it("Should bin the jobs by date", ()=>{
    //have to $apply to get promises to resolve
    $rootScope.$apply();
    expect(ctrl.jobs.length).toEqual(3);
    //should be 2 jobs for one of the days
    expect(ctrl.chart_data.length).toEqual(2);
  });

  it("Should call SystemsService.resetKeys", ()=> {
    spyOn(SystemsService, 'resetKeys').andReturn(fakePromise);
    let sys = {id:1};
    ctrl.resetKeys(sys);
    expect(SystemsService.resetKeys).toHaveBeenCalledWith(sys);
  });

  it("Should open the push keys modal", ()=>{
    let mockModal = {
      result: fakePromise
    };
    spyOn($uibModal, 'open').andReturn(mockModal);
    ctrl.pushKey({});
    expect($uibModal.open).toHaveBeenCalled();
  });

  it("should test systems", ()=> {
    let sys = {id:1};
    spyOn(SystemsService, 'test').andReturn(fakePromise);
    ctrl.testSystem(sys);
    expect(SystemsService.test).toHaveBeenCalledWith(sys);
  });

});
