import { expectSaga, testSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';
import { jobDetail as jobDetailReducer } from '../reducers/jobs.reducers';

import {
  fetchJobDetailsUtil,
  fetchAppDetailsUtil,
  getJobDetails,
  watchJobDetails
} from './jobs.sagas';
import jobDetailFixture from './fixtures/jobdetail.fixture';
import appDetailFixture from './fixtures/appdetail.fixture';
import jobDetailDisplayFixture from './fixtures/jobdetaildisplay.fixture';

jest.mock('cross-fetch');

const initialJobDetail = {
  jobId: null,
  app: null,
  job: null,
  display: null,
  loading: false,
  loadingError: false,
  loadingErrorMessage: ''
};

describe('getJobDetails Saga', () => {
  it("should fetch a job's detail and transform it to a displayable state", () =>
    expectSaga(getJobDetails, { payload: { jobId: 'job_id' } })
      .withReducer(jobDetailReducer)
      .provide([
        [matchers.call.fn(fetchJobDetailsUtil), jobDetailFixture],
        [matchers.call.fn(fetchAppDetailsUtil), appDetailFixture]
      ])
      .put({ type: 'JOB_DETAILS_FETCH_STARTED', payload: 'job_id' })
      .call(fetchJobDetailsUtil, 'job_id')
      .call(fetchAppDetailsUtil, 'prtl.clone.username.FORK.compress-0.1u3-3.0')
      .put({
        type: 'JOB_DETAILS_FETCH_SUCCESS',
        payload: {
          app: appDetailFixture,
          job: jobDetailFixture,
          display: jobDetailDisplayFixture
        }
      })

      .hasFinalState({
        ...initialJobDetail,
        jobId: 'job_id',
        loading: false,
        loadingError: false,
        loadingErrorMessage: '',
        app: appDetailFixture,
        job: jobDetailFixture,
        display: jobDetailDisplayFixture
      })
      .run());
});

test('Effect Creators should dispatch sagas', () => {
  testSaga(watchJobDetails)
    .next()
    .takeLatest('GET_JOB_DETAILS', getJobDetails)
    .next()
    .isDone();
});
