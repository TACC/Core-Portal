
describe("DashboardCtrl", function() {
  var SearchService, $window, $location, $state,
      $controller, $rootScope, scope, ctrl, $q;
  beforeEach(angular.mock.module("portal"));
  beforeEach( ()=> {
    angular.module('django.context', []).constant('Django', {user: 'test_user'});
    angular.mock.inject(function(_$rootScope_, _$controller_,
      _SearchService_, _$location_, _$state_, _$q_) {
      $location = _$location_;
      $state = _$state_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      SearchService = _SearchService_;
      $q = _$q_;
    });
  });
  beforeEach( ()=> {
    ctrl = $controller('SearchViewCtrl', {
      SearchService: SearchService,
      $location: $location,
      $state: {params: {}}
    });

  });


  it("Should init with proper data", ()=> {
    ctrl.$state.params.query_string = 'test';
    ctrl.$onInit();
    expect(ctrl.data.text).toEqual('test');
  });

  it("Should view next page of results", ()=> {
    spyOn(SearchService, 'search').and.returnValue($q.when({}));
    ctrl.$state.params.query_string = 'test';
    ctrl.$onInit();
    ctrl.next();
    expect(ctrl.page_num).toEqual(1);
    expect(SearchService.search).toHaveBeenCalled();
  });

  it("should change filter type", ()=>{
    spyOn(ctrl, 'search_browse').and.returnValue($q.when({}));
    ctrl.filter('test_filter');
    expect(ctrl.data.type_filter).toEqual('test_filter');
    expect(ctrl.page_num).toEqual(0);
    expect(ctrl.search_browse).toHaveBeenCalled();
  });

});
