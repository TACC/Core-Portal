import {system_response} from './fixtures/system-response';
import {listing_response} from './fixtures/listing-response';
import {list_response} from './fixtures/list-response';
import {test_response} from './fixtures/test-response';
import {reset_response} from './fixtures/reset-response';
import {push_response} from './fixtures/push-response';
import {list_roles_response} from './fixtures/list-roles-response';
import {system_roles_response} from './fixtures/system-roles-response';
import {user_role_response} from './fixtures/user-role-response';
import {update_role_response} from './fixtures/update-role-response';

describe("SystemsService", function() {
    var SystemsService, $httpBackend, $scope;
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(function(_$httpBackend_, _SystemsService_, _$rootScope_) {
            SystemsService = _SystemsService_;
            $httpBackend = _$httpBackend_;
            $scope = _$rootScope_.$new();
            $scope.$apply();
        });
    });

    it("Should have right methods", function() {
        expect(SystemsService.get).toBeDefined();
        expect(SystemsService.listing).toBeDefined();
        expect(SystemsService.list).toBeDefined();
        expect(SystemsService.test).toBeDefined();
        expect(SystemsService.resetKeys).toBeDefined();
        expect(SystemsService.pushKeys).toBeDefined();
        expect(SystemsService.listRoles).toBeDefined();
        expect(SystemsService.getSystemRoles).toBeDefined();
        expect(SystemsService.getRoleForUser).toBeDefined();
        expect(SystemsService.updateRole).toBeDefined();
    });

    it("should handle a get request", () => {
        var httpResponse;
        let data = system_response;

        $httpBackend.whenGET('/api/accounts/systems/test.storage.system').respond(200, data);
        SystemsService.get('test.storage.system').then( (resp) => {
            httpResponse = resp;
        });

        $httpBackend.flush();
        $scope.$digest();
        expect(httpResponse).toEqual(data.response);
    });

    it("should handle a listing request", () => {
        var httpResponse;
        let data = listing_response;

        $httpBackend.whenGET('/api/data-depot/systems/list').respond(200, data);
        SystemsService.listing().then( (resp) => {
            httpResponse = resp;
        });

        $httpBackend.flush();
        $scope.$digest();
        expect(httpResponse).toEqual(data.response);

    });

    it("should handle a list request", () => {
        var httpResponse;
        //TODO: Put in extra storage systems in response for this test
        let data = list_response;

        $httpBackend.whenGET('/api/accounts/systems/list?publicKey&limit=100&offset=0&publicKeys=true&thisPortal=true').respond(200, data);
        SystemsService.list().then( (resp) => {
            httpResponse = resp;
        });

        $httpBackend.flush();
        $scope.$digest();
        expect(httpResponse).toEqual(data.response);
    });

    it("should handle a test keys request", () => {
        var httpResponse;
        let data = test_response;

        $httpBackend.whenPUT('/api/accounts/systems/test.system/test').respond(200, data);
        SystemsService.test({id:'test.system'}).then( (resp) => {
            httpResponse = resp;
        });

        $httpBackend.flush();
        $scope.$digest();
        expect(httpResponse).toEqual(data);
    });

    it("should handle a reset keys request", () => {
        var httpResponse;
        let data = reset_response;

        //TODO: is there a way to test the "action: reset" part of the query?
        $httpBackend.whenPUT('/api/accounts/systems/test.system/keys').respond(200, data);
        SystemsService.resetKeys({id:'test.system'}).then( (resp) => {
            httpResponse = resp;
        });

        $httpBackend.flush();
        $scope.$digest();
        expect(httpResponse).toEqual(data);
    });

    it("should handle a push keys request", () => {
        var httpResponse;
        let data = push_response;
        let form = {
            hostname: 'data.tacc.utexas.edu',
            password: 'password',
            token: '123456'
        };

        //TODO: is there a way to test the "action: push and form:form" part of the query?
        $httpBackend.whenPUT('/api/accounts/systems/test.system/keys').respond(200, data);
        SystemsService.pushKeys('test.system',form).then( (resp) => {
            httpResponse = resp;
        });

        $httpBackend.flush();
        $scope.$digest();
        expect(httpResponse).toEqual(data);
    });

    it("should handle a list roles request", () => {
        var httpResponse;
        //TODO: need to fill out proper response structure in fixture
        let data = list_roles_response;

        //TODO: need to test error returning
        $httpBackend.whenGET('/api/accounts/systems/test.system/roles/').respond(200, data);
        SystemsService.listRoles('test.system').then( (resp) => {
            httpResponse = resp;
        });

        $httpBackend.flush();
        $scope.$digest();
        expect(httpResponse).toEqual(data.response);
    });

    it("should handle a getSystemRoles request", () => {
        var httpResponse;
        let data = system_roles_response;

        $httpBackend.whenGET('api/workspace/systems?roles=true&system_id=test.system').respond(200, data);
        SystemsService.getSystemRoles('test.system').then( (resp) => {
            httpResponse = resp;
        });

        $httpBackend.flush();
        $scope.$digest();
        expect(httpResponse.data).toEqual(data);
    });

    it("should handle a getRoleForUser request", () => {
        var httpResponse;
        let data = user_role_response;

        $httpBackend.whenGET('api/workspace/systems?user_role=true&system_id=test.system').respond(200, data);
        SystemsService.getRoleForUser('test.system').then( (resp) => {
            httpResponse = resp;
        });

        $httpBackend.flush();
        $scope.$digest();
        expect(httpResponse.data).toEqual(data);
    });

    it("should handle a updateRole request", () => {
        var httpResponse;
        let data = update_role_response;

        $httpBackend.whenPOST('api/workspace/systems').respond(200, data);
        SystemsService.updateRole('test.system','role').then( (resp) => {
            httpResponse = resp;
        });

        $httpBackend.flush();
        $scope.$digest();
        expect(httpResponse.data).toEqual(data);
    });
});