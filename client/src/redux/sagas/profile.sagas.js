import { put, takeLatest, call } from 'redux-saga/effects';
import 'cross-fetch';

export function* getProfileData(action) {
  try {
    const res = yield call(fetch, '/accounts/profile/data/', {
      credentials: 'same-origin',
      ...action.options
    });
    const json = yield res.json();
    const payload = yield Object.values(json).reduce(
      (obj, val) => ({ ...obj, ...val }),
      {}
    );
    yield put({ type: 'ADD_PROFILE_DATA', payload });
  } catch (error) {
    // TODO: Add error to state
    const payload = yield error;
    yield put({ type: 'ADD_PROFILE_ERROR', payload });
  }
}

export function* watchProfileData() {
  yield takeLatest('GET_PROFILE_DATA', getProfileData);
}
