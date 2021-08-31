import {
  put,
  takeEvery,
  takeLatest,
  call,
  all,
  select,
  debounce
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
    yield put({
      type: 'POPULATE_TEAMS',
      payload: populateTeamsUtil(json)
    });
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
    url: '/api/users/allocations/'
  });
  const json = res.response;
  return json;
};

/**
 * Fetch user data for a project
 * @param {String} projectId - project id
 */
export const getTeamsUtil = async projectId => {
  const res = await fetchUtil({ url: `/api/users/team/${projectId}` });
  const json = res.response;
  return json;
};

/**
 * Generate an empty dictionary to look up users from project ID and map loading state
 * to each project
 * @param {{portal_alloc: String, active: Array, inactive: Array, hosts: Object}} data -
 * Allocations data
 * @returns {{teams: Object, loadingTeams: {}}}
 */
export const populateTeamsUtil = data => {
  const teams = data.active
    .concat(data.inactive)
    .reduce((obj, item) => ({ ...obj, [item.projectId]: {} }), {});
  const loadingTeams = Object.keys(teams).reduce(
    (obj, teamID) => ({ ...obj, [teamID]: { loading: true } }),
    {}
  );
  return { teams, loadingTeams };
};

export const allocationsSelector = state => [
  ...state.allocations.active,
  ...state.allocations.inactive
];

export function* getUsernames(action) {
  try {
    const json = yield call(getTeamsUtil, action.payload.name);
    const allocations = yield select(allocationsSelector);
    const allocationIds = chain(allocations)
      .filter({ projectId: action.payload.projectId })
      .map('systems')
      .flatten()
      .map(s => ({ host: s.host, id: s.allocation.id }))
      .value();
    const usage = yield all(
      allocationIds.map(params => call(getUsageUtil, params))
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
      payload
    });
  } catch (error) {
    yield put({
      type: 'POPULATE_TEAMS_ERROR',
      payload: teamPayloadUtil(action.payload.projectId, error, true)
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
export const getUsageUtil = async params => {
  const res = await fetchUtil({
    url: `/api/users/team/usage/${params.id}`
  });
  const data = res.response
    .map(user => ({
      ...user,
      resource: params.host,
      allocationId: params.id
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
  const loading = { [id]: false };
  if (error) {
    return {
      errors: { [id]: obj },
      loading
    };
  }

  // Add usage entries for a project
  const data = {
    [id]: obj
      .sort((a, b) => a.firstName.localeCompare(b.firstName))
      .map(user => {
        const { username } = user;
        const individualUsage = usageData.filter(
          val => val.username === username
        );
        const currentSystems = chain(allocations)
          .filter({ projectId: id })
          .map('systems')
          .flatten()
          .value();
        const userData = {
          ...user,
          usageData: currentSystems.map(system => {
            // Create empty entry for each resource
            return {
              type: system.type,
              usage: `0 ${system.type === 'HPC' ? 'SU' : 'GB'}`,
              resource: system.host,
              percentUsed: 0,
              status: system.allocation.status,
              allocationId: system.allocation.id
            };
          })
        };
        if (isEmpty(individualUsage)) return userData;
        return {
          ...userData,
          usageData: userData.usageData.map(entry => {
            const current = individualUsage.filter(
              d =>
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
                .filter(o => o.status === entry.status)
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
                percentUsed: (totalUsed / totalAllocated) * 100
              };
            }
            return entry;
          })
        };
      })
  };
  return { data, loading };
};

export function* getUsernamesManage(action) {
  try {
    const json = yield call(getTeamsUtil, action.payload.name);
    const payload = {
      data: { [action.payload.projectId]: json },
      loading: { [action.payload.projectId]: { loading: false } }
    };
    yield put({
      type: 'ADD_USERNAMES_TO_TEAM',
      payload
    });
  } catch (error) {
    console.log(error);
  }
}
const searchUsersUtil = async term => {
  console.log(term);
  const root =
    'https://portal.tacc.utexas.edu/projects-and-allocations/-/pm/api/users?action=search&field=username&term=';
  const res = await fetch(`${root}${term}`);
  const json = await res.json();
  console.log(json);
  return json.result;
};
export function* searchUsers(action) {
  try {
    const { term } = action.payload;
    const json = yield call(searchUsersUtil, term);
    yield put({
      type: 'ADD_SEARCH_RESULTS',
      payload: { data: json }
    });
  } catch (error) {
    console.log(error);
  }
}

export const manageUtil = async (pid, uid, add = true) => {
  const r = await fetch(`/api/users/team/manage/${pid}/${uid}`, {
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    method: add ? 'POST' : 'DELETE'
  });
  const json = r.json();
  return json;
};

export function* addUser(action) {
  try {
    yield call(manageUtil, action.payload.projectId, action.payload.id);
  } catch (error) {
    console.log(error);
  }
}

export const allocationsTeamSelector = state => state.allocations.teams;

export function* removeUser(action) {
  try {
    yield put({
      type: 'ALLOCATION_OPERATION_REMOVE_USER_STATUS',
      payload: {
        removingUserOperation: {
          loading: true,
          error: false,
          userName: action.payload.id
        }
      }
    });
    yield call(manageUtil, action.payload.projectId, action.payload.id, false);
    // remove user from team state
    const teams = yield select(allocationsTeamSelector);
    const updatedTeams = { ...teams };
    updatedTeams[action.payload.projectId] = teams[
      action.payload.projectId
    ].filter(i => i.username !== action.payload.id);
    yield put({
      type: 'ALLOCATION_OPERATION_REMOVE_USER_STATUS',
      payload: {
        teams: updatedTeams,
        removingUserOperation: { loading: false, error: false, userName: '' }
      }
    });
  } catch (error) {
    yield put({
      type: 'ALLOCATION_OPERATION_REMOVE_USER_STATUS',
      payload: {
        removingUserOperation: {
          loading: false,
          error: true,
          userName: action.payload.id
        }
      }
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
  yield debounce(750, 'GET_USERS_FROM_SEARCH', searchUsers);
}
export function* watchAllocationData() {
  yield takeEvery('GET_ALLOCATIONS', getAllocations);
}
export function* watchTeams() {
  yield takeLatest('GET_TEAMS', getUsernames);
}
export function* watchManageTeams() {
  yield takeLatest('GET_MANAGE_TEAMS', getUsernamesManage);
}
export default [
  watchAllocationData(),
  watchTeams(),
  watchManageTeams(),
  watchUserSearch(),
  watchAddUser(),
  watchRemoveUser()
];
