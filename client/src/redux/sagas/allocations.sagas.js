import { put, takeEvery, takeLatest, call } from 'redux-saga/effects';
import { flatten } from 'lodash';
import { fetchUtil } from 'utils/fetchUtil';
import 'cross-fetch';

export function* getAllocations(action) {
  yield put({ type: 'START_ADD_ALLOCATIONS' });
  try {
    const { response } = yield call(fetchUtil, {
      url: '/api/users/allocations/'
    });
    const { active, inactive } = yield response;
    const payload = { active, inactive };
    yield put({ type: 'ADD_ALLOCATIONS', payload });
    const teams = yield flatten(Object.values(payload)).reduce(
      (obj, item) => ({ ...obj, [item.projectId]: {} }),
      {}
    );
    const pages = yield flatten(Object.values(payload)).reduce(
      (obj, item) => ({ ...obj, [item.projectId]: 1 }),
      {}
    );
    yield put({ type: 'POPULATE_TEAMS', payload: { teams, pages } });
  } catch (error) {
    yield put({ type: 'ADD_ALLOCATIONS_ERROR', payload: error });
  }
}

function* getUsernames(action) {
  try {
    const json = yield call(fetchUtil, {
      url: `/api/users/team/${action.payload.id}`
    });
    const payload = yield {
      [action.payload.id]: json.usernames.sort((a, b) =>
        a.username.localeCompare(b.username)
      )
    };
    yield put({ type: 'ADD_USERNAMES_TO_TEAM', payload });
  } catch (error) {
    yield put({
      type: 'POPULATE_TEAMS_ERROR',
      payload: {
        [action.payload.id]: error
      }
    });
  }
}

function* getUserData(action) {
  try {
    const payload = yield call(fetchUtil, {
      url: `/api/users/team/user/${action.username}`
    });
    yield put({ type: 'ADD_USER_TO_DIRECTORY', payload });
    yield put({ type: 'PAGE_LOADED' });
  } catch (error) {
    yield put({
      type: 'USERNAME_ERROR',
      payload: {
        [action.username]: error
      }
    });
  }
}

export function* watchAllocations() {
  yield takeEvery('GET_ALLOCATIONS', getAllocations);
}
export function* watchUsers() {
  yield takeLatest('GET_TEAMS', getUsernames);
}
export function* watchUserData() {
  yield takeEvery('GET_USER_DATA', getUserData);
}
