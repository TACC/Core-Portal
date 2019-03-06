
describe('DashboardCtrl', function() {
    var $q,
        Jobs, Apps, SystemsService, UserService, scope,
        $uibModal, $rootScope, $controller, ctrl,
        $httpBackend, fakePromise, systems;
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        //these get passed into controller via a resolve in ui-router
        systems = [{ systemId: 1, name: 'My Data' }];
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
    beforeEach(() => {
        scope = $rootScope.$new();
        let jobs_data = [
            { jobId: 1, appId: 'test', created: new Date('2018-1-2') },
            { jobId: 2, appId: 'test', created: new Date('2018-1-3') },
            { jobId: 3, appId: 'test', created: new Date('2018-1-3') },

        ];
        spyOn(Jobs, 'list').and.returnValue($q.when(jobs_data));
        spyOn(Apps, 'list').and.returnValue(fakePromise);
        spyOn(SystemsService, 'list').and.returnValue(fakePromise);
        spyOn(UserService, 'usage').and.returnValue(fakePromise);
        spyOn(UserService, 'authenticate').and.returnValue(fakePromise);
        ctrl = $controller('DashboardCtrl', {
            $uibModal: $uibModal, Apps: Apps, $scope: scope,
            Jobs: Jobs, SystemsService: SystemsService, UserService: UserService,
            systems: systems
        });
        ctrl.first_jobs_date = new Date('2018-1-1');
        ctrl.$onInit();
    });

    it('Should have the needed methods', function() {
        expect(ctrl.testSystem).toBeDefined();
        expect(ctrl.publicKey).toBeDefined();
        expect(ctrl.resetKeys).toBeDefined();
        expect(ctrl.pushKey).toBeDefined();
    });

    it('Should call the apps, jobs and systems services', () => {
        expect(Jobs.list).toHaveBeenCalled();
        expect(Apps.list).toHaveBeenCalled();
        expect(UserService.usage).toHaveBeenCalled();
        expect(SystemsService.list).toHaveBeenCalled();
    });

    it('Should have a chart', () => {
        expect(ctrl.chart).toBeDefined();
    });

    it('Should bin the jobs by date', () => {
        //have to $apply to get promises to resolve
        $rootScope.$apply();
        expect(ctrl.jobs.length).toEqual(3);
        //should be 2 jobs for one of the days
        expect(ctrl.chart_data.length).toEqual(2);
    });

    it('Should call SystemsService.resetKeys', () => {
        spyOn(SystemsService, 'resetKeys').and.returnValue(fakePromise);
        let sys = { id: 1 };
        ctrl.resetKeys(sys);
        expect(SystemsService.resetKeys).toHaveBeenCalledWith(sys);
    });

    it('Should open the push keys modal', () => {
        let mockModal = {
                result: fakePromise
            },
            sys = { id: 1 };
        spyOn(SystemsService, 'get').and.callFake(() => {
            return {
                then: function(callback) {
                    return callback(sys);
                },
            };
        });
        spyOn($uibModal, 'open').and.returnValue(mockModal);
        ctrl.pushKey(sys);
        expect(SystemsService.get).toHaveBeenCalledWith(sys.id);
        expect($uibModal.open).toHaveBeenCalled();
    });

    it('should test systems', () => {
        let sys = { id: 1 };
        spyOn(SystemsService, 'test').and.returnValue(fakePromise);
        ctrl.testSystem(sys);
        expect(SystemsService.test).toHaveBeenCalledWith(sys);
    });

});

describe("DashboardCtrl.$onInit() Systems", function() {
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
    spyOn(Jobs, 'list').and.returnValue($q.when(jobs_data));
    spyOn(Apps, 'list').and.returnValue(fakePromise);
    spyOn(UserService, 'usage').and.returnValue(fakePromise);
    UserService.currentUser = { username: 'testUser' };
    ctrl = $controller('DashboardCtrl', {
      $uibModal:$uibModal, Apps: Apps, $scope: scope,
      Jobs: Jobs, SystemsService:SystemsService, UserService:UserService,
      systems: systems
    });
    ctrl.first_jobs_date = new Date("2018-1-1");
  });

  it ("should check systems for keys", () => {
    // If there is no key provided, then the system does not have keys tracked
    let system = { 
      keysTracked: false
    }
    ctrl.checkSystemKeys(system, null);
    expect(system.keysTracked).toBe(false);
    
    // If the key is missing the pubKey field, then the system does not have keys tracked
    let pubKey = { 
    }
    ctrl.checkSystemKeys(system, pubKey);
    expect(system.keysTracked).toBe(false);

    // If the public key is valid, assign it to the system and marked that keys are tracked
    pubKey['public_key'] = "1234";
    ctrl.checkSystemKeys(system, pubKey);
    expect(system.keysTracked).toBe(true);
    expect(system.publicKey).toEqual(pubKey);
  });

  it("should inject retrieved keys into systems", () => {
    let storageSystemKey = {
        owner: null,
        public_key: "1234"
    }
    let storageSystemKey2 = {
      owner: null,
      public_key: null
    }
    var deferred = $q.defer();
    deferred.resolve({
      execution: [ 
        {
          id: "exec.system",
          keysTracked: false,
          type: "EXECUTION"
        }
      ],
      storage: [
        {
          id: "storage.system",
          keysTracked: false,
          type: "STORAGE"
        },
        {
          id: "storage.system.2",
          keysTracked: false,
          type: "STORAGE"
        }
      ],
      publicKeys: {
        "storage.system" : storageSystemKey,
        "storage.system.2" : storageSystemKey2
      }
    });
    spyOn(SystemsService, 'list').and.returnValue(deferred.promise);
    spyOn(SystemsService, 'listRoles').and.returnValue($q.when([{ username: 'testUser', role: 'ADMIN' }]));
    ctrl.$onInit();
    scope.$digest();
    expect(SystemsService.list).toHaveBeenCalled();
    expect(SystemsService.listRoles).toHaveBeenCalled();

    // Test exec.system - should be in ctrl.data.execSystems, keys not being tracked
    let execSystem = ctrl.data.execSystems.find(system => system.id == "exec.system");
    expect(execSystem).toBeTruthy();
    expect(execSystem.keysTracked).toBe(false);

    // Test storage.system - should be in ctrl.data.strgSystems, keys tracked
    let storageSystem = ctrl.data.strgSystems.find(system => system.id == "storage.system");
    expect(storageSystem).toBeTruthy();
    expect(storageSystem.keysTracked).toBe(true);
    expect(storageSystem.publicKey).toEqual(storageSystemKey);

    // Test storage.system.2 - should be in ctrl.data.strgSystems, keys not tracked
    let storageSystem2 = ctrl.data.strgSystems.find(system => system.id == "storage.system.2");
    expect(storageSystem2).toBeTruthy();
    expect(storageSystem2.keysTracked).toBe(false);
    expect(storageSystem2.publicKey).toBeFalsy();

    expect(ctrl.ui.loadingSystems).toBe(false);
  });

  it ("should respond to system loading errors", () => {
    let error = "error";
    var deferred = $q.defer();
    deferred.reject(error);
    spyOn(SystemsService, 'list').and.returnValue(deferred.promise);
    ctrl.$onInit();
    scope.$digest();
    expect(ctrl.ui.loadingSystems).toBe(false);
    expect(ctrl.ui.systemsErrors).toEqual("error");
  });

});