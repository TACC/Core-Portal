import { fetchUtil } from 'utils/fetchUtil';
import { put, takeLatest, call } from 'redux-saga/effects';
import queryStringParser from 'query-string';

export async function createPublicationRequestUtil(data) {
  const result = await fetchUtil({
    url: `/api/publications/publication-request/`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return result.response;
}

export function* createPublicationRequest(action) {
  yield put({
    type: 'PUBLICATIONS_CREATE_PUBLICATION_REQUEST_STARTED',
  });
  try {
    const result = yield call(createPublicationRequestUtil, action.payload);
    yield put({
      type: 'PUBLICATIONS_CREATE_PUBLICATION_REQUEST_SUCCESS',
      payload: result,
    });
  } catch (error) {
    yield put({
      type: 'PUBLICATIONS_CREATE_PUBLICATION_REQUEST_FAILED',
      payload: error,
    });
  }
}

export async function fetchPublicationRequestsUtil(system) {
  const result = await fetchUtil({
    url: `/api/publications/publication-request/${system}`,
  });
  return result.response;
}

export function* getPublicationRequests(action) {
  yield put({
    type: 'PUBLICATIONS_GET_PUBLICATION_REQUESTS_STARTED',
  });
  try {
    const publicationRequests = yield call(
      fetchPublicationRequestsUtil,
      action.payload
    );
    yield put({
      type: 'PUBLICATIONS_GET_PUBLICATION_REQUESTS_SUCCESS',
      payload: publicationRequests,
    });
  } catch (error) {
    yield put({
      type: 'PUBLICATIONS_GET_PUBLICATION_REQUESTS_FAILED',
      payload: error,
    });
  }
}

export async function approvePublicationUtil(data) {
  const result = await fetchUtil({
    url: `/api/publications/publish/`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return result.response;
}

export function* approvePublication(action) {
  yield put({
    type: 'PUBLICATIONS_APPROVE_PUBLICATION_STARTED',
  });
  try {
    const result = yield call(approvePublicationUtil, action.payload);
    yield put({
      type: 'PUBLICATIONS_APPROVE_PUBLICATION_SUCCESS',
      payload: result,
    });
  } catch (error) {
    yield put({
      type: 'PUBLICATIONS_APPROVE_PUBLICATION_FAILED',
      payload: error,
    });
  } finally {
    yield put({ type: 'PUBLICATIONS_OPERATION_RESET' });
  }
}

export async function rejectPublicationUtil(data) {
  const result = await fetchUtil({
    url: `/api/publications/reject/`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return result.response;
}

export function* rejectPublication(action) {
  yield put({
    type: 'PUBLICATIONS_REJECT_PUBLICATION_STARTED',
  });
  try {
    const result = yield call(rejectPublicationUtil, action.payload);
    yield put({
      type: 'PUBLICATIONS_REJECT_PUBLICATION_SUCCESS',
      payload: result,
    });
  } catch (error) {
    yield put({
      type: 'PUBLICATIONS_REJECT_PUBLICATION_FAILED',
      payload: error,
    });
  } finally {
    yield put({ type: 'PUBLICATIONS_OPERATION_RESET' });
  }
}

export async function fetchPublicationsUtil(queryString) {
  const q = queryStringParser.stringify({ query_string: queryString });

  const result = await fetchUtil({
    url: queryString ? `/api/publications?${q}` : '/api/publications',
  });
  return result.response;
}

export function* getPublications(action) {
  yield put({
    type: 'PUBLICATIONS_GET_PUBLICATIONS_STARTED',
  });
  try {
    const result = yield call(
      fetchPublicationsUtil,
      action.payload.queryString
    );
    yield put({
      type: 'PUBLICATIONS_GET_PUBLICATIONS_SUCCESS',
      payload: result,
    });
  } catch (error) {
    yield put({
      type: 'PUBLICATIONS_GET_PUBLICATIONS_FAILED',
      payload: error,
    });
  }
}

export function* watchPublications() {
  yield takeLatest('PUBLICATIONS_GET_PUBLICATIONS', getPublications);
  yield takeLatest('PUBLICATIONS_APPROVE_PUBLICATION', approvePublication);

  yield takeLatest('PUBLICATIONS_REJECT_PUBLICATION', rejectPublication);

  yield takeLatest(
    'PUBLICATIONS_CREATE_PUBLICATION_REQUEST',
    createPublicationRequest
  );
  yield takeLatest(
    'PUBLICATIONS_GET_PUBLICATION_REQUESTS',
    getPublicationRequests
  );
}
