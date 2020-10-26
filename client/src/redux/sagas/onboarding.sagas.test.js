import { expectSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';

import {
  fetchOnboardingAdminList,
  getOnboardingAdminList,
  fetchOnboardingAdminIndividualUser,
  getOnboardingAdminIndividualUser
} from './onboarding.sagas';
import {
  onboardingAdminFixture,
  onboardingUserFixture,
  onboardingAdminState,
  onboardingUserState
} from './fixtures/onboarding.fixture';
import { onboarding } from '../reducers/onboarding.reducers';

jest.mock('cross-fetch');

describe('getOnboardingAdminList Saga', () => {
  it('should fetch list of onboarding users and transform state', () =>
    expectSaga(getOnboardingAdminList)
      .withReducer(onboarding)
      .provide([
        [matchers.call.fn(fetchOnboardingAdminList), onboardingAdminFixture]
      ])
      .put({ type: 'FETCH_ONBOARDING_ADMIN_LIST_PROCESSING' })
      .call(fetchOnboardingAdminList)
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_LIST_SUCCESS',
        payload: {
          users: onboardingAdminFixture.users
        }
      })
      .hasFinalState(onboardingAdminState)
      .run());
});

describe('getOnboardingAdminIndividualUser Saga', () => {
  it('should fetch sucessfully onboarded user and transform state', () =>
    expectSaga(getOnboardingAdminIndividualUser, {
      payload: { user: 'username' }
    })
      .withReducer(onboarding)
      .provide([
        [
          matchers.call.fn(fetchOnboardingAdminIndividualUser),
          onboardingUserFixture
        ]
      ])
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_PROCESSING'
      })
      .call(fetchOnboardingAdminIndividualUser, 'username')
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_SUCCESS',
        payload: onboardingUserFixture
      })
      .hasFinalState(onboardingUserState)
      .run());
});