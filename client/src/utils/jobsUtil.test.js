import {
  getAllocatonFromDirective,
  getJobDisplayInformation,
  getOutputPath,
  isTerminalState,
  isOutputState,
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

  it('get app display information', () => {
    expect(
      getJobDisplayInformation(jobDetailSlurmFixture, appDetailSlurmFixture)
    ).toEqual(jobDisplaySlurmFixture);
    expect(
      getJobDisplayInformation(jobDetailFixture, appDetailFixture)
    ).toEqual(jobDetailDisplayFixture);
  });

  it('get output path from job', () => {
    expect(getOutputPath(jobDetailFixture)).toEqual(
      'test.community/archive/1/user/system/archive/1'
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
});
