import fetch from 'cross-fetch';
import { vi } from 'vitest';
import fetchMock from 'fetch-mock';
import { fetchUserSearch, userSearch } from './users.sagas';
import { initialState } from '../reducers/users.reducers';
import { users as usersReducer } from '../reducers/users.reducers';
import { expectSaga } from 'redux-saga-test-plan';
import usersSearchFixture from './fixtures/users.fixture';

vi.mock('cross-fetch');

describe('user search', () => {
  beforeEach(() => {
    const fm = fetchMock
      .sandbox()
      .get(`/api/users/?q=username`, {
        body: usersSearchFixture,
        status: 200,
      })
      .get(`/api/users/?q=notfound`, {
        status: 404,
      });
    fetch.mockImplementation(fm);
  });

  it('runs user search', async () => {
    const action = {
      type: 'USERS_SEARCH',
      payload: {
        q: 'username',
      },
    };
    return expectSaga(userSearch, action)
      .withReducer(usersReducer)
      .put({
        type: 'USERS_SEARCH_STARTED',
      })
      .call(fetchUserSearch, 'username')
      .put({
        type: 'USERS_SEARCH_SUCCESS',
        payload: usersSearchFixture,
      })
      .hasFinalState({
        ...initialState,
        search: {
          users: usersSearchFixture,
          loading: false,
          error: null,
        },
      })
      .run();
  });

  it('runs user search with no results', async () => {
    const action = {
      type: 'USERS_SEARCH',
      payload: {
        q: 'notfound',
      },
    };
    return expectSaga(userSearch, action)
      .withReducer(usersReducer)
      .put({
        type: 'USERS_SEARCH_STARTED',
      })
      .call(fetchUserSearch, 'notfound')
      .put({
        type: 'USERS_SEARCH_SUCCESS',
        payload: [],
      })
      .hasFinalState({
        ...initialState,
        search: {
          users: [],
          loading: false,
          error: null,
        },
      })
      .run();
  });
});
