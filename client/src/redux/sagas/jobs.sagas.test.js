import { expectSaga, testSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import * as matchers from 'redux-saga-test-plan/matchers';
import {
  jobs as jobsReducer,
  jobDetail as jobDetailReducer,
  initialState as jobsInitalState,
} from '../reducers/jobs.reducers';

import {
  fetchJobDetailsUtil,
  getJobDetails,
  postSubmitJobUtil,
  watchJobDetails,
  submitJob,
  getJobs,
  fetchJobs,
  selectorNotificationsListNotifs,
  selectorJobsReachedEnd,
  watchJobs,
} from './jobs.sagas';
import { fetchAppDefinitionUtil } from './apps.sagas';
import executionSystemDetailFixture from './fixtures/executionsystemdetail.fixture';
import jobDetailFixture from './fixtures/jobdetail.fixture';
import appDetailFixture from './fixtures/appdetail.fixture';
import jobSubmitFixture from './fixtures/jobSubmit.fixture';
import jobDetailDisplayFixture from './fixtures/jobdetaildisplay.fixture';
import jobsListFixture from './fixtures/jobsList.fixture';
import { notificationsListFixture } from './fixtures/notificationsList.fixture';

jest.mock('cross-fetch');

const JOBS_LIST_LIMIT = 50;

const initialJobDetail = {
  jobId: null,
  app: null,
  job: null,
  display: null,
  loading: false,
  loadingError: false,
  loadingErrorMessage: '',
};

describe('getJobDetails Saga', () => {
  it("should fetch a job's detail and transform it to a displayable state", () =>
    expectSaga(getJobDetails, { payload: { jobId: 'job_id' } })
      .withReducer(jobDetailReducer)
      .provide([
        [matchers.call.fn(fetchJobDetailsUtil), jobDetailFixture],
        [matchers.call.fn(fetchAppDefinitionUtil), appDetailFixture],
      ])
      .put({ type: 'JOB_DETAILS_FETCH_STARTED', payload: 'job_id' })
      .call(fetchJobDetailsUtil, 'job_id')
      .call(
        fetchAppDefinitionUtil,
        'prtl.clone.username.FORK.compress-0.1u3-3.0'
      )
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
        jobId: 'job_id',
        loading: false,
        loadingError: false,
        loadingErrorMessage: '',
        job: jobDetailFixture,
        display: jobDetailDisplayFixture,
      })
      .run());
});

test('Effect Creators should dispatch sagas', () => {
  testSaga(watchJobDetails)
    .next()
    .takeLatest('GET_JOB_DETAILS', getJobDetails)
    .next()
    .isDone();
  testSaga(watchJobs)
    .next()
    .takeLatest('GET_JOBS', getJobs)
    .next()
    .takeLeading('SUBMIT_JOB', submitJob)
    .next()
    .isDone();
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
      .call(fetchJobs, 0, JOBS_LIST_LIMIT)
      .put({
        type: 'JOBS_LIST',
        payload: {
          list: jobsListFixture,
          reachedEnd: jobsListFixture.length < JOBS_LIST_LIMIT,
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
  it('with offset = 51, it should return without updating the jobs state', () =>
    expectSaga(getJobs, { params: { offset: 51 } })
      .withReducer(jobsReducer)
      .provide([[matchers.select.selector(selectorJobsReachedEnd), true]])
      .hasFinalState({
        ...jobsInitalState,
      })
      .run());
  it('with error from fetchJobs, the saga should catch the error and set the jobs state appropriately', () =>
    expectSaga(getJobs, { params: { offset: 0 } })
      .withReducer(jobsReducer)
      .provide([
        [matchers.call.fn(fetchJobs), throwError(new Error('test error'))],
      ])
      .put({ type: 'JOBS_LIST_INIT' })
      .put({ type: 'JOBS_LIST_START' })
      .call(fetchJobs, 0, JOBS_LIST_LIMIT)
      .put({ type: 'JOBS_LIST_ERROR', payload: 'error' })
      .put({ type: 'JOBS_LIST_FINISH' })
      .hasFinalState({
        ...jobsInitalState,
        error: 'error',
      })
      .run());
});
