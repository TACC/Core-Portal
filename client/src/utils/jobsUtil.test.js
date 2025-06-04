import {
  getAllocatonFromDirective,
  getJobDisplayInformation,
  getOutputPath,
  getExecutionPath,
  isTerminalState,
  isOutputState,
  getParentPath,
} from './jobsUtil';
import jobDetailFixture from '../redux/sagas/fixtures/jobdetail.fixture';
import jobDetailSlurmFixture from '../redux/sagas/fixtures/jobdetailSlurm.fixture';
import appDetailFixture from '../redux/sagas/fixtures/appdetail.fixture';
import appDetailSlurmFixture from '../redux/sagas/fixtures/appdetailSlurm.fixture';
import jobDetailDisplayFixture from '../redux/sagas/fixtures/jobdetaildisplay.fixture';
import jobDisplaySlurmFixture from '../redux/sagas/fixtures/jobdetaildisplaySlurm.fixture';

describe('jobsUtil', () => {
  it('get allocation from execution system queue directive', () => {
    expect(getAllocatonFromDirective('-A TACC-ACI')).toEqual('TACC-ACI');
    expect(getAllocatonFromDirective('-A TACC-ACI -Foo Bar')).toEqual(
      'TACC-ACI'
    );
    expect(getAllocatonFromDirective('-Ab Test')).toEqual(null);
    expect(getAllocatonFromDirective('')).toEqual(null);
  });

  it('get job display information', () => {
    expect(
      getJobDisplayInformation(jobDetailSlurmFixture, appDetailSlurmFixture)
    ).toEqual(jobDisplaySlurmFixture);
    expect(
      getJobDisplayInformation(jobDetailFixture, appDetailFixture)
    ).toEqual(jobDetailDisplayFixture);
  });

  it('get output path from job', () => {
    expect(getOutputPath(jobDetailFixture)).toEqual(
      'cloud.data/home/user/tapis-jobs-archive/2023-01-24Z/hello-world_2023-01-24T23:52:57-e929ad16-adc5-4bd4-b84f-d41d1b67e5ee-007'
    );
  });

  it('get execution path from job', () => {
    expect(getExecutionPath(jobDetailFixture)).toEqual(
      'frontera/scratch1/12345/user/tapis/e929ad16-adc5-4bd4-b84f-d41d1b67e5ee-007'
    );
  });

  it('determine if terminal state', () => {
    expect(isTerminalState('FAILED')).toEqual(true);
    expect(isTerminalState('FINISHED')).toEqual(true);
    expect(isTerminalState('CANCELLED')).toEqual(true);
    expect(isTerminalState('RUNNING')).toEqual(false);
  });

  it('determine if job state could have output', () => {
    expect(isOutputState('FAILED')).toEqual(true);
    expect(isOutputState('FINISHED')).toEqual(true);
    expect(isOutputState('STOPPED')).toEqual(false);
    expect(isOutputState('RUNNING')).toEqual(false);
  });

  it('returns directory path when file is in a folder', () => {
    const file = { name: 'test.txt', path: 'outerTestFolder/innerTestFolder/test.txt'};
    expect(getParentPath(file)).toEqual('outerTestFolder/innerTestFolder/');
  });

  it("returns '.' when file is at root of system", () => {
    const file = { name: 'test.txt', path: 'test.txt'};
    expect(getParentPath(file)).toEqual('.');
  });
});
