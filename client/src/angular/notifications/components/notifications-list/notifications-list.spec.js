import { notificationsFixture as notifs } from '../../fixtures/notifications-list.fixture';

describe('NotificationsListCtrl', function() {
    var Notifications, controller, $q;
    beforeEach(angular.mock.module('portal'));
    beforeEach(() => {
        angular.mock.inject(function($rootScope, $componentController, _Notifications_) {
            Notifications = _Notifications_;
            controller = $componentController('notificationsList', { Notifications: Notifications });
        });
    });

    it('Should have a delete method', function() {
        expect(controller.delete).toBeDefined();
    });

    it('Should filter notifications', function() {
        // Load fixtures
        Notifications.notes.notifs = notifs;

        // When notifications == "All", there should be 9 notes
        controller.notificationType = controller.notificationTypes[0];
        expect(controller.notes().length).toEqual(9);

        // Make some test cases with a label and number of expected results in fixture
        let testCases = [
            {
                label: "Interactive",
                count: 2
            },
            {
                label: "Success",
                count: 1
            },
            {
                label: "Running",
                count: 1
            },
            {
                label: "Processing",
                count: 4
            },
            {
                label: "Pending",
                count: 1
            }
        ]

        // Run test cases
        testCases.forEach(
            (testCase) => {
                // Select a notification type for which to filter
                controller.notificationType = controller.notificationTypes.find(
                    (notificationType) => {
                        return notificationType.label === testCase.label;
                    }
                )
                expect(controller.notificationType).toBeTruthy();

                // Filter notifications in test fixture
                let result = controller.notes();
                
                // Make sure number of results match
                expect(result.length).toEqual(testCase.count);

                // Make sure fixture results match the label chosen in the test case
                expect(result.every((notif) => notif.label === testCase.label )).toEqual(true);
            }
        );
    });

    it('should handle a delete', angular.mock.inject(($q) => {
        var fakePromise = $q.when(),
            note = { pk: 1 };
        spyOn(Notifications, 'delete').and.returnValue(fakePromise);
        controller.delete(note.pk);
        expect(Notifications.delete).toHaveBeenCalledWith(1);
    }));

    it('should have a service attached to it', () => {
        expect(controller.service).toBeDefined();
    });
});
