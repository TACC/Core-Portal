import { put, takeLatest, takeLeading, call } from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';

export async function getIntroMessageComponents() {
  const result = await fetchUtil({
    url: `/api/portal_messages/intro/`,
    method: 'get',
  });
  return result.response;
}

export function* fetchIntroMessageComponents() {
  yield put({ type: 'INTRO_FETCH_STARTED' });
  try {
    const introMessageComponents = yield call(getIntroMessageComponents);
    // create complete list of IntroMessageComponents for the user with status
    // for all messages set to unread (true)
    const messageComponents = {
      ACCOUNT: true,
      ALLOCATIONS: true,
      APPLICATIONS: true,
      DASHBOARD: true,
      DATA: true,
      HISTORY: true,
      TICKETS: true,
      UI: true,
    };

    introMessageComponents.forEach((element) => {
      messageComponents[element.component] = element.unread;
    });

    yield put({
      type: 'INTRO_FETCH_SUCCESS',
      payload: messageComponents,
    });
  } catch (error) {
    yield put({
      type: 'INTRO_FETCH_ERROR',
    });
  }
}

export function* watchFetchIntroMessageComponents() {
  yield takeLeading('FETCH_INTRO', fetchIntroMessageComponents);
}

// Write IntroMessageComponents to the database and update the redux store.
export function* saveIntroMessageComponents(action) {
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
    // Return the intended state of intro message components
    // regardless of save success or failure
    yield put({
      type: 'INTRO_SAVE_ERROR',
      payload: action.payload,
    });
  }
}

export function* watchSaveIntroMessageComponents() {
  yield takeLatest('SAVE_INTRO', saveIntroMessageComponents);
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
