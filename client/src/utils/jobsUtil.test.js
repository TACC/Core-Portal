import {
  getAllocatonFromDirective,
  getJobDisplayInformation,
  getOutputPathFromHref,
  isTerminalState,
  isOutputState
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

  it('get output path from _links.archiveData.href', () => {
    expect(
      getOutputPathFromHref(
        'https://portals-api.tacc.utexas.edu/files/v2/listings/system/frontera.home.mmustermann/archive/jobs/2020-08-20/some_ouptut_folder'
      )
    ).toEqual(
      'frontera.home.mmustermann/archive/jobs/2020-08-20/some_ouptut_folder'
    );
    expect(
      getOutputPathFromHref(
        'https://portals-api.tacc.utexas.edu/jobs/v2/df589633-73a8-4e34-a670-5967474d91df-007/outputs/listings'
      )
    ).toEqual(null);
  });

  it('determine if terminal state', () => {
    expect(isTerminalState('FAILED')).toEqual(true);
    expect(isTerminalState('FINISHED')).toEqual(true);
    expect(isTerminalState('STOPPED')).toEqual(true);
    expect(isTerminalState('RUNNING')).toEqual(false);
  });

  it('determine if job state could have output', () => {
    expect(isOutputState('FAILED')).toEqual(true);
    expect(isOutputState('FINISHED')).toEqual(true);
    expect(isOutputState('STOPPED')).toEqual(false);
    expect(isOutputState('RUNNING')).toEqual(false);
  });
});
