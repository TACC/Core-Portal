import { put, call, takeLatest } from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';

function* getSystemMonitor(action) {
  yield put({ type: 'SYSTEM_MONITOR_LOAD' });
  try {
    const result = yield call(fetchUtil, {
      url: '/api/system-monitor/',
    });

    result.sort((a, b) => a.display_name.localeCompare(b.display_name));

    yield put({ type: 'SYSTEM_MONITOR_SUCCESS', payload: result });
  } catch (error) {
    yield put({
      type: 'SYSTEM_MONITOR_ERROR',
      payload: error,
    });
  }
}

export default function* watchSystemMonitor() {
  yield takeLatest('GET_SYSTEM_MONITOR', getSystemMonitor);
}
