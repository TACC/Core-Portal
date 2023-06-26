import { jobs, initialState } from '../jobs.reducers';
import jobDetailFixture from '../../sagas/fixtures/jobdetail.fixture';

describe('Job Detail Reducer', () => {
  test('Load initial state', () => {
    expect(jobs(initialState, { type: undefined })).toEqual(initialState);
  });

  test('Jobs list update job', () => {
    const jobOutputLocationPopulated = {
      ...jobDetailFixture,
      outputLocation:
        'cloud.data/home/user/tapis-jobs-archive/2023-01-24Z/hello-world_2023-01-24T23:52:57-e929ad16-adc5-4bd4-b84f-d41d1b67e5ee-007',
    };
    const jobsListUpdateJobAction = {
      type: 'JOBS_LIST_UPDATE_JOB',
      payload: { job: jobOutputLocationPopulated },
    };
    const jobsInitialState = { ...initialState, list: [jobDetailFixture] };

    expect(jobs(jobsInitialState, jobsListUpdateJobAction)).toEqual({
      ...jobsInitialState,
      list: [jobOutputLocationPopulated],
    });
  });
});
