import { call, put, select, takeLatest, takeLeading } from 'redux-saga/effects';
import Cookies from 'js-cookie';
import { fetchUtil } from 'utils/fetchUtil';
import { fetchAppDefinitionUtil } from './apps.sagas';

export const LIMIT = 50;

// Cached MockList for additional fetches
let cachedMockList = null;

export async function fetchJobs(offset, limit, queryString) {
  const operation = queryString ? 'search' : 'listing';
  console.log('Fetch with offset of ', offset);
  /*
  On additional fetches, it should return the remaining 50 or less jobs that are in the history,
  this just mocks that another 50 are returned by the fetch request.
  */
  // For some reason fetchJobs calls twice on call
  if (offset == 0) {
    const result = await fetchUtil({
      url: `/api/workspace/jobs/${operation}`,
      params: { offset, limit, query_string: queryString },
    });
    let jobs = result.response;
    cachedMockList = [];
    // Mock for 50 job history results
    for (let i = 0; i < 12; i++) {
      cachedMockList = cachedMockList.concat(jobs);
    }
    cachedMockList = cachedMockList.concat(jobs[0]);
    cachedMockList = cachedMockList.concat(jobs[1]);
    return cachedMockList;
  } else if (offset == 50) {
    // Mock for remaining 12 results
    for (let i = 0; i < 12; i++) {
      cachedMockList = cachedMockList.concat(cachedMockList[0]);
    }
    return cachedMockList;
  }
  const result = await fetchUtil({
    url: `/api/workspace/jobs/${operation}`,
    params: { offset, limit, query_string: queryString },
  });
  return result.response;
}

// TODOv3: dropV2Jobs
export async function fetchV2Jobs(offset, limit) {
  const result = await fetchUtil({
    url: '/api/workspace/historic/',
    params: { offset, limit },
  });
  return result.response;
}

export const selectorNotificationsListNotifs = (state) =>
  state.notifications.list.notifs;

export const selectorJobsReachedEnd = (state) => state.jobs.reachedEnd;
// TODOv3: dropV2Jobs
export const selectorJobsV2ReachedEnd = (state) => state.jobsv2.reachedEnd;

export function* getJobs(action) {
  if ('offset' in action.params && action.params.offset === 0) {
    yield put({ type: 'JOBS_LIST_INIT' });
  } else {
    const reachedEnd = yield select(selectorJobsReachedEnd);
    if (reachedEnd) {
      return;
    }
  }

  yield put({ type: 'JOBS_LIST_START' });
  console.log('Fetch the job list starting');
  try {
    const jobs = yield call(
      fetchJobs,
      action.params.offset,
      action.params.limit || LIMIT,
      action.params.queryString || ''
    );
    console.log('PUT Request with payload', {
      list: jobs,
      reachedEnd: jobs.length < LIMIT,
    });
    yield put({
      type: 'JOBS_LIST',
      payload: { list: jobs, reachedEnd: jobs.length < LIMIT },
    });
    yield put({ type: 'JOBS_LIST_FINISH' });

    const notifs = yield select(selectorNotificationsListNotifs);
    yield put({ type: 'UPDATE_JOBS_FROM_NOTIFICATIONS', payload: notifs });
  } catch {
    yield put({ type: 'JOBS_LIST_ERROR', payload: 'error' });
    yield put({ type: 'JOBS_LIST_FINISH' });
  }
}

// TODOv3: dropV2Jobs
export function* getV2Jobs(action) {
  console.log('V2 Job Action fetch request');
  if ('offset' in action.params && action.params.offset === 0) {
    yield put({ type: 'JOBS_V2_LIST_INIT' });
  } else {
    const reachedEnd = yield select(selectorJobsV2ReachedEnd);
    if (reachedEnd) {
      return;
    }
  }

  yield put({ type: 'JOBS_V2_LIST_START' });

  try {
    const jobs = yield call(
      fetchV2Jobs,
      action.params.offset,
      action.params.limit || LIMIT
    );
    yield put({
      type: 'JOBS_V2_LIST',
      payload: { list: jobs, reachedEnd: jobs.length < LIMIT },
    });
    yield put({ type: 'JOBS_V2_LIST_FINISH' });
  } catch {
    yield put({ type: 'JOBS_V2_LIST_ERROR', payload: 'error' });
    yield put({ type: 'JOBS_V2_LIST_FINISH' });
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
    url: '/api/workspace/jobs/select',
    params: { job_uuid: jobUuid },
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
  yield takeLatest('GET_V2_JOBS', getV2Jobs);
  yield takeLeading('SUBMIT_JOB', submitJob);
}

export function* watchJobDetails() {
  yield takeLatest('GET_JOB_DETAILS', getJobDetails);
}
