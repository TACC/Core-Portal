import { expectSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';

import {
  fetchOnboardingAdminList,
  getOnboardingAdminList,
  fetchOnboardingAdminIndividualUser,
  getOnboardingAdminIndividualUser
} from './onboarding.sagas';
import {
  onboardingAdminList as onboardingAdminListFixture,
  onboardingAdminIndividualUser as onboardingAdminIndividualUserFixture
} from './fixtures/onboarding.fixture';
import {
  onboardingAdminList,
  onboardingAdminIndividualUser
} from '../reducers/onboarding.reducers';

jest.mock('cross-fetch');

describe('getOnboardingAdminList Saga', () => {
  it('should fetch list of onboarding users and transform state', () =>
    expectSaga(getOnboardingAdminList)
      .withReducer(onboardingAdminList)
      .provide([
        [matchers.call.fn(fetchOnboardingAdminList), onboardingAdminListFixture]
      ])
      .put({ type: 'FETCH_ONBOARDING_ADMIN_LIST_PROCESSING' })
      .call(fetchOnboardingAdminList)
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_LIST_SUCCESS',
        payload: {
          users: onboardingAdminListFixture.users
        }
      })
      .hasFinalState({
        users: onboardingAdminListFixture.users,
        loading: false,
        error: null
      })
      .run());
});

describe('getOnboardingAdminIndividualUser Saga', () => {
  it('should fetch sucessfully onboarded user and transform state', () =>
    expectSaga(getOnboardingAdminIndividualUser, {
      payload: { user: 'username' }
    })
      .withReducer(onboardingAdminIndividualUser)
      .provide([
        [
          matchers.call.fn(fetchOnboardingAdminIndividualUser),
          onboardingAdminIndividualUserFixture
        ]
      ])
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_PROCESSING'
      })
      .call(fetchOnboardingAdminIndividualUser, 'username')
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_SUCCESS',
        payload: onboardingAdminIndividualUserFixture
      })
      .hasFinalState({
        user: onboardingAdminIndividualUserFixture,
        loading: false,
        error: null
      })
      .run());
});
