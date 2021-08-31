import { isEqual } from 'lodash';
import { fetchUtil } from 'utils/fetchUtil';
import { expectSaga, testSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import * as matchers from 'redux-saga-test-plan/matchers';
import {
  getAllocationsUtil,
  getTeamsUtil,
  populateTeamsUtil,
  getUsageUtil,
  teamPayloadUtil,
  allocationsSelector,
  getAllocations,
  getUsernames,
  removeUser,
  manageUtil,
  watchAllocationData,
  watchTeams
} from '../allocations.sagas';
import {
  allocations as allocationsReducer,
  initialState as initialAllocationState
} from '../../reducers/allocations.reducers';
import {
  projectNameFixture,
  allocationsFixture,
  projectIdFixture,
  teamFixture,
  usageDataFixture
} from '../fixtures/allocations.fixtures';

jest.mock('utils/fetchUtil');

describe('Utils', () => {
  test('fetchUtil wrapper functions', () => {
    const fakeParams = {
      url: '/api/users/allocations/'
    };
    fetchUtil.mockReturnValue({
      response: []
    });
    getAllocationsUtil();
    expect(fetchUtil).toHaveBeenCalledWith(fakeParams);

    const fakeProjectId = 1234;
    fakeParams.url = `/api/users/team/${fakeProjectId}`;
    getTeamsUtil(fakeProjectId);
    expect(fetchUtil).toHaveBeenCalledWith(fakeParams);
  });

  test('getUsageUtil', async () => {
    const fixture = { host: 'frontera.tacc.utexas.edu', id: 12345 };
    const fakeParams = { url: `/api/users/team/usage/${fixture.id}` };
    fetchUtil.mockReturnValueOnce({
      response: [
        { username: 'testUser1', usage: 12.345 },
        { username: 'testUser2', usage: 567.89 }
      ]
    });

    const output = await getUsageUtil(fixture);
    expect(fetchUtil).toHaveBeenCalledWith(fakeParams);
    output.forEach(entry => {
      expect(entry).toHaveProperty('resource', 'frontera.tacc.utexas.edu');
      expect(entry).toHaveProperty('allocationId', 12345);
    });
  });
});

describe('Allocations Sagas', () => {
  const emptyAllocationsFixture = {
    hosts: {},
    portal_alloc: '',
    active: [],
    inactive: []
  };
  const teamsFixture = populateTeamsUtil(emptyAllocationsFixture);
  test('GET Allocations', () => {
    // Success
    expectSaga(getAllocations)
      .withReducer(allocationsReducer)
      .provide({
        call(effect, next) {
          if (effect.fn === getAllocationsUtil) {
            return emptyAllocationsFixture;
          }
          return next();
        }
      })
      .put({ type: 'START_ADD_ALLOCATIONS' })
      .call(getAllocationsUtil)
      .put({ type: 'ADD_ALLOCATIONS', payload: emptyAllocationsFixture })
      .put({ type: 'POPULATE_TEAMS', payload: teamsFixture })
      .run();
    // Error
    const testError = new Error('Test Error');
    expectSaga(getAllocations)
      .withReducer(allocationsReducer)
      .provide({
        call(effect, next) {
          if (effect.fn === getAllocationsUtil) {
            throw testError;
          }
          return next();
        }
      })
      .put({ type: 'START_ADD_ALLOCATIONS' })
      .call(getAllocationsUtil)
      .put({ type: 'ADD_ALLOCATIONS_ERROR', payload: testError })
      .run();
  });

  test('GET Usernames', () => {
    const testProjectName = projectNameFixture;
    const testProjectId = projectIdFixture;
    const testProjectUsers = teamFixture;
    const testAllocations = allocationsFixture;
    const testUsageData = usageDataFixture;

    const testPayload = teamPayloadUtil(
      testProjectId,
      testProjectUsers,
      false,
      testUsageData,
      testAllocations
    );
    // Success
    expectSaga(getUsernames, {
      payload: { name: testProjectName, projectId: testProjectId }
    })
      .withReducer(allocationsReducer)
      .provide({
        call(effect, next) {
          switch (effect.fn) {
            case getTeamsUtil:
              return testProjectUsers;
            case getUsageUtil:
              if (
                isEqual(effect.args[0], {
                  host: 'frontera.tacc.utexas.edu',
                  id: 1984
                })
              ) {
                return [
                  {
                    username: 'doc',
                    usage: 5,
                    resource: 'frontera.tacc.utexas.edu',
                    allocationId: 1984
                  },
                  {
                    username: 'chicken',
                    usage: 55,
                    resource: 'frontera.tacc.utexas.edu',
                    allocationId: 1984
                  }
                ];
              }
              return [
                {
                  username: 'doc',
                  usage: 20,
                  resource: 'longhorn.tacc.utexas.edu',
                  allocationId: 1985
                },
                {
                  username: 'chicken',
                  usage: 25,
                  resource: 'longhorn.tacc.utexas.edu',
                  allocationId: 1985
                }
              ];

            default:
              return next();
          }
        },
        select({ selector }, next) {
          if (selector === allocationsSelector) return testAllocations;
          return next();
        }
      })
      .put({
        type: 'ADD_USERNAMES_TO_TEAM',
        payload: testPayload
      })
      .run();
    // Error
    const testError = new Error('PC Load Letter?');
    expectSaga(getUsernames, {
      payload: { name: testProjectName, projectId: testProjectId }
    })
      .withReducer(allocationsReducer)
      .provide({
        call(effect, next) {
          throwError(testError);
          next();
        }
      })
      .put({
        type: 'POPULATE_TEAMS_ERROR',
        payload: teamPayloadUtil(testProjectId, testError, true)
      });
  });

  it('removeUser success', async () => {
    const initialState = {
      ...initialAllocationState,
      teams: { 1234: teamFixture }
    };
    expectSaga(removeUser, { payload: { projectId: 1234, id: 'chicken' } })
      .withReducer(allocationsReducer, { ...initialState })
      .provide([[matchers.call.fn(manageUtil), { response: 'ok' }]])
      .put({
        type: 'ALLOCATION_OPERATION_REMOVE_USER_STATUS',
        payload: { loading: true, error: false, userName: 'chicken' }
      })
      .call(manageUtil, 1234, 'chicken', false)
      .put({
        type: 'ALLOCATION_OPERATION_REMOVE_USER_STATUS',
        payload: { loading: false, error: false }
      })
      .put({
        type: 'ALLOCATION_OPERATION_REMOVE_USER_FROM_PROJECT_STATE',
        payload: { projectId: 1234, userName: 'chicken' }
      })
      .hasFinalState({
        ...initialState,
        teams: { 1234: teamFixture.filter(i => i.username !== 'chicken')},
        removingUserOperation: {
          userName: 'chicken',
          error: false,
          loading: false
        }
      })
      .run();
  });

  it('removeUser failure', async () => {
    const initialState = {
      ...initialAllocationState,
      teams: { 1234: teamFixture }
    };
    const fakeError = new Error('Unable to remove user');
    expectSaga(removeUser, { payload: { projectId: 1234, id: 'chicken' } })
      .withReducer(allocationsReducer, { ...initialState })
      .provide([[matchers.call.fn(manageUtil), throwError(fakeError)]])
      .put({
        type: 'ALLOCATION_OPERATION_REMOVE_USER_STATUS',
        payload: { loading: true, error: false, userName: 'chicken' }
      })
      .call(manageUtil, 1234, 'chicken', false)
      .put({
        type: 'ALLOCATION_OPERATION_REMOVE_USER_STATUS',
        payload: { loading: false, error: true }
      })
      .hasFinalState({
        ...initialState,
        removingUserOperation: {
          userName: 'chicken',
          error: true,
          loading: false
        }
      })
      .run();
  });
});

describe('Effect Creators', () => {
  test('should dispatch sagas', () => {
    testSaga(watchAllocationData)
      .next()
      .takeEvery('GET_ALLOCATIONS', getAllocations)
      .next()
      .isDone();

    testSaga(watchTeams)
      .next()
      .takeLatest('GET_TEAMS', getUsernames)
      .next()
      .isDone();
  });
});
