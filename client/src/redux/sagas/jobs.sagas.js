import Cookies from 'js-cookie';
import { call, put, select, takeLatest, takeLeading } from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';
import { fetchAppDefinitionUtil } from './apps.sagas';

const LIMIT = 50;

export async function fetchJobs(offset, limit) {
  const result = await fetchUtil({
    url: '/api/workspace/jobs/',
    params: { offset, limit },
  });
  return result.response;
}

export function* getJobs(action) {
  if ('offset' in action.params && action.params.offset === 0) {
    yield put({ type: 'JOBS_LIST_INIT' });
  } else {
    const reachedEnd = yield select((state) => state.jobs.reachedEnd);
    if (reachedEnd) {
      return;
    }
  }

  yield put({ type: 'JOBS_LIST_START' });

  try {
    const jobs = yield call(
      fetchJobs,
      action.params.offset,
      action.params.limit || LIMIT
    );
    yield put({
      type: 'JOBS_LIST',
      payload: { list: jobs, reachedEnd: jobs.length < LIMIT },
    });
    yield put({ type: 'JOBS_LIST_FINISH' });

    const notifs = yield select((state) => state.notifications.list.notifs);
    yield put({ type: 'UPDATE_JOBS_FROM_NOTIFICATIONS', payload: notifs });
  } catch {
    yield put({ type: 'JOBS_LIST_ERROR', payload: 'error' });
    yield put({ type: 'JOBS_LIST_FINISH' });
  }
}

export async function postSubmitJobUtil(jobPayload) {
  const result = await fetchUtil({
    url: '/api/workspace/jobs',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken'),
    },
    body: JSON.stringify(jobPayload),
  });
  return result;
}

export function* submitJob(action) {
  yield put({ type: 'FLUSH_SUBMIT' });
  yield put({ type: 'TOGGLE_SUBMITTING' });
  try {
    const res = yield call(postSubmitJobUtil, action.payload);
    if (res.response.execSys) {
      yield put({
        type: 'SYSTEMS_TOGGLE_MODAL',
        payload: {
          operation: 'pushKeys',
          props: {
            onSuccess: { type: 'SUBMIT_JOB', payload: action.payload },
            system: res.response.execSys,
          },
        },
      });
      yield put({ type: 'TOGGLE_SUBMITTING' });
    } else {
      yield put({
        type: 'SUBMIT_JOB_SUCCESS',
        payload: res.response,
      });
    }

    if (action.payload.onSuccess) {
      yield put(action.payload.onSuccess);
    }
  } catch (error) {
    yield put({
      type: 'SUBMIT_JOB_ERROR',
      payload: error,
    });
  }
}

export async function fetchJobDetailsUtil(jobUuid) {
  const result = await fetchUtil({
    url: '/api/workspace/jobs/',
    params: { job_uuid: jobUuid },
  });
  return result.response;
}

export async function fetchSystemUtil(system) {
  const result = await fetchUtil({
    url: `/api/accounts/systems/${system}/`,
  });
  return result.response;
}

export function* getJobDetails(action) {
  const { jobUuid } = action.payload;
  yield put({
    type: 'JOB_DETAILS_FETCH_STARTED',
    payload: jobUuid,
  });
  try {
    const job = yield call(fetchJobDetailsUtil, jobUuid);
    let app = null;

    try {
      app = yield call(fetchAppDefinitionUtil, job.appId, job.appVersion);
    } catch (ignore) {
      // ignore if we cannot get app or execution system information
    }

    yield put({
      type: 'JOB_DETAILS_FETCH_SUCCESS',
      payload: { app, job },
    });

    yield put({
      type: 'JOBS_LIST_UPDATE_JOB',
      payload: { job },
    });
  } catch (error) {
    yield put({
      type: 'JOB_DETAILS_FETCH_ERROR',
      payload: error,
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
