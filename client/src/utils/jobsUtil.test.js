import { getAllocationFromAppId, getSystemName } from './jobsUtil';

describe('jobsUtil', () => {
  it('get allocation from app id', () => {
    expect(getAllocationFromAppId('prtl.clone.nathanf.TACC-ACI.namd-frontera-2.1.3-8.0')).toEqual('TACC-ACI');
    expect(getAllocationFromAppId('prtl.clone.nathanf.TACC-ACI.WRONG')).toEqual(null);
    expect(getAllocationFromAppId('my_private_app')).toEqual(null);
  });
});

describe('jobsUtil', () => {
  it('get system name from host', () => {
    expect(getSystemName('stampede2.tacc.utexas.edu')).toEqual('Stampede2');
  });
});
