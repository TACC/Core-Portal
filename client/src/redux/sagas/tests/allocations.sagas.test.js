import allocationsReducer from '../../reducers/allocations.reducers';
import {
  getAllocationsUtil,
  getTeamsUtil,
  populateTeamsUtil,
  getUsageUtil,
  teamPayloadUtil,
  allocationsSelector,
  getAllocations,
  getUsernames,
  watchAllocationData,
  watchTeams,
} from '../allocations.sagas';
import { isEqual } from 'lodash';
import { fetchUtil } from 'utils/fetchUtil';
import { expectSaga, testSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';

jest.mock('utils/fetchUtil');

describe('Utils', () => {
  test('fetchUtil wrapper functions', () => {
    const fakeParams = {
      url: '/api/users/allocations/',
    };
    fetchUtil.mockReturnValue({
      response: []
    })
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
        { username: 'testUser2', usage: 567.89 },
      ],
    });

    const output = await getUsageUtil(fixture);
    expect(fetchUtil).toHaveBeenCalledWith(fakeParams);
    output.forEach((entry) => {
      expect(entry).toHaveProperty('resource', 'frontera.tacc.utexas.edu');
      expect(entry).toHaveProperty('allocationId', 12345);
    });
  });
});

describe('Allocations Sagas', () => {
  const allocationsFixture = {
    hosts: {},
    portal_alloc: '',
    active: [],
    inactive: [],
  };
  const teamsFixture = populateTeamsUtil(allocationsFixture);
  test('GET Allocations', () => {
    // Success
    expectSaga(getAllocations)
      .withReducer(allocationsReducer)
      .provide({
        call(effect, next) {
          if (effect.fn === getAllocationsUtil) {
            return allocationsFixture;
          }
          return next();
        },
      })
      .put({ type: 'START_ADD_ALLOCATIONS' })
      .call(getAllocationsUtil)
      .put({ type: 'ADD_ALLOCATIONS', payload: allocationsFixture })
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
        },
      })
      .put({ type: 'START_ADD_ALLOCATIONS' })
      .call(getAllocationsUtil)
      .put({ type: 'ADD_ALLOCATIONS_ERROR', payload: testError })
      .run();
  });

  test('GET Usernames', () => {
    const testProjectName = 'TEST_PROJECT';
    const testProjectId = 1234;
    const testProjectUsers = [
      {
        id: 1,
        username: 'doc',
        role: 'PI',
        firstName: 'doc',
        lastName: 'brown',
        email: 'docbrown@gmail.com',
      },
      {
        id: 2,
        username: 'chicken',
        role: 'Standard',
        firstName: 'marty',
        lastName: 'mcfly',
        email: 'mcfly@gmail.com',
      },
      {
        id: 3,
        username: 'dude',
        role: 'Standard',
        firstName: 'Jeff',
        lastName: 'Lebowski',
        email: 'dude@gmail.com',
      },
    ];
    const testAllocations = [
      {
        title: 'Test Project',
        projectId: testProjectId,
        pi: 'Doc Brown',
        projectName: testProjectName,
        systems: [
          {
            name: 'Frontera',
            host: 'frontera.tacc.utexas.edu',
            type: 'HPC',
            allocation: {
              id: 1984,
              status: 'Active',
              computeRequested: 1,
              computeAllocated: 100,
              resourceId: 56,
              resource: 'Frontera',
              projectId: testProjectId,
              project: testProjectName,
              requestorId: 1,
              requestor: 'Maytal Dahan',
              computeUsed: 136.746,
            },
          },
          {
            name: 'Longhorn',
            host: 'longhorn.tacc.utexas.edu',
            type: 'HPC',
            allocation: {
              id: 1985,
              status: 'Active',
              computeRequested: 100,
              computeAllocated: 100,
              resourceId: 58,
              resource: 'Longhorn3',
              projectId: testProjectId,
              project: testProjectName,
              requestorId: 1,
              requestor: 'Maytal Dahan',
              computeUsed: 0,
            },
          },
        ],
      },
    ];
    const testUsageData = [
      {
        username: 'doc',
        usage: 5,
        resource: 'frontera.tacc.utexas.edu',
        allocationId: 1984,
      },
      {
        username: 'chicken',
        usage: 55,
        resource: 'frontera.tacc.utexas.edu',
        allocationId: 1984,
      },
      {
        username: 'doc',
        usage: 20,
        resource: 'longhorn.tacc.utexas.edu',
        allocationId: 1985,
      },
      {
        username: 'chicken',
        usage: 25,
        resource: 'longhorn.tacc.utexas.edu',
        allocationId: 1985,
      },
    ];

    const testPayload = teamPayloadUtil(
      testProjectId,
      testProjectUsers,
      false,
      testUsageData,
      testAllocations
    );
    // Success
    expectSaga(getUsernames, {
      payload: { name: testProjectName, projectId: testProjectId },
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
                  id: 1984,
                })
              ) {
                return [
                  {
                    username: 'doc',
                    usage: 5,
                    resource: 'frontera.tacc.utexas.edu',
                    allocationId: 1984,
                  },
                  {
                    username: 'chicken',
                    usage: 55,
                    resource: 'frontera.tacc.utexas.edu',
                    allocationId: 1984,
                  },
                ];
              } else {
                return [
                  {
                    username: 'doc',
                    usage: 20,
                    resource: 'longhorn.tacc.utexas.edu',
                    allocationId: 1985,
                  },
                  {
                    username: 'chicken',
                    usage: 25,
                    resource: 'longhorn.tacc.utexas.edu',
                    allocationId: 1985,
                  },
                ];
              }
            default:
              return next();
          }
        },
        select({ selector }, next) {
          if (selector === allocationsSelector) return testAllocations;
          return next();
        },
      })
      .put({
        type: 'ADD_USERNAMES_TO_TEAM',
        payload: testPayload,
      })
      .run();
    // Error
    const testError = new Error('PC Load Letter?');
    expectSaga(getUsernames, {
      payload: { name: testProjectName, projectId: testProjectId },
    })
      .withReducer(allocationsReducer)
      .provide({
        call(effect, next) {
          throwError(testError);
          next();
        },
      })
      .put({
        type: 'POPULATE_TEAMS_ERROR',
        payload: teamPayloadUtil(testProjectId, testError, true),
      });
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
