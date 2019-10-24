import { job } from '../../fixtures/job';
import { jobHistory } from '../../../workspace/fixtures/jobHistory';

describe('JobDetailCtrl', ()=>{
    let element, controller, scope, $compile, $q;
    let Jobs, Notifications;
    let $rootScope;
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, $componentController, _Jobs_, _Notifications_) => {
                $q = _$q_;
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                scope = _$rootScope_.$new();
                scope.jobId = "mockJobId";
                Notifications = _Notifications_;

                scope.$apply();

                Jobs = _Jobs_;

                // Mock an interactive job response
                let deferredJobGet = $q.defer();
                job.status = "RUNNING";
                job._embedded = {
                    metadata: [ 
                        {
                            name: "interactiveJobDetails",
                            value: {
                                action_link: "https://myinteractivejob"
                            }
                        }
                    ]
                }
                deferredJobGet.resolve(job);
                spyOn(Jobs, 'get').and.returnValue(deferredJobGet.promise);

                let deferredJobHistoryGet = $q.defer();
                deferredJobHistoryGet.resolve(jobHistory);
                spyOn(Jobs, 'getJobHistory').and.returnValue(deferredJobHistoryGet.promise);

                let elementHtml = "<job-detail jobId='jobId'></job-detail>";
                element = angular.element(elementHtml)
                element = $compile(element)(scope);
                scope.$digest();
                controller = element.controller('job-detail');
            }
        );
    });

    it("should instantiate and have a controller", () => {
        expect(controller).toBeDefined();
        expect(element.text()).toContain("kallisto-0.45.0u3_2019-07-16T15:07:18");
        expect(controller.job.interactive).toEqual(true);
        expect(controller.job.connection_address).toEqual("https://myinteractivejob");
        expect(controller.jobFinished).toEqual(false);
    });

    it("should render data depot links", () => {
        expect(controller.renderAgaveURI("agave://system/path")).toEqual(
            "<a href='/workbench/data-depot/agave/system/path'>agave://system/path</a>"
        )
    });

    it("should render agave job inputs", () => {
        spyOn(controller, 'renderAgaveURI').and.returnValue("uri")

        // should render plain values by returning the value
        expect(controller.renderInput("inputValue")).toEqual("inputValue");

        // should render agave URIs as links to data depot
        expect(controller.renderInput("agave://system/path")).toEqual("uri")

        // should render array-like inputs as lists
        let arrayLike = [ 'agave://system/path', 'inputValue' ];
        expect(controller.renderInput(arrayLike)).toEqual(
            '<ul><li>uri</li><li>inputValue</li></ul>'
        );
    });

    it("should convert ISO dates to local strings", () => {
        expect(controller.convertDate('2019-08-12T16:01:56+0000')).toContain("8/12/2019");
    });

    it("should update the job upon a notification", () => {
        spyOn(Jobs, 'updateJobFromNotification');
        $rootScope.$broadcast('notification');
        $rootScope.$digest();
        expect(Jobs.updateJobFromNotification).toHaveBeenCalled();
    });

});