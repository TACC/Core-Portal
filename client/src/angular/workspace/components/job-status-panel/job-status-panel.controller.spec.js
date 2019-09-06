import { job } from '../../../jobs/fixtures/job';

describe('JobStatusPanelComponent', function() {
    let $q, $rootScope, $componentController, controller, Jobs, $compile, scope, element, Notifications;
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, $componentController, _Jobs_, _Notifications_) => {
                $q = _$q_;
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.$apply();
                $rootScope = _$rootScope_;
                Jobs = _Jobs_;
                Notifications = _Notifications_;

                spyOn(Notifications, 'subscribe');

                let deferred = $q.defer();
                deferred.resolve([ job ]);
                spyOn(Jobs, 'list').and.returnValue(deferred.promise);

                let elementHtml = "<job-status-panel></job-status-panel>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
                controller = element.controller('job-status-panel');
            }
        );
    });

    it("should have a controller", () => {
        expect(controller).toBeDefined();
    })

    it("should broadcast refresh event", () => {
        spyOn($rootScope, '$broadcast');
        controller.refresh();
        expect($rootScope.$broadcast).toHaveBeenCalledWith("refresh-jobs-panel");
    });

});
