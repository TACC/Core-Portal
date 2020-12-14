import {
  getNumberOfUnreadNotifications,
  getNumberOfUnreadJobNotifications
} from './notifications.js';
import { notificationsListEmptyFixture, notificationsListFixture } from '../redux/sagas/fixtures/notificationsList.fixture';

describe('notifications utility', () => {
  it('get number of unread notifications', () => {
    expect(notificationsListEmptyFixture.unread).toEqual(0);
    expect(getNumberOfUnreadNotifications(notificationsListEmptyFixture.notifs)).toEqual(0);
    expect(getNumberOfUnreadJobNotifications(notificationsListEmptyFixture.notifs)).toEqual(0);

    expect(notificationsListFixture.unread).toEqual(8);
    expect(getNumberOfUnreadNotifications(notificationsListFixture.notifs)).toEqual(1);
    expect(getNumberOfUnreadJobNotifications(notificationsListFixture.notifs)).toEqual(1);
  });
});