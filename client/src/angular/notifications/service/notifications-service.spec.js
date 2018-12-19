import jobsStatusUpdateData from '../fixtures/jobs-status-update.json';
import interactiveNotificationData from '../fixtures/interactive-notification.json';

describe('Notifications', function() {
    let Notifications,
        $location,
        $mdToast,
        $http,
        $uibModal,
        $rootScope,
        JobsStatusCtrl,
        Jobs,
        $q,
        $httpBackend,
        fakePromise;

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
            // _JobsStatusCtrl_,
            _Jobs_,
            _$q_,
            _$httpBackend_
        ) => {
            Notifications = _Notifications_;
            $location = _$location_;
            $mdToast = _$mdToast_;
            $http = _$http_;
            $uibModal = _$uibModal_;
            $rootScope = _$rootScope_;
            // JobsStatusCtrl = _JobsStatusCtrl_;
            Jobs = _Jobs_;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
        });

        Notifications.toasting = true;
        fakePromise = $q.when();
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
        spyOn(Jobs, 'list').and.returnValue(fakePromise);
        spyOn(Notifications, 'list').and.returnValue(fakePromise);
        spyOn(Notifications, 'showToast').and.returnValue(fakePromise);

        Notifications.processMessage(jobsStatusUpdateData);

        expect(Notifications.list).toHaveBeenCalled();
        // expect(JobsStatusCtrl.refresh).toHaveBeenCalled();
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
        spyOn(Notifications, 'list').and.returnValue(fakePromise);
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

        Notifications.processMessage(interactiveNotificationData);
        expect($uibModal.open).toHaveBeenCalled();
    });
});
