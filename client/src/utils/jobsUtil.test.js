import { getAllocatonFromDirective, getSystemName, getJobDisplayInformation } from './jobsUtil';
import jobDetailFixture from '../redux/sagas/fixtures/jobdetail.fixture';
import jobDetailSlurmFixture from '../redux/sagas/fixtures/jobdetailSlurm.fixture';
import appDetailFixture from '../redux/sagas/fixtures/appdetail.fixture';
import appDetailSlurmFixture from '../redux/sagas/fixtures/appdetailSlurm.fixture'
import jobDetailDisplayFixture from '../redux/sagas/fixtures/jobdetaildisplay.fixture';
import jobDisplaySlurmFixture from '../redux/sagas/fixtures/jobdetaildisplaySlurm.fixture';

describe('jobsUtil', () => {
  it('get allocation from execution system queue directive', () => {
    expect(getAllocatonFromDirective('-A TACC-ACI')).toEqual('TACC-ACI');
    expect(getAllocatonFromDirective('-A TACC-ACI -Foo Bar')).toEqual('TACC-ACI');
    expect(getAllocatonFromDirective('-Ab Test')).toEqual(null);
    expect(getAllocatonFromDirective('')).toEqual(null);
  });

  it('get app display information', () => {
    expect(getJobDisplayInformation(jobDetailSlurmFixture, appDetailSlurmFixture)).toEqual(jobDisplaySlurmFixture);
    expect(getJobDisplayInformation(jobDetailFixture, appDetailFixture)).toEqual(jobDetailDisplayFixture);
  });

  it('get system name from host', () => {
    expect(getSystemName('stampede2.tacc.utexas.edu')).toEqual('Stampede2');
  });
});