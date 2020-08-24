import {
  getSystemName,
  findSystemName
} from './systems';

describe('systems utility functions', () => {
  it('get system name from host', () => {
    expect(getSystemName('stampede2.tacc.utexas.edu')).toEqual('Stampede2');
  });
});
