import { put, takeLeading, call } from 'redux-saga/effects';
import 'cross-fetch';
import { fetchUtil } from 'utils/fetchUtil';

function* pushSystemKeys(action) {
  const form = {
    password: action.payload.password,
    token: action.payload.token,
    type: action.payload.type,
    hostname: action.payload.hostname
  };
  yield put({
    type: 'SYSTEMS_MODAL_UPDATE',
    payload: { operation: 'pushKeys', props: { submitting: true } }
  });
  try {
    yield call(fetchUtil, {
      url: `/api/accounts/systems/${action.payload.systemId}/keys/`,
      body: JSON.stringify({ form, action: 'push' }),
      method: 'PUT'
    });
    yield put({
      type: 'SYSTEMS_TOGGLE_MODAL',
      payload: {
        operation: 'pushKeys',
        props: {}
      }
    });
    if (action.payload.onSuccess) {
      yield put(action.payload.onSuccess);
    }
  } catch (error) {
    yield put({
      type: 'SYSTEMS_MODAL_UPDATE',
      payload: {
        operation: 'pushKeys',
        props: {
          error: { message: error.message, ...error },
          submitting: false
        }
      }
    });
  }
  yield call(action.payload.reloadCallback);
}

export default function* watchSystems() {
  yield takeLeading('SYSTEMS_PUSH_KEYS', pushSystemKeys);
}
