import { fetchUtil } from 'utils/fetchUtil';
import { call, put, takeLeading } from 'redux-saga/effects';

export async function fetchAuthenticatedUserUtil() {
  const result = await fetchUtil({ url: '/api/users/auth/' });
  return result;
}

export function* getAuthenticatedUser() {
  try {
    const userJson = yield call(fetchAuthenticatedUserUtil);
    yield put({ type: 'AUTHENTICATED_USER_SUCCESS', payload: userJson });
  } catch (error) {
    yield put({
      type: 'AUTHENTICATED_USER_ERROR',
      payload: error
    });
  }
}

export function* watchAuthenticatedUser() {
  yield takeLeading('FETCH_AUTHENTICATED_USER', getAuthenticatedUser);
}
