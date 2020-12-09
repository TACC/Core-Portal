import {
  getSystemName,
  findSystemDisplayName
} from './systems';
import systemsFixture from '../components/DataFiles/fixtures/DataFiles.systems.fixture'


describe('systems utility functions', () => {
  it('get system name from host', () => {
    expect(getSystemName('stampede2.tacc.utexas.edu')).toEqual('Stampede2');
  });
  it('get system name from host', () => {
    const systemList = systemsFixture.systemList;
    expect(findSystemDisplayName(systemList, 'frontera.home.username')).toEqual('My Data (Frontera)');
    expect(findSystemDisplayName(systemList, 'frontera.foo.bar')).toEqual('Frontera');
  });
});
