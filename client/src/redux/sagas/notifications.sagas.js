import {
  call,
  delay,
  fork,
  takeEvery,
  takeLatest,
  put,
  select,
} from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { fetchUtil } from 'utils/fetchUtil';
import { parse } from 'query-string';

export const createNotificationsSocket = () =>
  new ReconnectingWebSocket(`wss://${window.location.host}/ws/notifications/`);

export function socketEmitter(socket) {
  return eventChannel((emit) => {
    socket.addEventListener('message', (e) => {
      emit(JSON.parse(e.data));
    });
    return () => socket.close();
  });
}

const COPY_TOAST_DELAY_MS = 750;
const pendingCopyToasts = new Map();

const normalizePath = (path = '') => path.replace(/^\/+|\/+$/g, '');

const getTransferDestination = (response) =>
  normalizePath(response.path).split('/').slice(0, -1).join('/');

const getCopyToastKey = (action) => {
  const { response } = action.extra;
  return `${response.systemId}:${getTransferDestination(response)}`;
};

function* flushCopyToast(key) {
  yield delay(COPY_TOAST_DELAY_MS);
  const pending = pendingCopyToasts.get(key);
  if (!pending) return;
  pendingCopyToasts.delete(key);
  yield put({
    type: 'ADD_TOAST',
    payload: {
      ...pending.action,
      extra: {
        ...pending.action.extra,
        copy_count: pending.count,
      },
    },
  });
}

function* queueCopyToast(action) {
  const key = getCopyToastKey(action);
  const pending = pendingCopyToasts.get(key);
  if (pending) {
    pending.count += 1;
    pending.action = action;
    return;
  }
  pendingCopyToasts.set(key, { action, count: 1 });
  yield fork(flushCopyToast, key);
}

export function* watchSocket() {
  const notificationsSocket = yield call(createNotificationsSocket);
  const socketChannel = yield call(socketEmitter, notificationsSocket);
  yield takeEvery(socketChannel, handleSocket);
}

export function* handleSocket(action) {
  const eventType = action.event_type.toLowerCase();
  switch (eventType) {
    case 'job': {
      // parse current jobs list for job event
      const jobsList = yield select((state) => state.jobs.list);
      // notification event contains job id and new status
      const upatedJob = action.extra;
      const jobIds = jobsList.map((job) => job.uuid);
      if (jobIds.includes(upatedJob.uuid)) {
        // if event is in current state, update
        yield put({
          type: 'UPDATE_JOBS_FROM_NOTIFICATIONS',
          payload: [action],
        });
      } else {
        // otherwise, refresh job list
        yield put({ type: 'GET_JOBS', params: { offset: 0 } });
      }
      yield put({ type: 'NEW_NOTIFICATION', payload: action });
      yield put({ type: 'ADD_TOAST', payload: action });
      break;
    }
    case 'setup_event':
      yield put({ type: 'ONBOARDING_EVENT', payload: action });
      break;
    case 'data_files': {
      if (action.extra?.transfer_complete && action.status === 'SUCCESS') {
        yield queueCopyToast(action);
        const { response } = action.extra;
        const destination = getTransferDestination(response);
        const params = yield select((state) => state.files.params);
        const { query_string: queryString, filter } = parse(
          window.location.search
        );
        for (const section of ['FilesListing', 'modal']) {
          const current = params[section];
          if (
            current?.api === 'tapis' &&
            current.system === response.systemId &&
            normalizePath(current.path) === destination
          ) {
            yield put({
              type: section === 'modal' ? 'FETCH_FILES_MODAL' : 'FETCH_FILES',
              payload: {
                ...current,
                section,
                limit: 100,
                queryString: section === 'FilesListing' ? queryString : null,
                filter: section === 'FilesListing' ? filter : null,
              },
            });
          }
        }
      } else {
        yield put({ type: 'ADD_TOAST', payload: action });
      }
      break;
    }
    case 'projects':
      yield put({ type: 'ADD_TOAST', payload: action });
      break;
    default:
      yield put({ type: 'NEW_NOTIFICATION', payload: action });
      yield put({ type: 'ADD_TOAST', payload: action });
  }
}

export function* fetchNotifications(action) {
  const { onSuccess, params, queryString } = action.payload || {};
  yield put({ type: 'NOTIFICATIONS_LIST_FETCH_START' });
  try {
    const res = yield call(fetchUtil, {
      url: `/api/notifications/${queryString ? `?${queryString}` : ''}`,
      params,
    });
    yield put({
      type: 'NOTIFICATIONS_LIST_FETCH_SUCCESS',
      payload: res,
    });
    if (onSuccess) {
      yield put(onSuccess);
    }
    yield put({ type: 'UPDATE_JOBS_FROM_NOTIFICATIONS', payload: res.notifs });
  } catch (error) {
    yield put({
      type: 'NOTIFICATIONS_LIST_FETCH_ERROR',
      payload: error,
    });
  }
}

export function* readNotifications(action) {
  const { body, onSuccess } = action.payload || {};
  try {
    yield call(fetchUtil, {
      url: '/api/notifications/',
      method: 'PATCH',
      body: JSON.stringify({
        id: 'all',
        read: true,
        ...body,
      }),
    });
    if (onSuccess) {
      yield put(onSuccess);
    }
  } catch (error) {
    yield put({
      type: 'NOTIFICATIONS_LIST_FETCH_ERROR',
      payload: error,
    });
  }
}

export function* deleteNotifications(action) {
  try {
    yield call(fetchUtil, {
      url: `/api/notifications/${action.payload}`,
      method: 'DELETE',
    });
  } catch (error) {
    yield put({
      type: 'NOTIFICATIONS_LIST_FETCH_ERROR',
      payload: error,
    });
  }
  yield put({
    type: 'FETCH_NOTIFICATIONS',
  });
}

export function* discardToast(action) {
  yield put({
    type: 'DISCARD_TOAST',
    payload: action.payload,
  });
}

export function* watchFetchNotifications() {
  yield takeLatest('FETCH_NOTIFICATIONS', fetchNotifications);
  yield takeEvery('NOTIFICATIONS_DELETE', deleteNotifications);
  yield takeEvery('NOTIFICATIONS_READ', readNotifications);
  yield takeEvery('NOTIFICATIONS_DISCARD_TOAST', discardToast);
}
