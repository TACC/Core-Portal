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
    const allocations = yield {
      active,
      inactive
    };
    const teams = yield flatten(Object.values(allocations)).reduce(
      (obj, item) => ({ ...obj, [item.projectId]: {} }),
      {}
    );

    const loadingTeams = yield Object.keys(teams).reduce(
      (obj, teamID) => ({ ...obj, [teamID]: { loading: true } }),
      {}
    );

    yield put({
      type: 'POPULATE_TEAMS',
      payload: { teams, loadingTeams }
    });
  } catch (error) {
    yield put({ type: 'ADD_ALLOCATIONS_ERROR', payload: error });
  }
}

function* getUsernames(action) {
  try {
    const json = yield call(fetchUtil, {
      url: `/api/users/team/${action.payload.name}`
    });
    const payload = yield {
      data: {
        [action.payload.projectId]: json.usernames.sort((a, b) =>
          a.firstName.localeCompare(b.firstName)
        )
      },
      loading: { [action.payload.projectId]: false }
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

export function* watchAllocationData() {
  yield takeEvery('GET_ALLOCATIONS', getAllocations);
}
export function* watchTeams() {
  yield takeLatest('GET_TEAMS', getUsernames);
}

export default [watchAllocationData(), watchTeams()];
