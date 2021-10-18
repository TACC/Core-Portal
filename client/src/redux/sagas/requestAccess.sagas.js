import { put, call } from 'redux-saga/effects';
import Cookies from 'js-cookie';
import 'cross-fetch';

export function* postRequestAccess(action) {
  yield put({ type: 'REQUEST_ACCESS_STARTED' });
  try {
    const res = yield call(fetch, `/api/request_access/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken')
      },
      credentials: 'same-origin',
      body: action.payload.formData
    });
    const json = yield res.json();
    if (!res.ok) {
      yield put({
        type: 'REQUEST_ACCESS_FAILED',
        payload: json.message
      });
    } else {
      yield put({
        type: 'REQUEST_ACCESS_SUCCESS',
        payload: json.ticket_id
      });

      action.payload.resetSubmittedForm();
    }
  } catch {
    yield put({
      type: 'REQUEST_ACCESS_FAILED',
      payload: 'Unknown error occurred'
    });
  }
}

export function* watchPostRequestAccessCreate() {
  yield takeLatest('REQUEST_ACCESS_CREATE', postTicketCreate);
}
