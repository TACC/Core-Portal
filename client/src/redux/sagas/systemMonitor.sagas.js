import { put, call, all, takeLatest } from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';

function* getSystemQueues(system) {
  try {
    const queues = yield call(fetchUtil, {
      url: `/api/system-monitor/${encodeURIComponent(system.hostname)}`,
    });
    return { ...system, queues };
  } catch {
    // Queue availability is advisory; preserve the system summary on failure.
    return { ...system, queues: [] };
  }
}

export function* getSystemMonitor(action) {
  yield put({ type: 'SYSTEM_MONITOR_LOAD' });
  try {
    const result = yield call(fetchUtil, {
      url: '/api/system-monitor/',
    });

    result.sort((a, b) => a.display_name.localeCompare(b.display_name));

    // Show system availability immediately while queue details load.
    yield put({ type: 'SYSTEM_MONITOR_SUCCESS', payload: result });
    const systems = yield all(
      result.map((system) => call(getSystemQueues, system))
    );
    yield put({ type: 'SYSTEM_MONITOR_SUCCESS', payload: systems });
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
