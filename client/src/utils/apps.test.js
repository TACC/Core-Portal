import { getExecSystemFromId, getDefaultExecSystem } from './apps';
import { helloWorldAppFixture } from '../components/Applications/AppForm/fixtures/AppForm.app.fixture';
import { executionSystemNotesFixture } from '../components/Applications/AppForm/fixtures/AppForm.executionsystems.fixture';

describe('app utility to get Execution System from Id', () => {
  it('returns available exec system', () => {
    expect(getExecSystemFromId(helloWorldAppFixture, 'frontera').id).toEqual(
      'frontera'
    );
  });
  it('returns undefined with unavailable system', () => {
    expect(getExecSystemFromId(helloWorldAppFixture, 'foobar')).toBeUndefined();
  });
  it('returns null with empty exec system array', () => {
    const app = {
      ...helloWorldAppFixture,
      execSystems: [],
    };
    expect(getExecSystemFromId(app, 'foobar')).toBeUndefined();
  });
});

describe('app utility to get Default Execution System from Id', () => {
  it('returns the matching default exec system', () => {
    const app = {
      ...helloWorldAppFixture,
      definition: {
        ...helloWorldAppFixture.definition,
        jobAttributes: {
          ...helloWorldAppFixture.definition.jobAttributes,
          execSystemId: 'ls6',
        },
      },
    };
    expect(getDefaultExecSystem(app).id).toEqual('ls6');
  });
  it('returns first exec system when execSystemId does not match', () => {
    const app = {
      ...helloWorldAppFixture,
      definition: {
        ...helloWorldAppFixture.definition,
        jobAttributes: {
          ...helloWorldAppFixture.definition.jobAttributes,
          execSystemId: 'foobar',
        },
        notes: {
          ...helloWorldAppFixture.definition.notes,
          ...executionSystemNotesFixture,
        },
      },
    };
    debugger;
    expect(getDefaultExecSystem(app, ['frontera', 'ls6']).id).toEqual(
      'frontera'
    );
  });
  it('returns null with empty exec system array', () => {
    const app = {
      ...helloWorldAppFixture,
      execSystems: [],
    };
    expect(getDefaultExecSystem(app)).toBeUndefined();
  });
});
