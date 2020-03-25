import { agaveApp as appDefn } from '../fixtures/app';
import { meta as appMeta } from '../fixtures/appMeta';
import { compressApp } from '../fixtures/compressApp';
import { compressSchema } from '../fixtures/compressSchema';
import { executionSystem } from '../fixtures/executionSystem';

describe('AppsService', function() {
    let $q, Apps, $rootScope, $httpBackend, $translate, $scope;

    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject(
            (_$rootScope_, _Apps_, _$q_, _$httpBackend_, _$translate_) => {
                Apps = _Apps_;
                $scope = _$rootScope_.$new();
                $q = _$q_;
                $httpBackend = _$httpBackend_;
                $translate = _$translate_;
            }
        );
    });

    it('should instantiate', () => {
        expect(Apps).toBeDefined();
    });

    it('should get an app definition', () => {
        $httpBackend.whenGET('/api/workspace/apps?app_id=xplan').respond(200, appDefn);
        Apps.get('xplan').then(
            (result) => {
                expect(result.data).toEqual(appDefn);
            }
        );
        $httpBackend.flush();
    });

    it('should get app metadata', () => {
        $httpBackend.whenGET('/api/workspace/meta?app_id=xplan').respond(200, appMeta);
        Apps.getMeta('xplan').then(
            (result) => {
                expect(result.data).toEqual(appMeta);
            }
        );
        $httpBackend.flush();
    });

    it('should get public apps', () => {
        let mockResponse = 'publicApps';
        $httpBackend.whenGET('/api/workspace/apps?publicOnly=true').respond(200, mockResponse);
        Apps.getPublic().then(
            (result) => {
                expect(result.data).toEqual(mockResponse);
            }
        );
        $httpBackend.flush();
    });

    it('should return a date string', () => {
        let result = Apps.getDateString();
        let regex = /(\d{$4})-(\d+)-(\d+)T(\d{2}):(\d{2}):(\d{2})/;
        expect(result.match(regex)).toBeDefined();
    });

    it('should create an ASF schema for an app', () => {
        spyOn(Apps, 'getDateString').and.returnValue('2019-01-01T00:00:00');
        compressApp.exec_sys = executionSystem;
        expect(Apps.formSchema(compressApp)).toEqual(compressSchema);
    });

});
