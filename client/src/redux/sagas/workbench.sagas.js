import { fetchUtil } from 'utils/fetchUtil';
import { call, put, takeLeading } from 'redux-saga/effects';

export function* fetchWorkbench(action) {
  yield put({ type: 'WORKBENCH_INIT' });
  try {
    const res = yield call(fetchUtil, {
      url: `/api/workbench/`
    });
    yield put({
      type: 'WORKBENCH_SUCCESS',
      payload: res.response
    });
  } catch (error) {
    yield put({
      type: 'WORKBENCH_FAILURE'
    });
  }
}

export function* watchWorkbench() {
  yield takeLeading('FETCH_WORKBENCH', fetchWorkbench);
}
