import { put, call, debounce } from 'redux-saga/effects';
import fetch from 'cross-fetch';
import Cookies from 'js-cookie';

export async function fetchUserSearch(q) {
  const url = `/api/users/?q=${q}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken'),
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
  });
  if (response.status === 404) {
    return [];
  }
  if (response.status === 200) {
    const result = await response.json();
    return result;
  }
  throw Error('Users search error');
}

export function* userSearch(action) {
  const { q } = action.payload;
  yield put({
    type: 'USERS_SEARCH_STARTED',
  });
  try {
    const users = yield call(fetchUserSearch, q);
    yield put({
      type: 'USERS_SEARCH_SUCCESS',
      payload: users,
    });
  } catch (error) {
    yield put({
      type: 'USERS_SEARCH_FAILED',
      payload: error,
    });
  }
}

export function* watchUsers() {
  yield debounce(750, 'USERS_SEARCH', userSearch);
}
