import { put, takeLatest, takeLeading, call } from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';

export async function getIntroMessages() {
  const result = await fetchUtil({
    url: `/api/intromessages/msg/`,
    method: 'get'
  });
  console.log(result);
  return result.response;
}

export function* fetchIntroMessages() {
  yield put({ type: 'INTRO_FETCH_STARTED' });
  try {
    const componentDictionary = yield call(getIntroMessages);
    console.log('componentDictionary = ');
    console.log(componentDictionary);
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

    // update messages with messages that have been read
    if (componentDictionary !== 'NULL') {
      componentDictionary.forEach(element => {
        console.log(element);
        messages[element.component] = element.unread;
      });
    }

    console.log(messages);

    yield put({
      type: 'INTRO_FETCH_SUCCESS',
      payload: messages
    });
  } catch (error) {
    console.log('=====> ERROR <=====');
    console.log(error);
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
    // localStorage.setItem('introMessages', JSON.stringify(action.payload));
    console.log(' ==========>>>>> START SAVEINTROMESSAGES <<<<<==========');
    console.log('action.payload = ');
    console.log(action.payload);
    const introMessages = {};
    console.log('I am here.......');
    Object.entries(action.payload).forEach(([component, unread]) => {
      console.log(`component = ${component}`);
      console.log(`unread = ${unread}`);
      introMessages[component] = { unread };
      console.log(introMessages);
    });
    console.log('introMessages = ');
    console.log(introMessages);

    console.log(' ==========>>>>> -END- SAVEINTROMESSAGES <<<<<==========');

    yield call(fetchUtil, {
      url: '/api/intromessages/msg/',
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
