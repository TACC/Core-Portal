import { take, call, takeEvery } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';

const createNotificationsSocket = () =>
  new WebSocket('wss://' + window.location.host + '/ws/notifications/');

function socketEmitter(socket) {
  return eventChannel(emit => {
    socket.addEventListener('message', e => {
      emit(e);
    });
    return () => socket.close();
  });
}

export function* watchSocket() {
  const notificationsSocket = yield call(createNotificationsSocket);
  const socketChannel = yield call(socketEmitter, notificationsSocket);
  yield takeEvery(socketChannel, handleSocket)
}

export function* handleSocket(action) {
  yield console.log(action)
}
