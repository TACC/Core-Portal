import { put, call, takeLatest } from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';

function* getSystemMonitor(action) {
  yield put({ type: 'SYSTEM_MONITOR_LOAD' });
  try {
    const res = yield call(fetchUtil, {
      url: '/api/system-monitor/'
    });
    const json = yield res.json();
    yield put({ type: 'SYSTEM_MONITOR_ADD', payload: json });
  } catch (error) {
    yield put({
      type: 'SYSTEM_MONITOR_ERROR',
      payload: error
    });
  }
}

export default function* watchSystemMonitor() {
  yield takeLatest('GET_SYSTEM_MONITOR', getSystemMonitor);
}
