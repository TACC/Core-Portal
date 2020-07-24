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
    /* todo filter out any input/params that startsWith('_') */
    const display = {
      applicationName: job.appId,
      systemName: job.systemId,
      inputs: Object.entries(job.inputs)
        .map(([key, val]) => ({
          label: key,
          id: key,
          value: val
        }))
        .filter(obj => !obj.id.startsWith('_')),
      parameters: Object.entries(job.parameters)
        .map(([key, val]) => ({
          label: key,
          id: key,
          value: val
        }))
        .filter(obj => !obj.id.startsWith('_'))
    };
    let app = null;

    try {
      app = yield call(fetchAppDetailsUtil, job.appId);
    } catch (error) {
      // ignore if we can't get app info
    }

    if (app) {
      // Improve any values with app information
      display.applicationName = app.label;

      // Improve input/parameters
      display.inputs.forEach(input => {
        const matchingParameter = app.inputs.find(obj => {
          return input.id === obj.id;
        });
        if (matchingParameter) {
          // eslint-disable-next-line no-param-reassign
          input.label = matchingParameter.details.label;
        }
      });
      display.parameters.forEach(input => {
        const matchingParameter = app.parameters.find(obj => {
          return input.id === obj.id;
        });
        if (matchingParameter) {
          // eslint-disable-next-line no-param-reassign
          input.label = matchingParameter.details.label;
        }
      });
      // filter non-visible
      display.inputs.filter(input => {
        const matchingParameter = app.inputs.find(obj => {
          return input.id === obj.id;
        });
        if (matchingParameter) {
          return matchingParameter.value.visible;
        }
        return true;
      });
      display.parameters.filter(input => {
        const matchingParameter = app.parameters.find(obj => {
          return input.id === obj.id;
        });
        if (matchingParameter) {
          return matchingParameter.value.visible;
        }
        return true;
      });
      // todo fix order of inputs/parameters (?)
      // todo show enum display value but actual value
    }

    yield put({
      type: 'JOB_DETAILS_FETCH_SUCCESS',
      payload: { app, job, display }
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
