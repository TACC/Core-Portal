import { cloneDeep } from 'lodash';
import {
  namdAppFixture,
  namdDefaultFormValues,
} from './fixtures/AppForm.app.fixture';
import {
  getNodeCountValidation,
  getQueueValidation,
  getFixedValuesForUpdatedQueue,
} from './AppFormUtils';

describe('AppFormUtils', () => {
  const normalQueue = namdAppFixture.exec_sys.queues.find(
    (q) => q.name === 'normal'
  );
  const smallQueue = namdAppFixture.exec_sys.queues.find(
    (q) => q.name === 'small'
  );

  const serialFronteraApp = {
    ...namdAppFixture,
    definition: {
      ...namdAppFixture.definition,
      parallelism: 'SERIAL',
    },
  };

  it('handles node count validation on Frontera', () => {
    expect(
      getNodeCountValidation(normalQueue, namdAppFixture).isValidSync(1)
    ).toEqual(false);
    expect(
      getNodeCountValidation(normalQueue, namdAppFixture).isValidSync(3)
    ).toEqual(true);
    expect(
      getNodeCountValidation(smallQueue, namdAppFixture).isValidSync(1)
    ).toEqual(true);
    expect(
      getNodeCountValidation(smallQueue, namdAppFixture).isValidSync(3)
    ).toEqual(false);
  });

  it('handles node count validation on non-Frontera HPCs', () => {
    const stampede2App = cloneDeep(namdAppFixture);
    stampede2App.exec_sys.login.host = 'stampede2.tacc.utexas.edu';
    expect(
      getNodeCountValidation(normalQueue, stampede2App).isValidSync(1)
    ).toEqual(true);
    expect(
      getNodeCountValidation(normalQueue, stampede2App).isValidSync(3)
    ).toEqual(true);
  });

  it('handles queue validation on Frontera HPCs for SERIAL apps', () => {
    expect(
      getQueueValidation(smallQueue, serialFronteraApp).isValidSync('small')
    ).toEqual(true);
    expect(
      getQueueValidation(normalQueue, serialFronteraApp).isValidSync('normal')
    ).toEqual(false);
  });

  it('handles queue validation on non-Frontera HPCs for SERIAL apps', () => {
    const stampede2SerialApp = cloneDeep(namdAppFixture);
    stampede2SerialApp.exec_sys.login.host = 'stampede2.tacc.utexas.edu';
    expect(
      getQueueValidation(smallQueue, stampede2SerialApp).isValidSync('small')
    ).toEqual(true);
    expect(
      getQueueValidation(normalQueue, stampede2SerialApp).isValidSync('normal')
    ).toEqual(true);
  });

  it('getFixedValuesForUpdatedQueue fixes node count when using small queue', () => {
    const appFrontera = cloneDeep(namdAppFixture);
    const values = cloneDeep(namdDefaultFormValues);
    values.batchQueue = 'small';
    values.nodeCount = 3;
    const updatedValues = getFixedValuesForUpdatedQueue(appFrontera, values);
    expect(updatedValues.nodeCount).toEqual(2);
  });

  it('getFixedValuesForUpdatedQueue fixes node count when using normal queue', () => {
    const appFrontera = cloneDeep(namdAppFixture);
    const values = cloneDeep(namdDefaultFormValues);
    values.batchQueue = 'normal';
    values.nodeCount = 2;
    const updatedValues = getFixedValuesForUpdatedQueue(appFrontera, values);
    expect(updatedValues.nodeCount).toEqual(3);
  });

  it('getFixedValuesForUpdatedQueue fixes processorsOnEachNode', () => {
    const appFrontera = cloneDeep(namdAppFixture);
    const values = cloneDeep(namdDefaultFormValues);
    values.batchQueue = 'development';
    values.processorsOnEachNode = 64;
    const updatedValues = getFixedValuesForUpdatedQueue(appFrontera, values);
    /* should to be 56 (i.e. 2240/40) on development queue */
    expect(updatedValues.processorsOnEachNode).toEqual(56);
  });
});
