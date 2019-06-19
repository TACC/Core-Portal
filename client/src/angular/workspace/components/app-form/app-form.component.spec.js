import { agaveApp as appDefn } from '../../fixtures/app';
import { meta as appMeta } from '../../fixtures/appMeta';
import { executionSystem as execSys } from '../../fixtures/executionSystem';

describe('AppFormComponent', function() {
    let $q, Apps, $rootScope, $componentController, ctrl,
        $timeout, Jobs, $compile, UserService, $uibModal, SystemsService, ProjectService;

    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject(function(_$rootScope_, _$componentController_, _Apps_, _Jobs_,
            _$timeout_, _$q_, _$compile_, _UserService_, _$uibModal_, _SystemsService_, _ProjectService_) {
            $componentController = _$componentController_;
            Apps = _Apps_;
            Jobs = _Jobs_;
            $rootScope = _$rootScope_;
            $timeout = _$timeout_;
            $q = _$q_;
            $compile = _$compile_;
            UserService = _UserService_;
            $uibModal = _$uibModal_;
            SystemsService = _SystemsService_;
            ProjectService = _ProjectService_;
        });
    });
    beforeEach(() => {
        appDefn.exec_sys = execSys;
        spyOn(Apps, 'get').and.returnValue($q.when({
            data: {
                response: appDefn,
            },
        }));

        let allocations = {
            allocs: { 'stampede2.tacc.utexas.edu': ['TACC-ACI'] },
            portal_alloc: 'TACC-ACI',
        };
        UserService.userAllocations = allocations;
        ctrl = $componentController('appForm', {
            $rootScope: $rootScope,
            Apps: Apps,
            Jobs: Jobs,
            $timeout: $timeout,
            UserService: UserService,
            $uibModal: $uibModal,
            SystemsService: SystemsService,
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
        spyOn(SystemsService, 'listRoles').and.callFake(() => {
            return {
                then: function(callback) {
                    return callback({ role: 'ADMIN', username: 'test_user' });
                },
            };
        });
        spyOn(ProjectService, 'list').and.callFake(() => {
            return {
                then: function(callback) {
                    return callback([{ name: 'CEP.TEST-1', id: 'CEP.PRTL.TEST-1' }]);
                },
            };
        });
        let jobSpy = spyOn(Jobs, 'submit').and.returnValue($q.when({})),
            scope = $rootScope.$new();
        scope.app = appMeta;
        let inputFile = 'agave://some-system/some-file.plan',
            template = angular.element('<app-form selected-app=app></app-form>'),
            el = $compile(template)(scope),
            ctrl = el.controller('app-form');
        $rootScope.$digest();

        // Have to put this in a timeOut to work around ASF issue
        setTimeout( ()=> {
            // input fields should be there now...
            expect(el.find('form').children.length > 0).toBe(true);
            ctrl.model.inputs.problem = inputFile;
            ctrl.onSubmit({ $valid: true });
            expect(jobSpy.calls.mostRecent().args[0].inputs.problem).toBe(inputFile);
            expect(jobSpy.calls.mostRecent().args[0].appId).toBe(appDefn.id);
            expect(jobSpy.calls.mostRecent().args[0].name).toMatch(appDefn.name);
            done();
        }, 10);
    });

    it('Should alter the name of DCV jobs when handling submit', (done)=>{
        // Add DCV tag to definition
        appMeta.value.definition.tags.push('DCV');

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
            expect(jobSpy.calls.mostRecent().args[0].name).toMatch(appDefn.name);
            expect(jobSpy.calls.mostRecent().args[0].name).toMatch('dcvserver');
            done();
        }, 10);
    });

    it('Should open the push keys modal if new exec system needs keys', () => {
        let sys = { id: 'test.cloned.FORK.exec.stampede2.CLI' };

        spyOn(Jobs, 'submit').and.callFake(() => {
            return {
                then: function(callback) {
                    return callback({ execSys: sys });
                },
            };
        });

        spyOn(SystemsService, 'get').and.callFake(() => {
            return {
                then: function(callback) {
                    return callback(sys);
                },
            };
        });

        spyOn(ctrl, 'openPushPublicKeyForm').and.callThrough();

        let mockModal = {
            result: $q.when(),
        };
        spyOn($uibModal, 'open').and.returnValue(mockModal);

        ctrl.app = appDefn;
        ctrl.submitJob();

        expect(ctrl.openPushPublicKeyForm).toHaveBeenCalledWith(sys.id);
        expect(SystemsService.get).toHaveBeenCalledWith(sys.id);
        expect($uibModal.open).toHaveBeenCalled();
    });

    it('Should call SystemsService.resetKeys', () => {
        expect(ctrl.openResetSystemKeysForm).toBeDefined();

        spyOn(SystemsService, 'resetKeys').and.returnValue($q.when());
        let sys = { id: 1 };

        ctrl.app = appDefn;
        ctrl.openResetSystemKeysForm(sys.id);
        expect(SystemsService.resetKeys).toHaveBeenCalledWith(sys);
    });

    it('Should not include processorsPerNode or nodeCount if SERIAL', () => {
        let jobSpy = spyOn(Jobs, 'submit').and.returnValue($q.when({}));
        let scope = $rootScope.$new();
        scope.app = appMeta;

        let inputFile = 'agave://some-system/some-file.plan',
            template = angular.element('<app-form selected-app=app></app-form>'),
            el = $compile(template)(scope);
        let ctrl = el.controller('app-form');
        $rootScope.$digest();

        // Have to put this in a timeOut to work around ASF issue
        setTimeout(() => {
            // input fields should be there now...
            expect(el.find('form').children.length > 0).toBe(true);
            ctrl.model.inputs.problem = inputFile;
            ctrl.onSubmit({ $valid: true });
            expect(jobSpy.calls.mostRecent().args[0].inputs.problem).toBe(inputFile);
            expect(jobSpy.calls.mostRecent().args[0].appId).toBe(appDefn.id);
            expect(jobSpy.calls.mostRecent().args[0].name).toMatch(appDefn.name);
            expect(jobSpy.calls.mostRecent().args[0].processorsPerNode).not.toBeDefined();
            expect(jobSpy.calls.mostRecent().args[0].nodeCount).not.toBeDefined();
            done();
        }, 10);
    });

    // TODO: Add test for bourbon prize, i.e. when there are a variable number of
    // fields in the form.
});
