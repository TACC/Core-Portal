import { put, takeLatest, takeLeading, call } from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';

export async function getIntroMessages() {
  const result = await fetchUtil({
    url: `/api/portal_messages/intro/`,
    method: 'get',
  });
  return result.response;
}

export function* fetchIntroMessages() {
  yield put({ type: 'INTRO_FETCH_STARTED' });
  try {
    const introMessages = yield call(getIntroMessages);
    // create complete list of IntroMessages for the user with status
    // for all messages set to unread (true)
    const messages = {
      ACCOUNT: true,
      ALLOCATIONS: true,
      APPLICATIONS: true,
      DASHBOARD: true,
      DATA: true,
      HISTORY: true,
      TICKETS: true,
      UI: true,
    };

    introMessages.forEach((element) => {
      messages[element.component] = element.unread;
    });

    yield put({
      type: 'INTRO_FETCH_SUCCESS',
      payload: messages,
    });
  } catch (error) {
    yield put({
      type: 'INTRO_FETCH_ERROR',
    });
  }
}

export function* watchFetchIntroMessages() {
  yield takeLeading('FETCH_INTRO', fetchIntroMessages);
}

// Write IntroMessages to the database and update the redux store.
export function* saveIntroMessages(action) {
  yield put({ type: 'INTRO_SAVE_STARTED' });
  try {
    yield call(fetchUtil, {
      url: '/api/portal_messages/intro/',
      method: 'PUT',
      body: JSON.stringify(action.payload),
    });

    yield put({
      type: 'INTRO_SAVE_SUCCESS',
      payload: action.payload,
    });
  } catch (error) {
    // Return the intended state of intro messages
    // regardless of save success or failure
    yield put({
      type: 'INTRO_SAVE_ERROR',
      payload: action.payload,
    });
  }
}

export function* watchSaveIntroMessages() {
  yield takeLatest('SAVE_INTRO', saveIntroMessages);
}

export async function getCustomMessages() {
  const result = await fetchUtil({
    url: `/api/portal_messages/custom/`,
    method: 'get',
  });
  return result.response;
}

export function* fetchCustomMessages() {
  yield put({ type: 'CUSTOM_MESSAGES_FETCH_STARTED' });
  try {
    const customMessages = yield call(getCustomMessages);

    yield put({
      type: 'CUSTOM_MESSAGES_FETCH_SUCCESS',
      payload: customMessages,
    });
  } catch (error) {
    yield put({
      type: 'CUSTOM_MESSAGES_FETCH_ERROR',
    });
  }
}

export function* watchFetchCustomMessages() {
  yield takeLeading('FETCH_CUSTOM_MESSAGES', fetchCustomMessages);
}

export function* saveCustomMessages(action) {
  yield put({ type: 'CUSTOM_MESSAGES_SAVE_STARTED' });
  try {
    yield call(fetchUtil, {
      url: '/api/portal_messages/custom/',
      method: 'PUT',
      body: JSON.stringify(action.payload),
    });

    yield put({
      type: 'CUSTOM_MESSAGES_SAVE_SUCCESS',
      payload: action.payload,
    });
  } catch (error) {
    yield put({
      type: 'CUSTOM_MESSAGES_SAVE_ERROR',
      payload: action.payload,
    });
  }
}

export function* watchSaveCustomMessages() {
  yield takeLatest('SAVE_CUSTOM_MESSAGES', saveCustomMessages);
}
