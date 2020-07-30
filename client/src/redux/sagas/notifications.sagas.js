import { call, takeEvery, takeLatest, put } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { fetchUtil } from 'utils/fetchUtil';

const createNotificationsSocket = () =>
  new ReconnectingWebSocket(`wss://${window.location.host}/ws/notifications/`);

function socketEmitter(socket) {
  return eventChannel(emit => {
    socket.addEventListener('message', e => {
      emit(JSON.parse(e.data));
    });
    return () => socket.close();
  });
}

export function* watchSocket() {
  const notificationsSocket = yield call(createNotificationsSocket);
  const socketChannel = yield call(socketEmitter, notificationsSocket);
  yield takeEvery(socketChannel, handleSocket);
}

export function* handleSocket(action) {
  let eventType = action.event_type.toLowerCase();
  if (eventType === 'vnc' || eventType === 'web') {
    eventType = 'interactive';
  }
  switch (eventType) {
    case 'interactive':
      yield put({ type: 'NEW_NOTIFICATION', payload: action });
      break;
    case 'job':
      yield put({ type: 'UPDATE_JOB_STATUS', payload: action });
      yield put({ type: 'NEW_NOTIFICATION', payload: action });
      break;
    case 'setup_event':
      break;
    default:
      yield put({ type: 'NEW_NOTIFICATION', payload: action });
  }
}

export function* fetchNotifications() {
  yield put({ type: 'NOTIFICATIONS_LIST_FETCH_START' });
  try {
    const res = yield call(fetchUtil, {
      url: '/api/notifications/'
    });
    yield put({
      type: 'NOTIFICATIONS_LIST_FETCH_SUCCESS',
      payload: res
    });
  } catch (error) {
    yield put({
      type: 'NOTIFICATIONS_LIST_FETCH_ERROR',
      payload: error
    });
  }
}

export function* readNotifications(action) {
  try {
    yield call(fetchUtil, {
      url: '/api/notifications/',
      method: 'PATCH',
      body: JSON.stringify(action.payload)
    });
  } catch (error) {
    yield put({
      type: 'NOTIFICATIONS_LIST_FETCH_ERROR',
      payload: error
    });
  }
  yield put({
    type: 'FETCH_NOTIFICATIONS'
  });
}

export function* deleteNotifications(action) {
  try {
    yield call(fetchUtil, {
      url: `/api/notifications/${action.payload}`,
      method: 'DELETE'
    });
  } catch (error) {
    yield put({
      type: 'NOTIFICATIONS_LIST_FETCH_ERROR',
      payload: error
    });
  }
  yield put({
    type: 'FETCH_NOTIFICATIONS'
  });
}

export function* watchFetchNotifications() {
  yield takeLatest('FETCH_NOTIFICATIONS', fetchNotifications);
  yield takeEvery('NOTIFICATIONS_DELETE', deleteNotifications);
  yield takeEvery('NOTIFICATIONS_READ', readNotifications);
}
