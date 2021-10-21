import { fetchUtil } from 'utils/fetchUtil';
import { call, put, takeLeading } from 'redux-saga/effects';
import Cookies from 'js-cookie';

export function* fetchWorkbench(action) {
  const sitekey = yield call(fetch, `/api/tickets/sitekey`, {
    method: 'GET',
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken')
    },
    credentials: 'same-origin',
    body: action.payload
  });
  const jsonsitekey = yield sitekey.json();
  yield put({ type: 'WORKBENCH_INIT' });
  try {
    const res = yield call(fetchUtil, {
      url: `/api/workbench/`
    });
    yield put({
      type: 'WORKBENCH_SUCCESS',
      payload: { response: res.response, sitekey: jsonsitekey }
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
