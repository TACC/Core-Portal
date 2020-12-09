import { call, takeLatest, put } from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';
import Cookies from 'js-cookie';

// Admin listing of all users
export async function fetchOnboardingAdminList() {
  const result = await fetchUtil({
    url: 'api/onboarding/admin/'
  });
  return result;
}

export function* getOnboardingAdminList() {
  yield put({ type: 'FETCH_ONBOARDING_ADMIN_LIST_PROCESSING' });
  try {
    const adminList = yield call(fetchOnboardingAdminList);
    yield put({
      type: 'FETCH_ONBOARDING_ADMIN_LIST_SUCCESS',
      payload: adminList
    });
  } catch (error) {
    yield put({ type: 'FETCH_ONBOARDING_ADMIN_LIST_ERROR', payload: error });
  }
}

export function* watchOnboardingAdminList() {
  yield takeLatest('FETCH_ONBOARDING_ADMIN_LIST', getOnboardingAdminList);
}

// Admin list of a single user
export async function fetchOnboardingAdminIndividualUser(username) {
  const result = await fetchUtil({
    url: `/api/onboarding/user/${username ? `${username}/` : ``}`
  });
  return result;
}

export function* getOnboardingAdminIndividualUser(action) {
  const username = action.payload.user || '';
  yield put({ type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_PROCESSING' });
  try {
    const onboardingUser = yield call(
      fetchOnboardingAdminIndividualUser,
      username
    );
    yield put({
      type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_SUCCESS',
      payload: onboardingUser
    });
  } catch (error) {
    yield put({
      type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_ERROR',
      payload: error
    });
  }
}

export function* watchOnboardingAdminIndividualUser(action) {
  yield takeLatest(
    'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER',
    getOnboardingAdminIndividualUser
  );
}

// Send onboarding action for user
export async function sendOnboardingAction(username, step, action) {
  const result = await fetchUtil({
    url: `api/onboarding/user/${username ? `${username}/` : ``}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken')
    },
    body: JSON.stringify({ step, action })
  });
  return result;
}

export function* postOnboardingAction(action) {
  const { username } = action.payload;
  const { step } = action.payload;
  const sentAction = action.payload.action;
  yield put({
    type: 'POST_ONBOARDING_ACTION_PROCESSING',
    payload: { step, action: sentAction, username }
  });
  try {
    const result = yield call(sendOnboardingAction, username, step, sentAction);
    yield put({
      type: 'POST_ONBOARDING_ACTION_SUCCESS',
      payload: result
    });
  } catch (error) {
    yield put({
      type: 'POST_ONBOARDING_ACTION_ERROR',
      payload: { error }
    });
  }
}

export function* watchOnboardingAction(action) {
  yield takeLatest('POST_ONBOARDING_ACTION', postOnboardingAction);
}
