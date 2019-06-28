describe('AppTrayCtrl', ()=>{
    let controller, $scope;
    let Apps, SimpleList, Notifications;
    let $mdToast, UserService;
    let $q;
    let $translate;
    let projectOption;
    let SimpleListSpy;
    let $httpBackend;
    let $compile;
    let element;



    beforeEach(angular.mock.module("portal"));
    beforeEach(angular.mock.module(function($provide) {
        // Mock Notifications to prevent /api/notifications subscription call
        let NotificationsMock = {
            $get: function() {
                return {
                    list: jasmine.createSpy('list'),
                    showToast: jasmine.createSpy('showToast')
                }
            }
        }

        $provide.provider('Notifications', function() {
            return NotificationsMock;
        });

        let SimpleListMock = {
            $get: function() {
                return function() {
                    return {
                        getPrivate: jasmine.createSpy('getPrivate'),
                        // Have to mock a promise returning function
                        // without having access to $q
                        getDefaultLists: () => { 
                            return {
                                then: (callback) => {
                                    callback();
                                }
                            }
                        },
                        tabs: [ "Simulation", "Utilities" ],
                        lists: { 
                            "Simulation" : [ ],
                            "Utilities" : [
                                {
                                    "app" : {
                                        "value" : {
                                            "definition": {
                                                "label" : "compress"
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        }
    
        $provide.provider('SimpleList', function() {
            return SimpleListMock
        });
    }));
    beforeEach( ()=> {
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            _$compile_,
            _$stateParams_,
            _$translate_,
            _Apps_,
            _SimpleList_,
            _Notifications_,
            _$mdToast_,
            _UserService_,
            _$httpBackend_,
            $componentController
        ) => {
            $q = _$q_;
            $compile = _$compile_;
            $scope = _$rootScope_.$new();
            $scope.$apply();
            Apps = _Apps_;
            SimpleList = _SimpleList_;
            $mdToast = _$mdToast_;
            $translate = _$translate_;
            Notifications = _Notifications_;
            UserService = _UserService_;

            $httpBackend = _$httpBackend_;

            let deferred = $q.defer();
            deferred.resolve({ });

            spyOn(UserService, 'allocations').and.returnValue(deferred.promise);
            spyOn(Apps, 'getMeta');

            element = angular.element('<app-tray></app-tray>');
            element = $compile(element)($scope);
            
            controller = element.controller('app-tray');
            $scope.$digest();

        });
    });
    it('should initialize controller', () => {
        expect(controller).toBeDefined();
    });
    it('should display non-empty tabs and hide empty ones', () => {
        expect(element.text()).toContain('Utilities');
        expect(element.text()).not.toContain("Simulation");
    });

});
