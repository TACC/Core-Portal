import { put, takeEvery, takeLatest, call } from 'redux-saga/effects';
import { flatten } from 'lodash';
import 'cross-fetch';

export function* getAllocations(action) {
  yield put({ type: 'START_ADD_ALLOCATIONS' });
  try {
    const response = yield call(fetch, '/api/users/allocations/', {
      credentials: 'same-origin',
      ...action.options
    });
    const json = yield response.json();
    const payload = { ...json.response };
    yield put({ type: 'ADD_ALLOCATIONS', payload });
    const allocations = yield {
      active: json.response.active,
      inactive: json.response.inactive
    };
    const teams = yield flatten(Object.values(allocations)).reduce(
      (obj, item) => ({ ...obj, [item.projectId]: {} }),
      {}
    );
    const pages = yield flatten(Object.values(allocations)).reduce(
      (obj, item) => ({ ...obj, [item.projectId]: 1 }),
      {}
    );
    const loadingTeams = yield Object.keys(teams).reduce(
      (obj, teamID) => ({ ...obj, [teamID]: { loading: true } }),
      {}
    );
    yield put({
      type: 'POPULATE_TEAMS',
      payload: { teams, pages, loadingTeams }
    });
  } catch (error) {
    const json = { error };
    yield put({ type: 'ADD_ALLOCATIONS', payload: json });
  }
}

function* getUsernames(action) {
  const response = yield call(fetch, `/api/users/team/${action.payload.name}`, {
    credentials: 'same-origin',
    ...action.options
  });
  const json = yield response.json();
  const payload = yield {
    data: {
      [action.payload.projectId]: json.usernames.sort((a, b) =>
        a.firstName.localeCompare(b.firstName)
      )
    },
    loading: { [action.payload.projectId]: false }
  };
  yield put({ type: 'ADD_USERNAMES_TO_TEAM', payload });
}

export function* watchAllocationData() {
  yield takeEvery('GET_ALLOCATIONS', getAllocations);
}
export function* watchTeams() {
  yield takeLatest('GET_TEAMS', getUsernames);
}

export default [watchAllocationData(), watchTeams()];
