import { put, takeLatest, takeLeading, call } from 'redux-saga/effects';
import 'cross-fetch';
import Cookies from 'js-cookie';
import { fetchUtil } from 'utils/fetchUtil';

export function* getJobs(action) {
  if ('offset' in action.params && action.params.offset === 0) {
    yield put({ type: 'JOBS_LIST_INIT' });
  }

  yield put({ type: 'JOBS_LIST_START' });
  const url = new URL('/api/workspace/jobs', window.location.origin);
  Object.keys(action.params).forEach(key =>
    url.searchParams.append(key, action.params[key])
  );
  try {
    const res = yield call(fetch, url, {
      credentials: 'same-origin',
      ...action.options
    });
    if (res.status !== 200) {
      throw new Error('Could not retrieve jobs');
    }
    const json = yield res.json();
    yield put({ type: 'JOBS_LIST', payload: json.response });
    yield put({ type: 'JOBS_LIST_FINISH' });
  } catch {
    yield put({ type: 'JOBS_LIST_ERROR', payload: 'error' });
    yield put({ type: 'JOBS_LIST_FINISH' });
  }
}

function* submitJob(action) {
  yield put({ type: 'FLUSH_SUBMIT' });
  yield put({ type: 'TOGGLE_SUBMITTING' });
  try {
    const res = yield call(fetchUtil, {
      url: '/api/workspace/jobs',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken')
      },
      body: JSON.stringify(action.payload)
    });
    if (res.response.execSys) {
      yield put({
        type: 'SYSTEMS_TOGGLE_MODAL',
        payload: {
          operation: 'pushKeys',
          props: {
            onSuccess: { type: 'SUBMIT_JOB', payload: action.payload },
            system: res.response.execSys
          }
        }
      });
      yield put({ type: 'TOGGLE_SUBMITTING' });
    } else {
      yield put({
        type: 'SUBMIT_JOB_SUCCESS',
        payload: res.response
      });
    }
  } catch (error) {
    yield put({
      type: 'SUBMIT_JOB_ERROR',
      payload: error
    });
  }
}

export async function fetchJobDetailsUtil(jobId) {
  const result = await fetchUtil({
    url: '/api/workspace/jobs/',
    params: { job_id: jobId }
  });
  return result.response;
}

export async function fetchAppDetailsUtil(appId) {
  const result = await fetchUtil({
    url: '/api/workspace/apps',
    params: { app_id: appId }
  });
  return result.response;
}

export function* getJobDetails(action) {
  const { jobId } = action.payload;
  yield put({
    type: 'JOB_DETAILS_FETCH_STARTED',
    payload: jobId
  });
  try {
    const job = yield call(fetchJobDetailsUtil, jobId);
    let app = null;

    try {
      app = yield call(fetchAppDetailsUtil, job.appId);
    } catch (error) {
      // ignore if we can't get app info
    }

    yield put({
      type: 'JOB_DETAILS_FETCH_SUCCESS',
      payload: { app, job }
    });
  } catch (error) {
    yield put({
      type: 'JOB_DETAILS_FETCH_ERROR',
      payload: error
    });
  }
}

export function* watchJobs() {
  yield takeLatest('GET_JOBS', getJobs);
  yield takeLeading('SUBMIT_JOB', submitJob);
}

export function* watchJobDetails() {
  yield takeLatest('GET_JOB_DETAILS', getJobDetails);
}
