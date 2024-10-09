import { expectSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';
import { vi } from 'vitest';

import {
  fetchOnboardingAdminList,
  getOnboardingAdminList,
  fetchOnboardingAdminIndividualUser,
  getOnboardingAdminIndividualUser,
  postOnboardingAction,
  sendOnboardingAction,
} from './onboarding.sagas';
import {
  onboardingAdminFixture,
  onboardingUserFixture,
  onboardingAdminState,
  onboardingUserState,
  onboardingActionState,
} from './fixtures/onboarding.fixture';
import { onboarding } from '../reducers/onboarding.reducers';

vi.mock('cross-fetch');

describe('getOnboardingAdminList Saga', () => {
  it('should fetch list of onboarding users and transform state', () =>
    expectSaga(getOnboardingAdminList, {
      payload: {
        offset: 0,
        limit: 25,
        query: 'query',
        showIncompleteOnly: true,
      },
    })
      .withReducer(onboarding)
      .provide([
        [matchers.call.fn(fetchOnboardingAdminList), onboardingAdminFixture],
      ])
      .put({ type: 'FETCH_ONBOARDING_ADMIN_LIST_PROCESSING' })
      .call(fetchOnboardingAdminList, 0, 25, 'query', true)
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_LIST_SUCCESS',
        payload: {
          users: onboardingAdminFixture.users,
          offset: 0,
          limit: 25,
          query: 'query',
          total: 1,
        },
      })
      .hasFinalState(onboardingAdminState)
      .run());
});

describe('getOnboardingAdminIndividualUser Saga', () => {
  it('should fetch sucessfully onboarded user and transform state', () =>
    expectSaga(getOnboardingAdminIndividualUser, {
      payload: { user: 'username' },
    })
      .withReducer(onboarding)
      .provide([
        [
          matchers.call.fn(fetchOnboardingAdminIndividualUser),
          onboardingUserFixture,
        ],
      ])
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_PROCESSING',
      })
      .call(fetchOnboardingAdminIndividualUser, 'username')
      .put({
        type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_SUCCESS',
        payload: onboardingUserFixture,
      })
      .hasFinalState(onboardingUserState)
      .run());
});

describe('postOnboarding Saga', () => {
  it('should send onboarding actions to back end', () =>
    expectSaga(postOnboardingAction, {
      payload: {
        step: 'onboarding.step',
        action: 'user_confirm',
        username: 'username',
      },
    })
      .withReducer(onboarding)
      .provide([
        [
          matchers.call.fn(sendOnboardingAction),
          {
            response: 'OK',
          },
        ],
      ])
      .put({
        type: 'POST_ONBOARDING_ACTION_PROCESSING',
        payload: {
          step: 'onboarding.step',
          action: 'user_confirm',
          username: 'username',
        },
      })
      .call(sendOnboardingAction, 'username', 'onboarding.step', 'user_confirm')
      .put({
        type: 'POST_ONBOARDING_ACTION_SUCCESS',
        payload: { response: 'OK' },
      })
      .hasFinalState(onboardingActionState)
      .run());
});
