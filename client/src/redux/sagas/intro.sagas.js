import { put, takeLatest, takeLeading, call } from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';

export async function getIntroMessages() {
  const result = await fetchUtil({
    url: `/api/intromessages/`,
    method: 'get'
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
      UI: true
    };

    // update messages dictionary with messages from the database
    // that have been read/dismissed (unread = false)
    // if (introMessages !== 'NULL') {
    //   introMessages.forEach(element => {
    //     messages[element.component] = element.unread;
    //   });
    // }
    introMessages.forEach(element => {
      messages[element.component] = element.unread;
    });

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

// Write IntroMessages that have been read to the database and
// update the redux store.
export function* saveIntroMessages(action) {
  yield put({ type: 'INTRO_SAVE_STARTED' });
  try {
    const introMessages = {};
    Object.entries(action.payload).forEach(([component, unread]) => {
      introMessages[component] = { unread };
    });

    yield call(fetchUtil, {
      url: '/api/intromessages/',
      method: 'PUT',
      body: JSON.stringify(introMessages)
    });

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
