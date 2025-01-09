import fetch from 'cross-fetch';
import { expectSaga, testSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import * as matchers from 'redux-saga-test-plan/matchers';
import { vi } from 'vitest';
import { fetchUtil } from '../../utils/fetchUtil';
import profileReducer, { initialState } from '../reducers/profile.reducers';
import {
  getPasswordStatus,
  getProfileData,
  watchProfileData,
} from './profile.sagas';

vi.mock('cross-fetch');

describe('Utility Functions', () => {
  it('should get the last date the password was changed', () => {
    const historyFixture = [
      {
        actor: 'Test User',
        comment: 'Password changed by user.',
        status: 'Active',
        timestamp: '2020-06-01T12:00:08Z',
      },
    ];
    expect(getPasswordStatus(historyFixture)).toBeDefined();
    expect(getPasswordStatus(historyFixture)).toEqual('6/1/2020');
  });

  it("should return empty string if the user's password has never been changed", () => {
    const historyFixture = [
      {
        actor: 'Test User',
        comment: 'User reqested account',
        status: 'PendingEmailConfirmation',
        timestamp: '2020-06-01T12:00:08Z',
      },
    ];
    expect(getPasswordStatus(historyFixture)).toBeDefined();
    expect(getPasswordStatus(historyFixture)).toEqual('');
  });
});

describe('getProfileData Saga', () => {
  const fakeProfileData = {
    demographics: {},
    integrations: {},
    licenses: [],
    passwordLastChanged: '6/1/2020',
  };

  it("should fetch a user's profile data and add it to the state", () =>
    expectSaga(getProfileData)
      .withReducer(profileReducer)

      .provide([
        [
          matchers.call.fn(fetchUtil, { url: '/accounts/api/profile/data/' }),
          {
            demographics: {},
            history: [
              {
                actor: 'Test User',
                comment: 'Password changed by user.',
                status: 'Active',
                timestamp: '2020-06-01T12:00:08Z',
              },
            ],
            integrations: {},
            licenses: [],
          },
        ],
      ])
      .put({ type: 'LOAD_PROFILE_DATA' })
      .call(fetchUtil, { url: '/accounts/api/profile/data/' })
      .put({
        type: 'ADD_DATA',
        payload: fakeProfileData,
      })
      .hasFinalState({
        ...initialState,
        isLoading: false,
        data: fakeProfileData,
      })
      .run());

  it('should handle errors and store them in the state', () => {
    const fakeError = new Error('Unable to fetch profile data');
    return expectSaga(getProfileData)
      .withReducer(profileReducer)
      .provide([
        [
          matchers.call.fn(fetchUtil, { url: '/accounts/api/profile/data/' }),
          throwError(fakeError),
        ],
      ])
      .call(fetchUtil, { url: '/accounts/api/profile/data/' })
      .put({ type: 'ADD_DATA_ERROR', payload: fakeError })
      .hasFinalState({
        ...initialState,
        isLoading: false,
        errors: {
          data: fakeError,
        },
      })
      .run();
  });
});
