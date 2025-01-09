import { expectSaga, testSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import * as matchers from 'redux-saga-test-plan/matchers';
import { vi } from 'vitest';
import {
  jobs as jobsReducer,
  // TODOv3: dropV2Jobs
  jobsv2 as jobsV2Reducer,
  jobDetail as jobDetailReducer,
  initialState as jobsInitalState,
  // TODOv3: dropV2Jobs
  initialStateV2 as jobsV2InitalState,
} from '../reducers/jobs.reducers';

import {
  fetchJobDetailsUtil,
  getJobDetails,
  postSubmitJobUtil,
  watchJobDetails,
  submitJob,
  getJobs,
  // TODOv3: dropV2Jobs
  getV2Jobs,
  fetchJobs,
  // TODOv3: dropV2Jobs
  fetchV2Jobs,
  selectorNotificationsListNotifs,
  selectorJobsReachedEnd,
  // TODOv3: dropV2Jobs
  selectorJobsV2ReachedEnd,
  watchJobs,
  LIMIT,
} from './jobs.sagas';
import { fetchAppDefinitionUtil } from './apps.sagas';
import executionSystemDetailFixture from './fixtures/executionsystemdetail.fixture';
import jobDetailFixture from './fixtures/jobdetail.fixture';
import appDetailFixture from './fixtures/appdetail.fixture';
import jobSubmitFixture from './fixtures/jobSubmit.fixture';
import jobDetailDisplayFixture from './fixtures/jobdetaildisplay.fixture';
import {
  jobsListFixture,
  // TODOv3: dropV2Jobs
  jobsV2ListFixture,
} from './fixtures/jobsList.fixture';
import { notificationsListFixture } from './fixtures/notificationsList.fixture';

vi.mock('cross-fetch');

const initialJobDetail = {
  app: null,
  job: null,
  display: null,
  loading: false,
  loadingError: false,
  loadingErrorMessage: '',
};

describe('getJobDetails Saga', () => {
  it("should fetch a job's detail and transform it to a displayable state", () =>
    expectSaga(getJobDetails, {
      payload: { jobUuid: 'e929ad16-adc5-4bd4-b84f-d41d1b67e5ee-007' },
    })
      .withReducer(jobDetailReducer)
      .provide([
        [matchers.call.fn(fetchJobDetailsUtil), jobDetailFixture],
        [matchers.call.fn(fetchAppDefinitionUtil), appDetailFixture],
      ])
      .put({
        type: 'JOB_DETAILS_FETCH_STARTED',
        payload: 'e929ad16-adc5-4bd4-b84f-d41d1b67e5ee-007',
      })
      .call(fetchJobDetailsUtil, 'e929ad16-adc5-4bd4-b84f-d41d1b67e5ee-007')
      .call(fetchAppDefinitionUtil, 'hello-world', '0.0.1')
      .put({
        type: 'JOB_DETAILS_FETCH_SUCCESS',
        payload: {
          app: appDetailFixture,
          job: jobDetailFixture,
        },
      })
      .put({
        type: 'JOBS_LIST_UPDATE_JOB',
        payload: {
          job: jobDetailFixture,
        },
      })

      .hasFinalState({
        ...initialJobDetail,
        jobUuid: 'e929ad16-adc5-4bd4-b84f-d41d1b67e5ee-007',
        loading: false,
        loadingError: false,
        loadingErrorMessage: '',
        job: jobDetailFixture,
        display: jobDetailDisplayFixture,
      })
      .run());
});

describe('submitJob Saga', () => {
  it('should submit a job', () =>
    expectSaga(submitJob, {
      payload: jobSubmitFixture,
    })
      .withReducer(jobsReducer)
      .provide([
        [
          matchers.call.fn(postSubmitJobUtil),
          { response: jobDetailFixture } /* TODO: fix response */,
        ],
      ])
      .put({ type: 'FLUSH_SUBMIT' })
      .put({ type: 'TOGGLE_SUBMITTING' })
      .call(postSubmitJobUtil, jobSubmitFixture)
      .put({
        type: 'SUBMIT_JOB_SUCCESS',
        payload: jobDetailFixture,
      })
      .hasFinalState({
        ...jobsInitalState,
        submit: {
          ...jobsInitalState.submit,
          error: false,
          response: jobDetailFixture,
          submitting: true /* submitting stays `true` after successful submission as AppForm.js scrolls user to top of
           page before dispatching TOGGLE_SUBMITTING */,
        },
      })
      .run());
  it('should open a push-key modal when submitting a job for system requiring keys', () =>
    expectSaga(submitJob, {
      payload: jobSubmitFixture,
    })
      .withReducer(jobsReducer)
      .provide([
        [
          matchers.call.fn(postSubmitJobUtil),
          { response: { execSys: executionSystemDetailFixture } },
        ],
      ])
      .put({ type: 'FLUSH_SUBMIT' })
      .put({ type: 'TOGGLE_SUBMITTING' })
      .call(postSubmitJobUtil, jobSubmitFixture)
      .put({
        type: 'SYSTEMS_TOGGLE_MODAL',
        payload: {
          operation: 'pushKeys',
          props: {
            onSuccess: {
              type: 'SUBMIT_JOB',
              payload: jobSubmitFixture,
            },
            system: executionSystemDetailFixture,
          },
        },
      })
      .put({ type: 'TOGGLE_SUBMITTING' })
      .hasFinalState({
        ...jobsInitalState,
        submit: {
          ...jobsInitalState.submit,
          submitting: false,
        },
      })
      .run());
});

describe('getJobs Saga', () => {
  it('with offset = 0, it should fetch jobs list and set jobs state appropriately', () =>
    expectSaga(getJobs, { params: { offset: 0 } })
      .withReducer(jobsReducer)
      .provide([
        [matchers.call.fn(fetchJobs), jobsListFixture],
        [
          matchers.select.selector(selectorNotificationsListNotifs),
          notificationsListFixture.notifs,
        ],
      ])
      .put({ type: 'JOBS_LIST_INIT' })
      .put({ type: 'JOBS_LIST_START' })
      .call(fetchJobs, 0, LIMIT, '')
      .put({
        type: 'JOBS_LIST',
        payload: {
          list: jobsListFixture,
          reachedEnd: jobsListFixture.length < LIMIT,
        },
      })
      .put({ type: 'JOBS_LIST_FINISH' })
      .put({
        type: 'UPDATE_JOBS_FROM_NOTIFICATIONS',
        payload: notificationsListFixture.notifs,
      })
      .hasFinalState({
        list: jobsListFixture,
        submit: { submitting: false },
        loading: false,
        reachedEnd: true,
        error: null,
      })
      .run());
  it('with offset = 51 and reachedEnd = true, it should return without updating the jobs state', () =>
    expectSaga(getJobs, { params: { offset: 51 } })
      .withReducer(jobsReducer)
      .provide([[matchers.select.selector(selectorJobsReachedEnd), true]])
      .hasFinalState({
        ...jobsInitalState,
      })
      .run());
  it('with error from fetchJobs, the saga should catch the error and set the jobs state accordingly', () =>
    expectSaga(getJobs, { params: { offset: 0 } })
      .withReducer(jobsReducer)
      .provide([
        [matchers.call.fn(fetchJobs), throwError(new Error('test error'))],
      ])
      .put({ type: 'JOBS_LIST_INIT' })
      .put({ type: 'JOBS_LIST_START' })
      .call(fetchJobs, 0, LIMIT, '')
      .put({ type: 'JOBS_LIST_ERROR', payload: 'error' })
      .put({ type: 'JOBS_LIST_FINISH' })
      .hasFinalState({
        ...jobsInitalState,
        error: 'error',
      })
      .run());
});

// TODOv3: dropV2Jobs
describe('getV2Jobs Saga', () => {
  it('with offset = 0, it should fetch v2 jobs list and set jobs state appropriately', () =>
    expectSaga(getV2Jobs, { params: { offset: 0 } })
      .withReducer(jobsV2Reducer)
      .provide([[matchers.call.fn(fetchV2Jobs), jobsV2ListFixture]])
      .put({ type: 'JOBS_V2_LIST_INIT' })
      .put({ type: 'JOBS_V2_LIST_START' })
      .call(fetchV2Jobs, 0, LIMIT)
      .put({
        type: 'JOBS_V2_LIST',
        payload: {
          list: jobsV2ListFixture,
          reachedEnd: jobsV2ListFixture.length < LIMIT,
        },
      })
      .put({ type: 'JOBS_V2_LIST_FINISH' })
      .hasFinalState({
        list: jobsV2ListFixture,
        submit: { submitting: false },
        loading: false,
        reachedEnd: true,
        error: null,
      })
      .run());
  // TODOv3: dropV2Jobs
  it('with offset = 51 and reachedEnd = true, it should return without updating the jobs state', () =>
    expectSaga(getV2Jobs, { params: { offset: 51 } })
      .withReducer(jobsV2Reducer)
      .provide([[matchers.select.selector(selectorJobsV2ReachedEnd), true]])
      .hasFinalState({
        ...jobsV2InitalState,
      })
      .run());
  // TODOv3: dropV2Jobs
  it('with error from fetchV2Jobs, the saga should catch the error and set the jobs state accordingly', () =>
    expectSaga(getV2Jobs, { params: { offset: 0 } })
      .withReducer(jobsV2Reducer)
      .provide([
        [matchers.call.fn(fetchV2Jobs), throwError(new Error('test error'))],
      ])
      .put({ type: 'JOBS_V2_LIST_INIT' })
      .put({ type: 'JOBS_V2_LIST_START' })
      .call(fetchV2Jobs, 0, LIMIT)
      .put({ type: 'JOBS_V2_LIST_ERROR', payload: 'error' })
      .put({ type: 'JOBS_V2_LIST_FINISH' })
      .hasFinalState({
        ...jobsV2InitalState,
        error: 'error',
      })
      .run());
});
