import jobsStatusUpdateData from '../fixtures/jobs-status-update.json';
import interactiveNotificationData from '../fixtures/interactive-notification.json';

describe('Notifications', function() {
    let Notifications,
        $location,
        $mdToast,
        $http,
        $uibModal,
        $rootScope,
        $q,
        $httpBackend,
        fakePromise,
        notes;

    beforeEach(angular.mock.module('portal'));

    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });

        angular.mock.inject((
            _Notifications_,
            _$location_,
            _$mdToast_,
            _$http_,
            _$uibModal_,
            _$rootScope_,
            _$q_,
            _$httpBackend_
        ) => {
            Notifications = _Notifications_;
            $location = _$location_;
            $mdToast = _$mdToast_;
            $http = _$http_;
            $uibModal = _$uibModal_;
            $rootScope = _$rootScope_;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
        });

        Notifications.toasting = true;
        fakePromise = $q.when();

        notes = {
            notifs: [jobsStatusUpdateData],
            page: 0,
            total: 1,
            unread: 1,
        };
        $httpBackend.whenGET('/api/notifications/').respond(200, notes);
        spyOn(Notifications, 'list').and.callFake(() => {
            return {
                then: function(callback) {
                    return callback(notes);
                },
            };
        });
    });

    it('Should have right methods', function() {
        expect(Notifications.list).toBeDefined();
        expect(Notifications.delete).toBeDefined();
        expect(Notifications.markRead).toBeDefined();
        expect(Notifications.processMessage).toBeDefined();
        expect(Notifications.showToast).toBeDefined();
    });

    it('should process a notification from websocket subscription', () => {
        fakePromise = $q.when();
        spyOn(Notifications, 'showToast').and.returnValue(fakePromise);
        Notifications.list().then((resp) => {
            Notifications.notes = resp;
        });

        let unread = Notifications.notes.unread;
        Notifications.processMessage(jobsStatusUpdateData);

        expect(Notifications.notes.unread).toEqual(unread+1);
        expect(Notifications.showToast).toHaveBeenCalled();
    });

    it('should list unread notifications', () => {
        let response,
            data = {
                notifs: [jobsStatusUpdateData],
                page: 0,
                total: 1,
                unread: 1,
            };
        $httpBackend.whenGET('/api/notifications/').respond(200, data);

        Notifications.list().then((resp) => {
            response = resp;
        });
        $httpBackend.flush();

        expect(response).not.toBeUndefined();
        expect(response.notifs.length).toEqual(1);
        expect(response.notifs[0].extra.id).toEqual(data.notifs[0].extra.id);
    });

    it('should handle a delete request', () => {
        let response;
        $httpBackend.whenDELETE('/api/notifications/delete/all').respond(200);

        Notifications.delete('all').then((resp) => {
            response = resp;
        });
        $httpBackend.flush();
        expect(response.status).toEqual(200);
    });

    it('should handle a markRead request', () => {
        let response;
        $httpBackend.whenPOST('/api/notifications/').respond(200);

        Notifications.markRead('all').then((resp) => {
            response = resp;
        });
        $httpBackend.flush();
        expect(response.status).toEqual(200);
    });

    it('should show a toast on job_status change', () => {
        spyOn($mdToast, 'show').and.returnValue(fakePromise);

        Notifications.showToast(jobsStatusUpdateData);

        expect($mdToast.show).toHaveBeenCalled();
    });

    it('should expect processors events to be functions', () => {
        expect(Notifications.processors).toBeDefined();
        expect(typeof Notifications.processors).toEqual('object');
        
        Object.values(Notifications.processors).forEach((processor) => {
            expect(processor.process).toBeDefined();
            expect(typeof processor.process).toEqual('function');
        });
    });

    it('should show a modal on interactive notification', () => {
        let mockModal = {
            result: fakePromise,
        };
        fakePromise = $q.when(),
        spyOn($uibModal, 'open').and.returnValue(mockModal);
        Notifications.list().then((resp) => {
            Notifications.notes = resp;
        });

        Notifications.processMessage(interactiveNotificationData);
        expect($uibModal.open).toHaveBeenCalled();
    });
});
