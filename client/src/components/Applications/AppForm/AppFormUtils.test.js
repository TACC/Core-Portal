import { cloneDeep } from 'lodash';
import {
  namdAppFixture,
  namdDefaultFormValues,
} from './fixtures/AppForm.app.fixture';
import {
  getNodeCountValidation,
  getQueueValidation,
  updateValuesForQueue,
} from './AppFormUtils';

// TODOv3 update fixture and fix tests
describe.skip('AppFormUtils', () => {
  /*  TODOv3 update fixture and fix tests
  const normalQueue = namdAppFixture.batchLogicalQueues.queues.find(
    (q) => q.name === 'normal'
  );
  const smallQueue = namdAppFixture.batchLogicalQueues.queues.find(
    (q) => q.name === 'small'
  );

  const serialFronteraApp = {
    ...namdAppFixture,
    definition: {
      ...namdAppFixture.definition,
      parallelism: 'SERIAL',
    },
  };
  
   */

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
    const stampede2App = cloneDeep(parallelFronteraApp);
    stampede2App.exec_sys.host = 'stampede2.tacc.utexas.edu';
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

  it('updateValuesForQueue updates node count when using small queue', () => {
    const appFrontera = cloneDeep(namdAppFixture);
    const values = cloneDeep(namdDefaultFormValues);
    values.batchQueue = 'small';
    values.nodeCount = 3;
    const updatedValues = updateValuesForQueue(appFrontera, values);
    expect(updatedValues.nodeCount).toEqual(2);
  });

  it('updateValuesForQueue updates node count when using normal queue', () => {
    const appFrontera = cloneDeep(namdAppFixture);
    const values = cloneDeep(namdDefaultFormValues);
    values.batchQueue = 'normal';
    values.nodeCount = 2;
    const updatedValues = updateValuesForQueue(appFrontera, values);
    expect(updatedValues.nodeCount).toEqual(3);
  });

  it('updateValuesForQueue updates processorsOnEachNode', () => {
    const appFrontera = cloneDeep(namdAppFixture);
    const values = cloneDeep(namdDefaultFormValues);
    values.batchQueue = 'development';
    values.processorsOnEachNode = 64;
    const updatedValues = updateValuesForQueue(appFrontera, values);
    /* should to be 56 (i.e. 2240/40) on development queue */
    expect(updatedValues.processorsOnEachNode).toEqual(56);
  });

  it('updateValuesForQueue handles processorsOnEachNode for rtx queue', () => {
    const appFrontera = cloneDeep(namdAppFixture);
    const values = cloneDeep(namdDefaultFormValues);
    values.batchQueue = 'rtx';
    values.processorsOnEachNode = 2;
    const updatedValues = updateValuesForQueue(appFrontera, values);
    /* shouldn't change for rtx or rtx-dev queues as maxProcessorsPerNode is -1  */
    expect(updatedValues.processorsOnEachNode).toEqual(2);
  });

  it('updateValuesForQueue updates maxRunTime', () => {
    const appFrontera = cloneDeep(namdAppFixture);
    const values = cloneDeep(namdDefaultFormValues);
    values.batchQueue = 'development';
    values.maxRunTime = '48:00:00';
    const updatedValues = updateValuesForQueue(appFrontera, values);
    expect(updatedValues.maxRunTime).toEqual('02:00:00');
  });

  it('updateValuesForQueue avoids updating runtime if not valid or empty', () => {
    const appFrontera = cloneDeep(namdAppFixture);
    const values = cloneDeep(namdDefaultFormValues);
    values.maxRunTime = '99:00:00';
    const updatedValues = updateValuesForQueue(appFrontera, values);
    expect(updatedValues.maxRunTime).toEqual('99:00:00');

    values.maxRunTime = '';
    const moreUpdatedValues = updateValuesForQueue(appFrontera, values);
    expect(moreUpdatedValues.maxRunTime).toEqual('');
  });
});
