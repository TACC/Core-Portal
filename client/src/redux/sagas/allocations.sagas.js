import { put, takeEvery, call } from 'redux-saga/effects';
import 'cross-fetch';

export function* watchAllocations() {
  yield takeEvery('GET_ALLOCATIONS', getAllocations);
}

export function* getAllocations(action) {
  yield put({ type: 'REFRESH_ALLOCATIONS' });
  yield put({ type: 'SHOW_SPINNER' });
  try {
    const res = yield call(fetch, '/api/users/allocations', {
      credentials: 'same-origin',
      ...action.options
    });
    const json = yield res.json();
    yield put({ type: 'ADD_ALLOCATIONS', payload: json });
    yield put({ type: 'HIDE_SPINNER' });
  } catch (error) {
    const json = { error };
    yield put({ type: 'ADD_ALLOCATIONS', payload: json });
    yield put({ type: 'HIDE_SPINNER' });
  }
}
