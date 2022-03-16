import { jobs, initialState } from '../jobs.reducers';
import jobDetailFixture from '../../sagas/fixtures/jobdetail.fixture';

describe('Job Detail Reducer', () => {
  test('Load initial state', () => {
    expect(jobs(initialState, { type: undefined })).toEqual(initialState);
  });
  test('Jobs list update job', () => {
    const jobOutputLocationPopulated = {
      ...jobDetailFixture,
      outputLocation: '//data/files/example',
    };
    const jobsListUpdateJobAction = {
      type: 'JOBS_LIST_UPDATE_JOB',
      payload: jobOutputLocationPopulated,
    };
    expect(jobs(initialState, jobsListUpdateJobAction)).toEqual(
      { ...initialState },
      {
        jobOutputLocationPopulated,
      }
    );
  });
});
