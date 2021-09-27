import { put, takeLatest, takeLeading } from 'redux-saga/effects';

export function* fetchIntroMessages() {
  yield put({ type: 'INTRO_FETCH_STARTED' });
  try {
    const messages = JSON.parse(localStorage.getItem('introMessages')) || {};
    yield put({
      type: 'INTRO_FETCH_SUCCESS',
      payload: messages
    });
  } catch (error) {
    yield put({
      type: 'INTRO_FETCH_ERROR'
    });
  }
}

export function* watchFetchIntroMessages() {
  yield takeLeading('FETCH_INTRO', fetchIntroMessages);
}

export function* saveIntroMessages(action) {
  yield put({ type: 'INTRO_SAVE_STARTED' });
  try {
    localStorage.setItem('introMessages', JSON.stringify(action.payload));
    yield put({
      type: 'INTRO_SAVE_SUCCESS',
      payload: action.payload
    });
  } catch (error) {
    // Return the intended state of intro messages
    // regardless of save success or failure
    yield put({
      type: 'INTRO_SAVE_ERROR',
      payload: action.payload
    });
  }
}

export function* watchSaveIntroMessages() {
  yield takeLatest('SAVE_INTRO', saveIntroMessages);
}
