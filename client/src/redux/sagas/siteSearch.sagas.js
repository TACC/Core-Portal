import { put, call, takeLatest } from 'redux-saga/effects';
import { FetchError } from 'utils/fetchUtil';
import queryStringParser from 'query-string';

export async function fetchSiteSearchUtil(page, query_string, filter) {
  const q = queryStringParser.stringify({ page, query_string, filter });
  const response = await fetch(`/api/site-search/?${q}`);
  if (!response.ok) {
    let json;
    try {
      json = await response.json();
    } catch (e) {
      json = { message: 'An unknown error has occurred.' };
    }
    throw new FetchError(json, response);
  }
  const responseJson = await response.json();
  return responseJson;
}

export function* fetchSiteSearch(action) {
  yield put({
    type: 'FETCH_SITE_SEARCH_START',
    payload: {},
  });
  try {
    const response = yield call(
      fetchSiteSearchUtil,
      action.payload.page,
      action.payload.query_string,
      action.payload.filter
    );
    yield put({
      type: 'FETCH_SITE_SEARCH_SUCCESS',
      payload: {
        results: response,
      },
    });
  } catch (e) {
    yield put({
      type: 'FETCH_SITE_SEARCH_ERROR',
      payload: { error: { status: e.status, message: e.message } },
    });
  }
}

export function* watchSiteSearch() {
  yield takeLatest('FETCH_SITE_SEARCH', fetchSiteSearch);
}
