import { agaveApp as appDefn } from '../../fixtures/app';
import { meta as appMeta } from '../../fixtures/appMeta';

describe('AppFormComponent', function() {
    var $q, Apps, $rootScope, $componentController, ctrl,
        $timeout, Jobs, $compile, $httpBackend;

    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', {
            user: 'test_user'
        });

        angular.mock.inject(function(_$rootScope_, _$componentController_, _Apps_, _Jobs_,
            _$timeout_, _$q_, _$compile_, _$httpBackend_) {
            $componentController = _$componentController_;
            Apps = _Apps_;
            Jobs = _Jobs_;
            $rootScope = _$rootScope_;
            $timeout = _$timeout_;
            $q = _$q_;
            $compile = _$compile_;
            $httpBackend = _$httpBackend_;
        });
    });
    beforeEach(() => {
        spyOn(Apps, 'get').and.returnValue($q.when({
            data: {
                response: appDefn
            }
        }));
        ctrl = $componentController('appForm', {
            $rootScope: $rootScope,
            Apps: Apps,
            Jobs: Jobs,
            $timeout: $timeout
        });
        ctrl.$onInit();
    });

    it('should get the app when launch-app is emitted', () => {
        spyOn(ctrl, 'resetForm').and.callThrough();
        ctrl.selectedApp = appMeta;
        ctrl.$onChanges();
        $rootScope.$digest();
        expect(Apps.get).toHaveBeenCalledWith(appMeta.value.definition.id);
        expect(ctrl.app).toBeDefined();
        expect(ctrl.resetForm).toHaveBeenCalled();
    });

    it('Should reset the form when an app is loaded', () => {
        ctrl.app = appDefn;
        ctrl.resetForm();
        expect(ctrl.form).toBeDefined();
    });

    it('Should parse the agave app and make a json schema', () => {
        ctrl.app = appDefn;
        ctrl.resetForm();
        expect(ctrl.schema.properties.inputs).toBeDefined();
        expect(ctrl.schema.properties.inputs.properties.problem).toBeDefined();
    });

    it('Should handle a submit', (done)=>{
        let jobSpy = spyOn(Jobs, 'submit').and.returnValue($q.when({}));
        let scope = $rootScope.$new();
        scope.app = appMeta;
        let inputFile = 'agave://some-system/some-file.plan',
            template = angular.element('<app-form selected-app=app></app-form>'),
            el = $compile(template)(scope);
        let ctrl = el.controller('app-form');
        $rootScope.$digest();

        // Have to put this in a timeOut to work around ASF issue
        setTimeout( ()=> {
            //input fields should be there now...
            expect(el.find('form').children.length > 0).toBe(true);
            ctrl.model.inputs.problem = inputFile;
            ctrl.onSubmit({ $valid: true });
            expect(jobSpy.calls.mostRecent().args[0].inputs.problem).toBe(inputFile);
            expect(jobSpy.calls.mostRecent().args[0].appId).toBe(appDefn.id);
            done();
        }, 10);
    });

    //TODO: Add test for bourbon prize, i.e. when there are a variable number of
    // fields in the form. 

});
