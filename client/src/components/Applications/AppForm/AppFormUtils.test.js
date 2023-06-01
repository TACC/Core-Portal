import { cloneDeep } from 'lodash';
import { helloWorldAppFixture } from './fixtures/AppForm.app.fixture';
import { getNodeCountValidation, updateValuesForQueue } from './AppFormUtils';

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
      notes: {
        ...helloWorldAppFixture.definition.notes,
        hideNodeCountAndCoresPerNode: false,
      },
    },
  };

  const serialFronteraApp = {
    ...helloWorldAppFixture,
    definition: {
      ...helloWorldAppFixture.definition,
      notes: {
        ...helloWorldAppFixture.definition.notes,
        hideNodeCountAndCoresPerNode: true,
      },
    },
  };

  const exampleFormValue = {
    execSystemLogicalQueue: 'normal',
    nodeCount: 1,
    coresPerNode: 1,
    maxMinutes: '',
  };

  it('handles node count validation', () => {
    expect(
      getNodeCountValidation(normalQueue, parallelFronteraApp).isValidSync(1)
    ).toEqual(false);
    expect(
      getNodeCountValidation(normalQueue, parallelFronteraApp).isValidSync(3)
    ).toEqual(true);
    expect(
      getNodeCountValidation(normalQueue, parallelFronteraApp).isValidSync(2.9)
    ).toEqual(false);
    expect(
      getNodeCountValidation(smallQueue, parallelFronteraApp).isValidSync(1)
    ).toEqual(true);
    expect(
      getNodeCountValidation(smallQueue, parallelFronteraApp).isValidSync(3)
    ).toEqual(false);
  });

  it('updateValuesForQueue updates node count when using small queue', () => {
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

  it('updateValuesForQueue handles processorsOnEachNode for rtx queue', () => {
    const appFrontera = cloneDeep(parallelFronteraApp);
    const values = cloneDeep(exampleFormValue);
    values.execSystemLogicalQueue = 'rtx';
    values.coresPerNode = 2;
    const updatedValues = updateValuesForQueue(appFrontera, values);
    /* shouldn't change for rtx or rtx-dev queues as minCoresPerNode is -1  */
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
});
