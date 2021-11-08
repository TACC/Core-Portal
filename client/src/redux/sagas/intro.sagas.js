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
    const componentArray = yield call(getIntroMessages);
    console.log('componentArray = ');
    console.log(componentArray);
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
    if (componentArray !== 'NULL') {
      componentArray.forEach(element => {
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
    console.log(' ==========>>>>> -END- SAVEINTROMESSAGES <<<<<==========');

    yield call(fetchUtil, {
      url: '/api/intromessages/msg/',
      method: 'PUT',
      body: JSON.stringify(action.payload)
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
