import { put, takeLatest, takeLeading } from 'redux-saga/effects';

export function* fetchWelcomeMessages() {
  yield put({ type: 'WELCOME_FETCH_STARTED' });
  try {
    const messages = JSON.parse(localStorage.getItem('welcomeMessages')) || {}
    console.log("WELCOME MESSAGE STATE", messages);
    yield put({
      type: 'WELCOME_FETCH_SUCCESS',
      payload: messages
    });
  } catch (error) {
    yield put({
      type: 'WELCOME_FETCH_ERROR',
    });
  }
}

export function* watchFetchWelcomeMessages() {
  yield takeLeading('FETCH_WELCOME', fetchWelcomeMessages);
}

export function* saveWelcomeMessages(action) {
  yield put({ type: 'WELCOME_SAVE_STARTED' });
  try {
    localStorage.setItem('welcomeMessages', JSON.stringify(action.payload))
    yield put({
      type: 'WELCOME_SAVE_SUCCESS',
      payload: action.payload
    })
  } catch (error) {
    // Return the intended state of welcome messages
    // regardless of save success or failure
    yield put({
      type: 'WELCOME_SAVE_ERROR',
      payload: action.payload
    });
  }
}

export function* watchSaveWelcomeMessages() {
  yield takeLatest('SAVE_WELCOME', saveWelcomeMessages);
}