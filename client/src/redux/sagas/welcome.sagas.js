import { put, takeLatest, call, all } from 'redux-saga/effects';
import Cookies from 'js-cookie';
import { fetchUtil } from 'utils/fetchUtil';
import 'cross-fetch';

export function* fetchWelcomeMessages(action) {
  yield put({ type: 'WELCOME_FETCH_STARTED' });
  try {
    const messages = localStorage.getItem('welcomeMessages') || {}
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
  yield takeLatest('FETCH_WELCOME', fetchWelcomeMessages);
}

export function* saveWelcomeMessages(action) {
  yield put({ type: 'WELCOME_SAVE_STARTED' });
  try {
    localStorage.setItem('welcomeMessages', action.payload)
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