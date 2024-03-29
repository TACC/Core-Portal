import {
  put,
  takeEvery,
  takeLatest,
  call,
  all,
  select,
  debounce,
} from 'redux-saga/effects';
import { chain, flatten, isEmpty } from 'lodash';
import { fetchUtil } from 'utils/fetchUtil';
import Cookies from 'js-cookie';
import 'cross-fetch';

export function* getAllocations() {
  yield put({ type: 'START_ADD_ALLOCATIONS' });
  try {
    const json = yield call(getAllocationsUtil);
    yield put({ type: 'ADD_ALLOCATIONS', payload: json });
  } catch (error) {
    yield put({ type: 'ADD_ALLOCATIONS_ERROR', payload: error });
  }
}
/**
 * Fetch allocations data
 * @async
 * @returns {{portal_alloc: String, active: Array, inactive: Array, hosts: Object}}
 */
export const getAllocationsUtil = async () => {
  const res = await fetchUtil({
    url: '/api/users/allocations/',
  });
  const json = res.response;
  return json;
};

/**
 * Fetch user data for a project
 * @param {Number} projectId - project id
 */
export const getProjectUsersUtil = async (projectId) => {
  const res = await fetchUtil({ url: `/api/users/team/${projectId}` });
  const json = res.response;
  return json;
};

export const allocationsSelector = (state) => [
  ...state.allocations.active,
  ...state.allocations.inactive,
];

export function* getUsernames(action) {
  try {
    yield put({
      type: 'GET_PROJECT_USERS_INIT',
      payload: {
        loadingUsernames: { [action.payload.projectId]: { loading: true } },
      },
    });
    const json = yield call(getProjectUsersUtil, action.payload.projectId);
    const allocations = yield select(allocationsSelector);
    const allocationIds = chain(allocations)
      .filter({ projectId: action.payload.projectId })
      .map('systems')
      .flatten()
      .map((s) => ({ host: s.host, id: s.allocation.id }))
      .value();
    const usage = yield all(
      allocationIds.map((params) => call(getUsageUtil, params))
    );
    const payload = teamPayloadUtil(
      action.payload.projectId,
      json,
      false,
      flatten(usage),
      allocations
    );
    yield put({
      type: 'ADD_USERNAMES_TO_TEAM',
      payload,
    });
  } catch (error) {
    yield put({
      type: 'POPULATE_TEAMS_ERROR',
      payload: teamPayloadUtil(action.payload.projectId, error, true),
    });
  }
}

/**
 * Fetch Usage For an Allocation and Return an Array of Users with their data,
 * resource used, and allocation id.
 * @async
 * @param {{id: Number, host: String}} params
 * @returns {{user: Object, resource: String, allocationId: Number}[]} data
 */
export const getUsageUtil = async (params) => {
  const res = await fetchUtil({
    url: `/api/users/team/usage/${params.id}`,
  });
  const data = res.response
    .map((user) => ({
      ...user,
      resource: params.host,
      allocationId: params.id,
    }))
    .filter(Boolean);
  return data;
};

/**
 * Generate a payload for the User Data saga.
 * When there is not an error, this function maps team data to Projects.
 * Each user has an entry for the resources in the allocation and if they have
 * usage data, it is added to their entry
 * @param {Number} id - Project Id
 * @param {Object} obj - User Data
 * @param {Boolean} error - Error present
 * @param {Object} usageData - Usage Data
 * @param {Array} allocations - All allocations
 * @returns {{data: Object, loading: Boolean}}
 */
