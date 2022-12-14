import { call, put, select, takeLatest, takeLeading } from 'redux-saga/effects';
import Cookies from 'js-cookie';
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

// TODOV3: For retaining job data during v3 transition
export async function fetchV2Jobs(offset, limit) {
  const result = await fetchUtil({
    url: '/api/workspace/jobsv2/',
    params: { offset, limit },
  });
  // return result.response;
  return [
    {
      id: '3b03cb52-3951-4b05-8833-27af89b937e9-007',
      name: 'Compressing Files',
      appId: 'prtl.clone.ipark.FORK.zippy-0.2u2-2.0',
      ended: '2020-05-01T14:45:15.485Z',
      owner: 'ipark',
      roles:
        'Internal/PORTALS_ipark__cli-portals-ipark-localhost_PRODUCTION,Internal/PORTALS_ipark__cli-portals-ipark-20e6cb6628c5_PRODUCTION,Internal/PORTALS_ipark_DefaultApplication_PRODUCTION,Internal/everyone,Internal/PORTALS_ipark__cli-portals-ipark-9bc2fcf24b37_PRODUCTION,Internal/PORTALS_ipark__cli-portals-ipark-c65dd3106f9d_PRODUCTION',
      _links: {
        app: {
          href: 'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.ipark.FORK.zippy-0.2u2-2.0',
        },
        self: {
          href: 'https://portals-api.tacc.utexas.edu/jobs/v2/3b03cb52-3951-4b05-8833-27af89b937e9-007',
        },
        owner: {
          href: 'https://portals-api.tacc.utexas.edu/profiles/v2/ipark',
        },
        history: {
          href: 'https://portals-api.tacc.utexas.edu/jobs/v2/3b03cb52-3951-4b05-8833-27af89b937e9-007/history',
        },
        metadata: {
          href: 'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%223b03cb52-3951-4b05-8833-27af89b937e9-007%22%7D',
        },
        archiveData: {
          href: 'https://portals-api.tacc.utexas.edu/files/v2/listings/system/frontera.home.username/archive/jobs/2020-07-09/compress-0-1u3_2020-07-09t15-56-37-c55ecc23-a098-40f5-aea9-9baa99306e3a-007',
        },
        permissions: {
          href: 'https://portals-api.tacc.utexas.edu/jobs/v2/3b03cb52-3951-4b05-8833-27af89b937e9-007/pems',
        },
        notification: [
          {
            href: 'https://portals-api.tacc.utexas.edu/notifications/v2/b9003d00-2237-4c21-ab82-683c5ecf688f-011',
            title: '*',
          },
          {
            href: 'https://portals-api.tacc.utexas.edu/notifications/v2/685aed88-807c-4626-8469-707f34994a9d-011',
            title: '*',
          },
          {
            href: 'https://portals-api.tacc.utexas.edu/notifications/v2/83a01e6f-e142-4827-920a-b48a5c64345b-011',
            title: '*',
          },
          {
            href: 'https://portals-api.tacc.utexas.edu/notifications/v2/03087a6b-dbe4-4379-91ba-b855badd7b0c-011',
            title: '*',
          },
          {
            href: 'https://portals-api.tacc.utexas.edu/notifications/v2/4abf661d-41d7-4256-8a14-2a8b384d7870-011',
            title: '*',
          },
          {
            href: 'https://portals-api.tacc.utexas.edu/notifications/v2/874294cc-bc67-4e50-bdd8-c6f64a71b212-011',
            title: '*',
          },
          {
            href: 'https://portals-api.tacc.utexas.edu/notifications/v2/b4c3aaef-7ba8-4d0c-ae34-c519b0f81edc-011',
            title: '*',
          },
          {
            href: 'https://portals-api.tacc.utexas.edu/notifications/v2/ca7564e2-1872-4d27-bc23-a97e31c179d6-011',
            title: '*',
          },
          {
            href: 'https://portals-api.tacc.utexas.edu/notifications/v2/70405e54-a561-42d6-ae65-28004bca4979-011',
            title: '*',
          },
          {
            href: 'https://portals-api.tacc.utexas.edu/notifications/v2/4f543302-6166-4012-bc93-c46ede55ed87-011',
            title: '*',
          },
          {
            href: 'https://portals-api.tacc.utexas.edu/notifications/v2/748721a9-dea6-4930-9c98-146d65aed0d3-011',
            title: '*',
          },
        ],
        archiveSystem: {
          href: 'https://portals-api.tacc.utexas.edu/systems/v2/cloud.corral.work.ipark',
        },
        notifications: {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/?associatedUuid=3b03cb52-3951-4b05-8833-27af89b937e9-007',
        },
        executionSystem: {},
      },
      inputs: {
        inputFiles: [
          'agave://cloud.corral.work.ipark/.agave%282%29%281%29.log',
        ],
      },
      status: 'FINISHED',
      appUuid: '6416433200988033516-242ac117-0001-005',
      archive: true,
      created: '2022-12-12T20:52:12.353Z',
      visible: true,
      accepted: '2022-12-12T20:52:12.345Z',
      maxHours: 2.0,
      systemId: 'test.exec.system',
      tenantId: 'portals',
      workPath:
        '/work/04004/username/username/job-c55ecc23-a098-40f5-aea9-9baa99306e3a-007-compress-0-1u3_2020-07-09t15-56-37',
      _embedded: {
        metadata: [],
      },
      nodeCount: 0,
      archiveUrl: '/workbench/data-depot/agave/cloud.corral.work.ipark/',
      jupyterUrl:
        'https://staging.jupyter.tacc.cloud/user/ipark/tree/tacc-work//',
      parameters: {
        filenames: '".agave(2)(1).log" ',
        zipfileName: '.agave(2)(1).log.zip',
        compression_type: 'zip',
      },
      archivePath:
        'archive/jobs/2020-07-09/compress-0-1u3_2020-07-09t15-56-37-c55ecc23-a098-40f5-aea9-9baa99306e3a-007',
      lastUpdated: '2022-12-12T20:52:12.353Z',
      remoteEnded: '2020-05-01T14:45:15.485Z',
      remoteJobId: 'None',
      remoteQueue: 'None',
      tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
      blockedCount: 0,
      archiveSystem: 'cloud.corral.work.ipark',
      memoryPerNode: 0.0,
      remoteOutcome: 'None',
      remoteStarted: 'None',
      submitRetries: 0,
      schedulerJobId: 'None',
      lastStatusCheck: 'None',
      remoteSubmitted: 'None',
      archiveOnAppError: false,
      lastStatusMessage: 'JOBS_ACCEPTED Job accepted for processing.',
      processorsPerNode: 0,
      failedStatusChecks: 0,
      remoteStatusChecks: 0,
    },
    // {
    //   id: '44e27d58-11ef-4839-8856-d722d788379f-007',
    //   name: 'test-job-name-1',
    //   owner: 'username',
    //   systemId: 'test.exec.system',
    //   appId: 'test-app',
    //   created: '2020-05-01T14:44:46.000Z',
    //   status: 'FINISHED',
    //   remoteStarted: '2020-05-01T14:45:15.485Z',
    //   ended: '2020-05-01T14:49:42.067Z',
    //   _links: {
    //     self: {
    //       href: 'https://portals-api.tacc.utexas.edu/jobs/v2/44e27d58-11ef-4839-8856-d722d788379f-007',
    //     },
    //     archiveData: {
    //       href: 'https://portals-api.tacc.utexas.edu/files/v2/listings/system/frontera.home.username/archive',
    //     },
    //   },
    // },
  ];
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

// TODOV3: For retaining job data during v3 transition
export function* getV2Jobs(action) {
  if ('offset' in action.params && action.params.offset === 0) {
    yield put({ type: 'JOBS_V2_LIST_INIT' });
  } else {
    const reachedEnd = yield select((state) => state.jobsv2.reachedEnd);
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
  yield takeLatest('GET_V2_JOBS', getV2Jobs);
  yield takeLeading('SUBMIT_JOB', submitJob);
}

export function* watchJobDetails() {
  yield takeLatest('GET_JOB_DETAILS', getJobDetails);
}
