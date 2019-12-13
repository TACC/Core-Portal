import { put, takeLatest, call, all } from 'redux-saga/effects';
import 'cross-fetch';


function* getJobs(action) {
  yield put({ type: 'FLUSH_JOBS' });
  yield put({ type: 'SHOW_SPINNER' });
  const url = new URL('/api/workspace/jobs', window.location.origin);
  Object.keys(action.params).forEach(key => url.searchParams.append(key, action.params[key]));
  try {
    const res = yield call(
      fetch,
      url,
      { credentials: 'same-origin', ...action.options }
    );
    const json = yield res.json();
    yield put({ type: 'ADD_JOBS', payload: json.response });
    yield put({ type: 'HIDE_SPINNER' });
  } catch {
    yield put({ type: 'ADD_JOBS', payload: [{error:'err!'}] });
    yield put({ type: 'HIDE_SPINNER' });
  }
}

export function* watchJobs() {
  yield takeLatest('GET_JOBS', getJobs);
}

export default function* rootSaga() {
  yield all([
    watchJobs(),
  ]);
}
