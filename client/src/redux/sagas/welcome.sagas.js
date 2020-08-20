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
      payload: error
    });
  }
}
