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
import { onboardingAdminList as onboardingAdminListFixture} from './fixtures/onboarding.fixture';
import { initialState, onboardingAdminList } from '../reducers/onboarding.reducers';

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
