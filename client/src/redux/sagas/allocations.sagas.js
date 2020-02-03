import { put, takeEvery, takeLatest, call } from 'redux-saga/effects';
import 'cross-fetch';

export function* getAllocations(action) {
  yield put({ type: 'LOADING_ALLOCATIONS' });
  try {
    const res = yield call(fetch, '/api/users/allocations', {
      credentials: 'same-origin',
      ...action.options
    });
    const json = yield res.json();
    const payload = { active: json.allocs, inactive: json.inactive };
    yield put({ type: 'ADD_ALLOCATIONS', payload });
    const teams = yield payload.active.reduce(
      (obj, item) => ({ ...obj, [item.projectId]: {} }),
      {}
    );
    const pages = yield payload.active.reduce(
      (obj, item) => ({ ...obj, [item.projectId]: 1 }),
      {}
    );
    yield put({ type: 'POPULATE_TEAMS', payload: { teams, pages } });
  } catch (error) {
    const json = { error };
    yield put({ type: 'ADD_ALLOCATIONS', payload: json });
  }
}

function* getUsernames(action) {
  const response = yield call(fetch, `/api/users/team/${action.payload.id}`, {
    credentials: 'same-origin',
    ...action.options
  });

  const json = yield response.json();
  const payload = yield {
    [action.payload.id]: json.usernames.sort((a, b) =>
      a.username.localeCompare(b.username)
    )
  };
  yield put({ type: 'ADD_USERNAMES_TO_TEAM', payload });
}

function* getUserData(action) {
  const response = yield call(
    fetch,
    `/api/users/team/user/${action.username}`,
    {}
  );
  const payload = yield response.json();
  yield put({ type: 'ADD_USER_TO_DIRECTORY', payload });
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