export const teamPayloadUtil = (
  id,
  obj,
  error = false,
  usageData = {},
  allocations = []
) => {
  const loadingUsernames = { [id]: { loading: false } };
  if (error) {
    return {
      errors: { [id]: obj },
      loadingUsernames,
    };
  }

  // Add usage entries for a project
  const data = {
    [id]: obj
      .sort((a, b) => a.firstName.localeCompare(b.firstName))
      .map((user) => {
        const { username } = user;
        const individualUsage = usageData.filter(
          (val) => val.username === username
        );
        const currentSystems = chain(allocations)
          .filter({ projectId: id })
          .map('systems')
          .flatten()
          .value();
        const userData = {
          ...user,
          usageData: currentSystems.map((system) => {
            // Create empty entry for each resource
            return {
              type: system.type,
              usage: `0 ${system.type === 'HPC' ? 'SU' : 'GB'}`,
              resource: system.host,
              percentUsed: 0,
              status: system.allocation.status,
              allocationId: system.allocation.id,
            };
          }),
        };
        if (isEmpty(individualUsage)) return userData;
        return {
          ...userData,
          usageData: userData.usageData.map((entry) => {
            const current = individualUsage.filter(
              (d) =>
                d.resource === entry.resource &&
                d.allocationId === entry.allocationId
            );
            if (!isEmpty(current)) {
              // Add usage data to empty entries
              const totalAllocated = chain(allocations)
                .map('systems')
                .flatten()
                .filter({ host: entry.resource })
                .map('allocation')
                .filter({ projectId: id })
                .filter({ id: entry.allocationId })
                .filter((o) => o.status === entry.status)
                .reduce(
                  (sum, { computeAllocated }) => sum + computeAllocated,
                  0
                )
                .value();
              const totalUsed = current.reduce(
                (sum, { usage }) => sum + usage,
                0
              );
              return {
                usage: `${totalUsed.toFixed(3)} ${
                  entry.type === 'HPC' ? 'SU' : 'GB'
                }`,
                status: entry.status,
                resource: entry.resource,
                allocationId: entry.allocationId,
                percentUsed: (totalUsed / totalAllocated) * 100,
              };
            }
            return entry;
          }),
        };
      }),
  };
  return { data, loadingUsernames };
};

/**
 * Search for users in TAS
 * @async
 * @returns {Array.<Object>}
 */
export const searchUsersUtil = async (term) => {
  const res = await fetchUtil({
    url: '/api/users/tas-users/',
    params: { search: term },
  });
  const json = res.result;
  return json;
};
export function* searchUsers(action) {
  try {
    yield put({ type: 'SEARCH_INIT' });
    const result = yield call(searchUsersUtil, action.payload.term);
    yield put({
      type: 'ADD_SEARCH_RESULTS',
      payload: { data: result },
    });
  } catch (error) {
    yield put({ type: 'SEARCH_ERROR' });
  }
}

export const manageUtil = async (projectId, username, add = true) => {
  const r = await fetch(`/api/users/team/manage/${projectId}/${username}`, {
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    method: add ? 'POST' : 'DELETE',
  });
  const json = r.json();
  return json;
};

export function* addUser(action) {
  try {
    yield put({ type: 'ALLOCATION_OPERATION_ADD_USER_INIT' });
    yield call(manageUtil, action.payload.projectId, action.payload.username);
    yield put({ type: 'ALLOCATION_OPERATION_ADD_USER_COMPLETE' });
    yield put({
      type: 'GET_PROJECT_USERS',
      payload: {
        projectId: action.payload.projectId,
      },
    });
  } catch (error) {
    yield put({
      type: 'ALLOCATION_OPERATION_ADD_USER_ERROR',
      payload: {
        addUserOperation: {
          loading: false,
          error: true,
          username: action.payload.username,
        },
      },
    });
  }
}

export const allocationsTeamSelector = (state) => state.allocations.teams;
export function* removeUser(action) {
  try {
    yield put({
      type: 'ALLOCATION_OPERATION_REMOVE_USER_STATUS',
      payload: {
        removingUserOperation: {
          loading: true,
          error: false,
          username: action.payload.username,
        },
      },
    });
    yield call(
      manageUtil,
      action.payload.projectId,
      action.payload.username,
      false
    );
    // remove user from team state
    const teams = yield select(allocationsTeamSelector);
    const updatedTeams = { ...teams };
    updatedTeams[action.payload.projectId] = teams[
      action.payload.projectId
    ].filter((i) => i.username !== action.payload.username);
    yield put({
      type: 'ALLOCATION_OPERATION_REMOVE_USER_STATUS',
      payload: {
        teams: updatedTeams,
        removingUserOperation: { loading: false, error: false, username: '' },
      },
    });
  } catch (error) {
    yield put({
      type: 'ALLOCATION_OPERATION_REMOVE_USER_STATUS',
      payload: {
        removingUserOperation: {
          loading: false,
          error: true,
          username: action.payload.username,
        },
      },
    });
  }
}
export function* watchAddUser() {
  yield takeEvery('ADD_USER_TO_TAS_PROJECT', addUser);
}
export function* watchRemoveUser() {
  yield takeEvery('REMOVE_USER_FROM_TAS_PROJECT', removeUser);
}

export function* watchUserSearch() {
  yield debounce(250, 'GET_USERS_FROM_SEARCH', searchUsers);
}
export function* watchAllocationData() {
  yield takeEvery('GET_ALLOCATIONS', getAllocations);
}
export function* watchTeams() {
  yield takeLatest('GET_PROJECT_USERS', getUsernames);
}

export default [
  watchAllocationData(),
  watchTeams(),
  watchUserSearch(),
  watchAddUser(),
  watchRemoveUser(),
];
