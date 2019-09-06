import { job } from '../../fixtures/job';

describe('JobsListCtrl', ()=>{
    let element, controller, scope, $compile, $q;
    let Jobs, $rootScope;
    let Notifications;

    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, $componentController, _Jobs_, _Notifications_) => {
                $q = _$q_;
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.$apply();
                $rootScope = _$rootScope_;
                Jobs = _Jobs_;
                Notifications = _Notifications_;

                let deferred = $q.defer();
                deferred.resolve([ job ]);
                spyOn(Jobs, 'list').and.returnValue(deferred.promise);

                let elementHtml = "<jobs-list></jobs-list>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
                controller = element.controller('jobs-list');
            }
        );
    });

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
    });

    it("should retrieve a list of jobs", () => {
        expect(controller.loading).toEqual(false);
        expect(controller.jobs).toEqual([ job ]);
        expect(element.text()).toContain("kallisto");
    });

    it("should process job notifications jobs already in the job list", () => {
        let event = {
            event_type: "job",
            extra: {
                id: 1
            }
        }
        controller.jobs = [
            {
                id: 1
            },
            {
                id: 2
            },
            {
                id: 3
            }
        ]
        let original = controller.jobs[0]
        spyOn(Jobs, 'updateJobFromNotification');
        controller.processNotification(event);
        expect(Jobs.updateJobFromNotification).toHaveBeenCalledWith(original, event);
    });

    it("should process job notifications for jobs that are not already in the job list", () => {
        let event = {
            event_type: "job",
            extra: {
                id: 0
            }
        }
        controller.jobs = [
            {
                id: 1
            },
            {
                id: 2
            },
            {
                id: 3
            }
        ]
        controller.processNotification(event);
        expect(controller.jobs[0]).toEqual(event.extra);
    });

});