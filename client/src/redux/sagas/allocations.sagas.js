import { put, takeEvery, takeLatest, call, all } from 'redux-saga/effects';
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
    const { active, inactive } = response;
    yield put({ type: 'ADD_ALLOCATIONS', payload: response });
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

const getTeamPayload = (id, obj, error = false, usageData = {}) => {
  const loading = { [id]: false };
  if (error) {
    return {
      errors: { [id]: obj },
      loading
    };
  }

  const data = {
    [id]: obj
      .sort((a, b) => a.firstName.localeCompare(b.firstName))
      .map(user => {
        const { username } = user;
        const individualUsage = usageData.filter(
          val => val.username === username
        );
        if (!individualUsage) {
          return user;
        }
        return {
          ...user,
          usageData: individualUsage.map(val => ({
            usage: val.usage,
            resource: val.resource
          }))
        };
      })
  };
  return { data, loading };
};

function* getUsernames(action) {
  try {
    const res = yield call(fetchUtil, {
      url: `/api/users/team/${action.payload.name}`
    });
    const json = res.response;

    const { allocationIds } = action.payload;
    const usageCalls = allocationIds.map(params => usageUtil(params));
    const usage = yield all(usageCalls);

    const payload = getTeamPayload(
      action.payload.projectId,
      json,
      false,
      flatten(usage)
    );
    yield put({ type: 'ADD_USERNAMES_TO_TEAM', payload });
  } catch (error) {
    const payload = getTeamPayload(action.payload.projectId, error, true);
    yield put({
      type: 'POPULATE_TEAMS_ERROR',
      payload
    });
  }
}

const usageUtil = async params => {
  const res = await fetchUtil({
    url: `/api/users/team/usage/${params.id}`
  });
  const data = res.response
    .map(user => {
      return { ...user, resource: params.system.host };
    })
    .filter(Boolean);
  return data;
};

export function* watchAllocationData() {
  yield takeEvery('GET_ALLOCATIONS', getAllocations);
}
export function* watchTeams() {
  yield takeLatest('GET_TEAMS', getUsernames);
}

export default [watchAllocationData(), watchTeams()];
