import { put, takeLatest, takeEvery, call, all } from 'redux-saga/effects';
import 'cross-fetch';

function* getJobs(action) {
  yield put({ type: 'FLUSH_JOBS' });
  yield put({ type: 'SHOW_SPINNER' });
  const url = new URL('/api/workspace/jobs', window.location.origin);
  Object.keys(action.params).forEach(key =>
    url.searchParams.append(key, action.params[key])
  );
  try {
    const res = yield call(fetch, url, {
      credentials: 'same-origin',
      ...action.options
    });
    const json = yield res.json();
    yield put({ type: 'ADD_JOBS', payload: json.response });
    yield put({ type: 'HIDE_SPINNER' });
  } catch {
    yield put({ type: 'ADD_JOBS', payload: [{ error: 'err!' }] });
    yield put({ type: 'HIDE_SPINNER' });
  }
}

function* getAllocations(action) {
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

export function* watchJobs() {
  yield takeLatest('GET_JOBS', getJobs);
}

export function* watchAllocations() {
  yield takeEvery('GET_ALLOCATIONS', getAllocations);
}

export default function* rootSaga() {
  yield all([watchJobs(), watchAllocations()]);
}
