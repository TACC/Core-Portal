import { put, takeEvery, takeLatest, call } from 'redux-saga/effects';
import { flatten } from 'lodash';
import { fetchUtil } from 'utils/fetchUtil';
import 'cross-fetch';

const getTeams = allocations => {
  const teams = flatten(Object.values(allocations)).reduce(
    (obj, item) => ({ ...obj, [item.projectId]: {} }),
    {}
  );

  const loadingTeams = Object.keys(teams).reduce(
    (obj, teamID) => ({ ...obj, [teamID]: { loading: true } }),
    {}
  );

  return { teams, loadingTeams };
};

export function* getAllocations(action) {
  yield put({ type: 'START_ADD_ALLOCATIONS' });
  try {
    const { response } = yield call(fetchUtil, {
      url: '/api/users/allocations/'
    });
    const { active, inactive } = yield response;
    const payload = { active, inactive };
    yield put({ type: 'ADD_ALLOCATIONS', payload });
    yield put({
      type: 'POPULATE_TEAMS',
      payload: getTeams({
        active,
        inactive
      })
    });
  } catch (error) {
    yield put({ type: 'ADD_ALLOCATIONS_ERROR', payload: error });
  }
}

const getTeamPayload = (id, obj, error = false) => {
  const loading = { [id]: false };
  if (error) {
    return {
      errors: { [id]: obj },
      loading
    };
  }
  const data = {
    [id]: obj.usernames.sort((a, b) => a.firstName.localeCompare(b.firstName))
  };

  return { data, loading };
};

function* getUsernames(action) {
  try {
    const json = yield call(fetchUtil, {
      url: `/api/users/team/${action.payload.name}`
    });
    const payload = getTeamPayload(action.payload.projectId, json);
    yield put({ type: 'ADD_USERNAMES_TO_TEAM', payload });
  } catch (error) {
    const payload = getTeamPayload(action.payload.projectId, error, true);
    yield put({
      type: 'POPULATE_TEAMS_ERROR',
      payload
    });
  }
}

export function* watchAllocationData() {
  yield takeEvery('GET_ALLOCATIONS', getAllocations);
}
export function* watchTeams() {
  yield takeLatest('GET_TEAMS', getUsernames);
}

export default [watchAllocationData(), watchTeams()];
