import { cloneDeep } from 'lodash';
import { helloWorldAppFixture } from './fixtures/AppForm.app.fixture';
import {
  getNodeCountValidation,
  getQueueValidation,
  updateValuesForQueue,
} from './AppFormUtils';

// TODOv3 update fixture and fix tests
describe('AppFormUtils', () => {
  const normalQueue = helloWorldAppFixture.exec_sys.batchLogicalQueues.find(
    (q) => q.name === 'normal'
  );
  const smallQueue = helloWorldAppFixture.exec_sys.batchLogicalQueues.find(
    (q) => q.name === 'small'
  );

  const parallelFronteraApp = {
    ...helloWorldAppFixture,
    definition: {
      ...helloWorldAppFixture.definition,
      jobAttributes: {
        ...helloWorldAppFixture.definition.jobAttributes,
        isMpi: true, // TODOv3 check if this can be considered PARALLEL
      },
    },
  };

  const exampleFormValue = {
    execSystemLogicalQueue: 'normal',
    nodeCount: 1,
    coresPerNode: 1,
    maxMinutes: '',
  };

  it('handles node count validation on Frontera', () => {
    expect(
      getNodeCountValidation(normalQueue, parallelFronteraApp).isValidSync(1)
    ).toEqual(false);
    expect(
      getNodeCountValidation(normalQueue, parallelFronteraApp).isValidSync(3)
    ).toEqual(true);
    /* TODOv3 Add small queue to fixture
    expect(
      getNodeCountValidation(smallQueue, parallelFronteraApp).isValidSync(1)
    ).toEqual(true);
    expect(
      getNodeCountValidation(smallQueue, parallelFronteraApp).isValidSync(3)
    ).toEqual(false);
     */
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
    /* TODOv3 Add small queue to fixture
    expect(


      (smallQueue, helloWorldAppFixture).isValidSync('small')
    ).toEqual(true);
     */
    expect(
      getQueueValidation(normalQueue, helloWorldAppFixture).isValidSync(
        'normal'
      )
    ).toEqual(false);
  });

  it('handles queue validation on non-Frontera HPCs for SERIAL apps', () => {
    const stampede2SerialApp = cloneDeep(helloWorldAppFixture);
    stampede2SerialApp.exec_sys.host = 'stampede2.tacc.utexas.edu';
    /* TODOv3 Add small queue to fixture
    expect(
      getQueueValidation(smallQueue, stampede2SerialApp).isValidSync('small')
    ).toEqual(true);
     */
    expect(
      getQueueValidation(normalQueue, stampede2SerialApp).isValidSync('normal')
    ).toEqual(true);
  });

  // TODOv3 Reactivate this test when small queue is added to fixture
  xit('updateValuesForQueue updates node count when using small queue', () => {
    const appFrontera = cloneDeep(parallelFronteraApp);
    const values = cloneDeep(exampleFormValue);
    values.execSystemLogicalQueue = 'small';
    values.nodeCount = 3;
    const updatedValues = updateValuesForQueue(appFrontera, values);
    expect(updatedValues.nodeCount).toEqual(2);
  });

  it('updateValuesForQueue updates node count when using normal queue', () => {
    const appFrontera = cloneDeep(parallelFronteraApp);
    const values = cloneDeep(exampleFormValue);
    values.execSystemLogicalQueue = 'normal';
    values.nodeCount = 2;
    const updatedValues = updateValuesForQueue(appFrontera, values);
    expect(updatedValues.nodeCount).toEqual(3);
  });

  it('updateValuesForQueue updates coresPerNode', () => {
    const appFrontera = cloneDeep(parallelFronteraApp);
    const values = cloneDeep(exampleFormValue);
    values.execSystemLogicalQueue = 'development';
    values.coresPerNode = 64;
    const updatedValues = updateValuesForQueue(appFrontera, values);
    /* should to be 56 on development queue */
    expect(updatedValues.coresPerNode).toEqual(56);
  });

  // TODOv3 add rtx-related test
  xit('updateValuesForQueue handles processorsOnEachNode for rtx queue', () => {
    const appFrontera = cloneDeep(parallelFronteraApp);
    const values = cloneDeep(exampleFormValue);
    values.execSystemLogicalQueue = 'rtx';
    values.coresPerNode = 2;
    const updatedValues = updateValuesForQueue(appFrontera, values);
    /* shouldn't change for rtx or rtx-dev queues as coresPerNode is -1  */
    expect(updatedValues.coresPerNode).toEqual(2);
  });

  it('updateValuesForQueue updates maxRunTime', () => {
    const appFrontera = cloneDeep(parallelFronteraApp);
    const values = cloneDeep(exampleFormValue);
    values.execSystemLogicalQueue = 'development';
    values.maxMinutes = 999;
    const updatedValues = updateValuesForQueue(appFrontera, values);
    expect(updatedValues.maxMinutes).toEqual(120);
  });

  it('updateValuesForQueue avoids updating runtime if not valid or empty', () => {
    const appFrontera = cloneDeep(parallelFronteraApp);
    const values = cloneDeep(exampleFormValue);
    values.maxMinutes = 9999;
    const updatedValues = updateValuesForQueue(appFrontera, values);
    expect(updatedValues.maxMinutes).toEqual(9999);

    values.maxMinutes = '';
    const moreUpdatedValues = updateValuesForQueue(appFrontera, values);
    expect(moreUpdatedValues.maxMinutes).toEqual('');
  });
});
