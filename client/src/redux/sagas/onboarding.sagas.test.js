import { expectSaga, testSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';

import {
  fetchOnboardingAdminList,
  getOnboardingAdminList,
  watchOnboardingAdminList,
  fetchOnboardingAdminIndividualUser,
  getOnboardingAdminIndividualUser,
  watchOnboardingAdminIndividualUser,
} from './onboarding.sagas';
import { onboardingAdminList as onboardingAdminListFixture,
         onboardingAdminIndividualUser as onboardingAdminIndividualUserFixture, 
        } from './fixtures/onboarding.fixture';
import { initialState, 
          onboardingAdminList, 
          initialUserState, 
          onboardingAdminIndividualUser } from '../reducers/onboarding.reducers';

jest.mock('cross-fetch');

describe('getOnboardingAdminList Saga', () => {
  it("should fetch list of onboarding users and transform state", () =>
    expectSaga(getOnboardingAdminList)
      .withReducer(onboardingAdminList)
      .provide([
        [matchers.call.fn(fetchOnboardingAdminList), onboardingAdminListFixture],
      ])
      .put({ type: 'FETCH_ONBOARDING_ADMIN_LIST_PROCESSING' })
      .call(fetchOnboardingAdminList)
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_LIST_SUCCESS',
        payload: {
          users: onboardingAdminListFixture.users,
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
  it("should fetch sucessfully onboarded user and transform state", () =>
    expectSaga(getOnboardingAdminIndividualUser, { payload: {user: onboardingAdminIndividualUserFixture.username}})
      .withReducer(onboardingAdminIndividualUser)
      .provide([
        [matchers.call.fn(fetchOnboardingAdminIndividualUser), onboardingAdminIndividualUser],
      ])
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_PROCESSING', payload: {
          user: onboardingAdminListFixture.username,
        }})
      .call(fetchOnboardingAdminIndividualUser, "username")
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_SUCCESS',
        payload: {
          user: onboardingAdminListFixture.username,
        }
      })
      .hasFinalState({
        user: onboardingAdminIndividualUserFixture.username,
        loading: false,
        error: null
      })
      .run());
});

/* describe('getOnboardingAdminIndividualUser Saga', () => {
  it("should fetch failed onboarded user and transform state", () =>
    expectSaga(getOnboardingAdminIndividualUser)
      .withReducer(onboardingAdminIndividualUser)
      .provide([
        [matchers.call.fn(fetchOnboardingAdminIndividualUser), onboardingAdminIndividualUser],
      ])
      .put({ type: 'FETCH_ONBOARDING_ADMIN_LIST_PROCESSING' })
      .call(fetchOnboardingAdminIndividualUser)
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_LIST_FAILED',
        payload: {
          user: onboardingAdminIndividualUserFixture,
        }
      })
      .hasFinalState({
        user: onboardingAdminListFixture,
        loading: false,
        error: null
      })
      .run());
}); */