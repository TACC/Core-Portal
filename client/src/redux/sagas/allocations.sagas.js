import {
  put,
  takeEvery,
  takeLatest,
  call,
  all,
  select
} from 'redux-saga/effects';
import { chain, flatten, isEmpty, find } from 'lodash';
import { fetchUtil } from 'utils/fetchUtil';
import 'cross-fetch';

export function* getAllocations(action) {
  yield put({ type: 'START_ADD_ALLOCATIONS' });
  try {
    const json = yield call(getAllocationsUtil);
    yield put({ type: 'ADD_ALLOCATIONS', payload: json });
    yield put({
      type: 'POPULATE_TEAMS',
      payload: populateTeamsUtil(json)
    });
  } catch (error) {
    yield put({ type: 'ADD_ALLOCATIONS_ERROR', payload: error });
  }
}

const getAllocationsUtil = async () => {
  const res = await fetchUtil({
    url: '/api/users/allocations/'
  });
  const json = res.response;
  return json;
};
const getTeamsUtil = async team => {
  const res = await fetchUtil({ url: `/api/users/team/${team}` });
  const json = res.response;
  return json;
};
const populateTeamsUtil = data => {
  const allocations = { active: data.active, inactive: data.inactive };
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

function* getUsernames(action) {
  try {
    const json = yield call(getTeamsUtil, action.payload.name);
    const usage = yield all(
      action.payload.allocationIds.map(params => getUsageUtil(params))
    );
    const allocations = yield select(state => [
      ...state.allocations.active,
      ...state.allocations.inactive
    ]);
    yield put({
      type: 'ADD_USERNAMES_TO_TEAM',
      payload: teamPayloadUtil(
        action.payload.projectId,
        json,
        false,
        flatten(usage),
        allocations
      )
    });
  } catch (error) {
    yield put({
      type: 'POPULATE_TEAMS_ERROR',
      payload: teamPayloadUtil(action.payload.projectId, error, true)
    });
  }
}
const getUsageUtil = async params => {
  const res = await fetchUtil({
    url: `/api/users/team/usage/${params.id}`
  });
  const data = res.response
    .map(user => ({
      ...user,
      resource: params.system.host,
      allocationId: params.id
    }))
    .filter(Boolean);
  return data;
};

const teamPayloadUtil = (
  id,
  obj,
  error = false,
  usageData = {},
  allocations = []
) => {
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
        const currentProject = allocations.find(
          allocation => allocation.projectId === id
        );
        const userData = {
          ...user,
          usageData: currentProject.systems.map(system => {
            return {
              usage: `0 ${system.type === 'HPC' ? 'SU' : 'GB'}`,
              resource: system.host,
              allocationId: system.allocation.id,
              percentUsed: 0
            };
          })
        };
        if (isEmpty(individualUsage)) return userData;
        return {
          ...userData,
          usageData: userData.usageData.map(entry => {
            const current = find(individualUsage, { resource: entry.resource });
            if (current) {
              const { computeAllocated, type } = chain(allocations)
                .map('systems')
                .flatten()
                .filter({ host: current.resource })
                .map('allocation')
                .filter({ id: current.allocationId })
                .head()
                .value();
              return {
                usage: `${current.usage} ${type === 'HPC' ? 'SU' : 'GB'}`,
                resource: current.resource,
                allocationId: current.allocationId,
                percentUsed: current.usage / computeAllocated
              };
            }
            return entry;
          })
        };
      })
  };
  return { data, loading };
};

export function* watchAllocationData() {
  yield takeEvery('GET_ALLOCATIONS', getAllocations);
}
export function* watchTeams() {
  yield takeLatest('GET_TEAMS', getUsernames);
}

export default [watchAllocationData(), watchTeams()];
