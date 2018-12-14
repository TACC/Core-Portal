import {agaveApp as appDefn} from '../fixtures/app';
import {meta as appMeta} from '../fixtures/appMeta';

describe("ApplicationFormCtrl", function() {
  var controller, $q,
      Apps, scope,
      $rootScope, $controller, ctrl,
      $timeout, $location, $anchorScroll,
      $translate, Jobs, SystemsService,
      $httpBackend, $localStorage;
  beforeEach(angular.mock.module("portal"));
  beforeEach( ()=> {
    angular.module('django.context', []).constant('Django', {user: 'test_user'});

    angular.mock.inject(function(_$rootScope_, _$controller_,  _Apps_, _Jobs_,
        _SystemsService_, _$anchorScroll_, _$translate_,

        _$q_, _$httpBackend_, _$localStorage_, _$timeout_) {
      $controller = _$controller_;
      Apps = _Apps_;
      $localStorage = _$localStorage_;
      $rootScope = _$rootScope_;
      $q = _$q_;
      $httpBackend = _$httpBackend_;
      $anchorScroll = _$anchorScroll_;
      $translate = _$translate_;
      SystemsService = _SystemsService_;
    });
  });
  beforeEach( ()=> {
    scope = $rootScope.$new();

    spyOn(Apps, 'get').and.returnValue($q.when({
      data:{
        response: appDefn
      }
    }));
    ctrl = $controller('ApplicationFormCtrl', {
      $scope: scope,
      $rootScope: $rootScope,
      $localStorage: $localStorage,
      $location: $location,
      $anchorScroll: $anchorScroll,
      $translate: $translate,
      Apps: Apps,
      Jobs: Jobs,
      SystemsService: SystemsService,
      Django: {},
      $timeout: $timeout

    });
    spyOn(scope, 'resetForm').and.callThrough();

  });

  it("should have no app on init", ()=>{
    expect(scope.data.app).toBeNull();
  });

  it("should get the app when launch-app is emitted", ()=> {
    scope.$broadcast("launch-app", appMeta);
    scope.$digest();
    expect(Apps.get).toHaveBeenCalledWith(appMeta.value.definition.id);
    expect(scope.data.app).toBeDefined();
    expect(scope.resetForm).toHaveBeenCalled();
  });

  it("Should reset the form when an app is loaded", ()=> {
    scope.data.app = appDefn;
    scope.resetForm();
    expect(scope.form).toBeDefined();
  });

  it("Should parse the agave app nd make a json schema", ()=> {
    scope.data.app = appDefn;
    scope.resetForm();
    let f  = scope.form;
    expect(f.schema.properties.inputs).toBeDefined();
    expect(f.schema.properties.inputs.properties.problem).toBeDefined();

  });

});
