import fetch from 'cross-fetch';
import { call, put, takeLeading } from 'redux-saga/effects';

export async function fetchAuthenticatedUserUtil() {
  const response = await fetch('/api/users/auth/');
  if (!response.ok) {
    throw new Error(response.status);
  }
  const responseJson = await response.json();
  return responseJson;
}

export function* getAuthenticatedUser() {
  const userJson = yield call(fetchAuthenticatedUserUtil);
  yield put({ type: 'AUTHENTICATED_USER_SUCCESS', payload: userJson });
}

export function* watchAuthenticatedUser() {
  yield takeLeading('FETCH_AUTHENTICATED_USER', getAuthenticatedUser);
}
