import { put, takeLatest, call, select } from 'redux-saga/effects';
import 'cross-fetch';
import { fetchUtil } from 'utils/fetchUtil';

export async function fetchAppDefinitionUtil(appId) {
  const result = await fetchUtil({
    url: '/api/workspace/apps',
    params: { app_id: appId }
  });
  return result.response;
}

const getCurrentApp = state => state.app;

function* getApp(action) {
  const { appId } = action.payload;
  const currentApp = yield select(getCurrentApp);

  if (
    currentApp.definition.id === appId &&
    currentApp.definition.systemHasKeys
  ) {
    return;
  }
  yield put({ type: 'FLUSH_SUBMIT' });
  yield put({ type: 'GET_APP_START' });
  try {
    const app = yield call(fetchAppDefinitionUtil, appId);
    yield put({ type: 'LOAD_APP', payload: app });
  } catch (error) {
    yield put({ type: 'GET_APP_ERROR', payload: error });
  }
}

export async function fetchAppTrayUtil() {
  const result = await fetchUtil({
    url: '/api/workspace/tray'
  });
  return result;
}

export function* getAppTray(action) {
  yield put({ type: 'GET_APPS_START' });
  try {
    const tray = yield call(fetchAppTrayUtil);
    yield put({ type: 'GET_APPS_SUCCESS', payload: tray });
  } catch (error) {
    yield put({ type: 'GET_APPS_ERROR' });
  }
}

export default function* watchApps() {
  yield takeLatest('GET_APPS', getAppTray);
  yield takeLatest('GET_APP', getApp);
}
