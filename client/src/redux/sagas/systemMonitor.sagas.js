import { put, call, takeLatest } from 'redux-saga/effects';
import 'cross-fetch';

function* getSystemMonitor(action) {
  yield put({ type: 'REFRESH_SYSTEM_MONITOR' });
  yield put({ type: 'LOAD_SYSTEM_MONITOR' });
  try {
    const res = yield call(fetch, '/api/system-monitor/', {
      credentials: 'same-origin',
      ...action.options
    });
    if (!res.ok) throw new Error('Something went wrong');
    const json = yield res.json();
    yield put({ type: 'ADD_SYSTEM_MONITOR', payload: json });
  } catch (error) {
    yield put({
      type: 'ADD_SYSTEM_MONITOR',
      payload: [],
      error: error.message
    });
  }
}

export default function* watchSystemMonitor() {
  yield takeLatest('GET_SYSTEM_MONITOR', getSystemMonitor);
}
