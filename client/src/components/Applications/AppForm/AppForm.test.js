import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { BrowserRouter } from 'react-router-dom';
import renderComponent from 'utils/testing';
import { AppSchemaForm, AppDetail } from './AppForm';
import allocationsFixture from './fixtures/AppForm.allocations.fixture';
import { execSystemsFixture } from './fixtures/AppForm.executionsystems.fixture';

import {
  jobsFixture,
  jobsSubmissionSuccessFixture,
} from './fixtures/AppForm.jobs.fixture';
import {
  appTrayFixture,
  appTrayExpectedFixture,
} from '../../../redux/sagas/fixtures/apptray.fixture';
import { initialAppState } from '../../../redux/reducers/apps.reducers';
import {
  helloWorldAppFixture,
  helloWorldAppSubmissionPayloadFixture,
} from './fixtures/AppForm.app.fixture';
import systemsFixture from '../../DataFiles/fixtures/DataFiles.systems.fixture';
import { projectsFixture } from '../../../redux/sagas/fixtures/projects.fixture';
import '@testing-library/jest-dom/extend-expect';
import timekeeper from 'timekeeper';

const frozenDate = '2023-10-01';
const mockStore = configureStore();
const initialMockState = {
  allocations: allocationsFixture,
  jobs: jobsFixture,
  systems: systemsFixture,
  projects: projectsFixture,
  files: {
    listing: {
      modal: [],
    },
    params: {
      modal: {
        api: '',
        path: '',
        scheme: '',
        system: '',
      },
    },
    modalProps: { select: {} },
  },
  workbench: {
    config: { hideManageAccount: false },
  },
};

function renderAppSchemaFormComponent(store, app) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <AppSchemaForm app={app} />
      </BrowserRouter>
    </Provider>
  );
}

describe('AppSchemaForm', () => {
  beforeAll(() => {
    // Lock Time
    timekeeper.freeze(new Date(frozenDate));
  });

  it.only('renders the AppSchemaForm', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    const { getByText, container } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
    });

    const archiveSystemId = container.querySelector(
      'input[name="archiveSystemId"]'
    );
    await waitFor(() => {
      expect(getByText(/TACC-ACI/)).toBeDefined();

      // use app definition default archive system
      expect(archiveSystemId.value).toBe(
        helloWorldAppFixture.definition.jobAttributes.archiveSystemId
      );
    });
  });

  it('matches extended host names for apps', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
      execSystems: [
        {
          ...helloWorldAppFixture.execSystems[0],
          host: 'login1.frontera.tacc.utexas.edu',
        },
        ...helloWorldAppFixture.slice(1),
      ],
    });
    await waitFor(() => {
      expect(getByText(/TACC-ACI/)).toBeDefined();
    });
  });

  it('does not match invalid hostnames', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
      execSystems: {
        ...helloWorldAppFixture.execSystems[0],
        host: 'invalid_system.tacc.utexas.edu',
      },
      ...helloWorldAppFixture.slice(1),
    });
    await waitFor(() => {
      expect(getByText(/Error/)).toBeDefined();
    });
  });

  it('displays an error if the user is missing an allocation on frontera.tacc', async () => {
    const store = mockStore({
      ...initialMockState,
      allocations: {
        hosts: {},
        loading: false,
      },
    });
    const { getByText } = renderAppSchemaFormComponent(
      store,
      helloWorldAppFixture
    );
    await waitFor(() => {
      expect(getByText(/You need an allocation on Frontera/)).toBeDefined();
    });
  });

  it('brings up the push keys message if there is an error listing frontera.tacc', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    const missingKeysApp = { ...helloWorldAppFixture, systemNeedsKeys: true };
    const { getByText } = renderAppSchemaFormComponent(store, missingKeysApp);
    await waitFor(() => {
      expect(
        getByText(
          /There was a problem accessing your default My Data file system/
        )
      ).toBeDefined();
    });
  });

  it('renders the AppSchemaForm after job submission', async () => {
    const store = mockStore({
      ...initialMockState,
      jobs: jobsSubmissionSuccessFixture,
    });
    const { getByText } = renderAppSchemaFormComponent(
      store,
      helloWorldAppFixture
    );
    await waitFor(() => {
      expect(getByText(/Your job has submitted successfully./)).toBeDefined();
    });
  });

  it('renders validation error for using normal queue but with only 1 node on Frontera', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    const appFixture = {
      ...helloWorldAppFixture,
      definition: {
        ...helloWorldAppFixture.definition,
        jobAttributes: {
          ...helloWorldAppFixture.definition.jobAttributes,
          nodeCount: 1,
          execSystemLogicalQueue: 'normal',
        },
        notes: {
          ...helloWorldAppFixture.definition.notes,
          hideNodeCountAndCoresPerNode: false,
        },
      },
    };

    const { getByText } = renderAppSchemaFormComponent(store, appFixture);
    await waitFor(() => {
      expect(
        getByText(
          /Node Count must be greater than or equal to 3 for the normal queue/
        )
      ).toBeDefined();
    });
  });

  it('renders validation error for using too many nodes for a queue (maxNodes)', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    const appFixture = {
      ...helloWorldAppFixture,
      definition: {
        ...helloWorldAppFixture.definition,
        jobAttributes: {
          ...helloWorldAppFixture.definition.jobAttributes,
          nodeCount: 3,
          execSystemLogicalQueue: 'small',
        },
        notes: {
          ...helloWorldAppFixture.definition.notes,
          hideNodeCountAndCoresPerNode: false,
        },
      },
    };

    const { getByText } = renderAppSchemaFormComponent(store, appFixture);

    await waitFor(() => {
      expect(
        getByText(
          /Node Count must be less than or equal to 2 for the small queue/
        )
      ).toBeDefined();
    });
  });

  it('displays an error if no storage systems are enabled', async () => {
    const store = mockStore({
      ...initialMockState,
      systems: {
        storage: {
          configuration: [],
          error: false,
          errorMessage: null,
          loading: false,
          defaultHost: '',
          defaultSystem: '',
        },
        definitions: {
          list: [],
          error: false,
          errorMessage: null,
          loading: false,
        },
      },
    });

    const { getByText } = renderAppSchemaFormComponent(
      store,
      helloWorldAppFixture
    );

    await waitFor(() => {
      expect(
        getByText(/No storage systems enabled for this portal./)
      ).toBeDefined();
    });
  });

  it('displays an error when license is missing', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
      license: {
        type: 'Application Name',
      },
    });
    await waitFor(() => {
      expect(getByText(/Activate your Application Name license/)).toBeDefined();
    });
  });

  it('displays a selection of execution systems', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    const { container } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
      execSystems: execSystemsFixture,
    });
    const execSystemDropDown = container.querySelector(
      'select[name="execSystemId"]'
    );
    expect(execSystemDropDown).not.toBeNull();
    expect(execSystemDropDown.value).toBe('frontera');
    const options = Array.from(execSystemDropDown.querySelectorAll('option'));
    const actualValues = Array.from(options).map((option) => option.value);
    const expectedValues = Array.from(execSystemsFixture).map(
      (system) => system.id
    );
    expect(actualValues).toEqual(expect.arrayContaining(expectedValues));
  });

  it('displays only execution systems with allocations', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    const updatedExecSystems = [...execSystemsFixture];
    updatedExecSystems[0].host = 'maverick3.tacc.utexas.edu';

    const { container } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
      execSystems: updatedExecSystems,
    });
    const execSystemDropDown = container.querySelector(
      'select[name="execSystemId"]'
    );
    expect(execSystemDropDown).not.toBeNull();
    expect(execSystemDropDown.value).toBe('frontera');
    const options = Array.from(execSystemDropDown.querySelectorAll('option'));
    const actualValues = Array.from(options).map((option) => option.value);
    const expectedValues = Array.from(execSystemsFixture).map(
      (system) => system.id
    );
    expect(actualValues).toEqual(
      expect.arrayContaining(expectedValues.slice(1))
    );
  });

  it('displays correctly when only one execution system different from default has allocation', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    const updatedExecSystems = execSystemsFixture.map((e) => {
      // Leave ls6 intact and change the rest
      if (e.id !== 'ls6') {
        // maverick99 does not have allocation
        return { ...e, host: 'maverick99.tacc.utexas.edu' };
      }
      return e;
    });

    const { container } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
      execSystems: updatedExecSystems,
    });
    const execSystemDropDown = container.querySelector(
      'select[name="execSystemId"]'
    );
    expect(execSystemDropDown).not.toBeNull();
    expect(execSystemDropDown.value).toBe('ls6');
    const options = Array.from(execSystemDropDown.querySelectorAll('option'));
    expect(options).toHaveLength(1);
  });

  it('displays correctly when default execution system has allocation', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    const updatedExecSystems = execSystemsFixture.map((e) => {
      // Leave frontera
      if (e.id !== 'frontera') {
        // maverick99 does not have allocation
        return { ...e, host: 'maverick99.tacc.utexas.edu' };
      }
      return e;
    });

    const { container } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
      execSystems: updatedExecSystems,
    });
    const execSystemDropDown = container.querySelector(
      'select[name="execSystemId"]'
    );
    expect(execSystemDropDown).not.toBeNull();
    expect(execSystemDropDown.value).toBe('frontera');
    const options = Array.from(execSystemDropDown.querySelectorAll('option'));
    expect(options).toHaveLength(1);
  });

  it('displays error when no exec system has allocation', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    const updatedExecSystems = execSystemsFixture.map((e) => {
      // maverick99 does not have allocation
      return { ...e, host: 'maverick99.tacc.utexas.edu' };
    });

    const { getByText, container } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
      execSystems: updatedExecSystems,
    });

    console.log(container.innerHTML);
    await waitFor(() => {
      expect(
        getByText(
          /Error: You need an allocation on Frontera to run this application/
        )
      ).toBeDefined();
    });
    const execSystemDropDown = container.querySelector(
      'select[name="execSystemId"]'
    );
    expect(execSystemDropDown).toBeNull();
  });

  it('displays all dependent field options after switching exec systems', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    const appFixture = {
      ...helloWorldAppFixture,
      execSystems: execSystemsFixture,
    };
    const { container } = renderAppSchemaFormComponent(store, appFixture);
    const execSystemDropDown = container.querySelector(
      'select[name="execSystemId"]'
    );
    expect(execSystemDropDown.value).toBe('frontera');

    fireEvent.change(execSystemDropDown, { target: { value: 'ls6' } });
    expect(execSystemDropDown.value).toBe('ls6');

    const queueDropDown = container.querySelector(
      'select[name="execSystemLogicalQueue"]'
    );
    expect(queueDropDown.value).toBe(
      helloWorldAppFixture.definition.jobAttributes.execSystemLogicalQueue
    );
    const queueOptions = Array.from(queueDropDown.querySelectorAll('option'));
    // normal and large do not fit into min node requirements, so count is 4.
    expect(queueOptions).toHaveLength(4);
  });

  it('displays all dependent field options after switching exec systems without node count filtering', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    // Adjust fixture to set hideNodeCountAndCoresPerNode to false.
    // This triggers logic to include all queues.
    const appFixture = {
      ...helloWorldAppFixture,
      definition: {
        ...helloWorldAppFixture.definition,
        notes: {
          ...helloWorldAppFixture.definition.notes,
          hideNodeCountAndCoresPerNode: false,
        },
      },
      execSystems: execSystemsFixture,
    };
    const { container } = renderAppSchemaFormComponent(store, appFixture);
    const execSystemDropDown = container.querySelector(
      'select[name="execSystemId"]'
    );
    expect(execSystemDropDown.value).toBe('frontera');

    fireEvent.change(execSystemDropDown, { target: { value: 'ls6' } });
    expect(execSystemDropDown.value).toBe('ls6');

    const queueDropDown = container.querySelector(
      'select[name="execSystemLogicalQueue"]'
    );
    expect(queueDropDown.value).toBe(
      helloWorldAppFixture.definition.jobAttributes.execSystemLogicalQueue
    );
    const queueOptions = Array.from(queueDropDown.querySelectorAll('option'));
    expect(queueOptions).toHaveLength(6);
    const actualQueueValues = Array.from(queueOptions).map(
      (option) => option.value
    );
    const expectedQueueValues = Array.from(
      execSystemsFixture.find((e) => e.id === 'ls6').batchLogicalQueues
    ).map((q) => q.name);
    expect(actualQueueValues).toEqual(
      expect.arrayContaining(expectedQueueValues)
    );
  });

  it('displays correctly when both exec system and queue limit changes', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    // Set to normal queue as default, which has different defaults
    // and allows testing if limits related dependent fields have changed.
    // Also, do not hide the node count and cores per node.
    const appFixture = {
      ...helloWorldAppFixture,
      definition: {
        ...helloWorldAppFixture.definition,
        jobAttributes: {
          ...helloWorldAppFixture.definition.jobAttributes,
          execSystemLogicalQueue: 'normal',
        },
        notes: {
          ...helloWorldAppFixture.definition.notes,
          hideNodeCountAndCoresPerNode: false,
        },
      },
      execSystems: execSystemsFixture,
    };
    const { getByText, container } = renderAppSchemaFormComponent(
      store,
      appFixture
    );
    const execSystemDropDown = container.querySelector(
      'select[name="execSystemId"]'
    );
    expect(execSystemDropDown.value).toBe('frontera');

    fireEvent.change(execSystemDropDown, { target: { value: 'ls6' } });
    expect(execSystemDropDown.value).toBe('ls6');

    // Check limits for ls6 normal queue. 300 max minutes
    await waitFor(() => {
      expect(getByText(/Maximum possible is 3000 minutes/)).toBeDefined();
    });
    // min node count value
    const nodeCount = container.querySelector('input[name="nodeCount"]');
    // set fixture for value, the values are different for frontera vs ls6
    expect(nodeCount.value).toEqual('4');
    // cores per node value
    const coresPerNodeCount = container.querySelector(
      'input[name="coresPerNode"]'
    );
    expect(coresPerNodeCount.value).toEqual('2');
  });

  it('displays correctly when adjusting queue selection in new exec system', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    // Do not hide the node count and cores per node to help validate changes
    const appFixture = {
      ...helloWorldAppFixture,
      definition: {
        ...helloWorldAppFixture.definition,
        notes: {
          ...helloWorldAppFixture.definition.notes,
          hideNodeCountAndCoresPerNode: false,
        },
      },
      execSystems: execSystemsFixture,
    };
    const { getByText, container } = renderAppSchemaFormComponent(
      store,
      appFixture
    );
    const execSystemDropDown = container.querySelector(
      'select[name="execSystemId"]'
    );
    expect(execSystemDropDown.value).toBe('frontera');

    fireEvent.change(execSystemDropDown, { target: { value: 'ls6' } });
    expect(execSystemDropDown.value).toBe('ls6');
    const queueDropDown = container.querySelector(
      'select[name="execSystemLogicalQueue"]'
    );
    // set to vm-small
    fireEvent.change(queueDropDown, { target: { value: 'vm-small' } });

    // Check limits for ls6 vm-small queue.
    const nodeCount = container.querySelector('input[name="nodeCount"]');
    expect(nodeCount.value).toEqual('1');
    // cores per node value
    const coresPerNodeCount = container.querySelector(
      'input[name="coresPerNode"]'
    );
    expect(coresPerNodeCount.value).toEqual('1');
  });

  it('displays validation error when setting high value for node count', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    // Do not hide the node count and cores per node to help validate changes
    const appFixture = {
      ...helloWorldAppFixture,
      definition: {
        ...helloWorldAppFixture.definition,
        notes: {
          ...helloWorldAppFixture.definition.notes,
          hideNodeCountAndCoresPerNode: false,
        },
      },
      execSystems: execSystemsFixture,
    };
    const { getByText, container } = renderAppSchemaFormComponent(
      store,
      appFixture
    );
    const execSystemDropDown = container.querySelector(
      'select[name="execSystemId"]'
    );
    expect(execSystemDropDown.value).toBe('frontera');

    fireEvent.change(execSystemDropDown, { target: { value: 'ls6' } });
    expect(execSystemDropDown.value).toBe('ls6');
    const queueDropDown = container.querySelector(
      'select[name="execSystemLogicalQueue"]'
    );
    // set to vm-small
    fireEvent.change(queueDropDown, { target: { value: 'vm-small' } });

    // Check limits for ls6 vm-small queue.
    const nodeCount = container.querySelector('input[name="nodeCount"]');
    expect(nodeCount.value).toEqual('1');
    fireEvent.change(nodeCount, { target: { value: '16' } });
    // Check limits for ls6 normal queue. 300 max minutes
    await waitFor(() => {
      expect(
        getByText(
          /Node Count must be less than or equal to 1 for the vm-small queue./
        )
      ).toBeDefined();
    });
  });

  it('job submission with file input mode FIXED', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    const { getByText, container } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
      definition: {
        ...helloWorldAppFixture.definition,
        jobAttributes: {
          ...helloWorldAppFixture.definition.jobAttributes,
          fileInputs: [
            {
              name: 'File to copy',
              description: 'A fixed file used by the app',
              inputMode: 'FIXED',
              autoMountLocal: true,
              sourceUrl:
                'tapis://corral-tacc/tacc/aci/secure-test/rallyGolf.jpg',
              targetPath: 'rallyGolf.jpg',
            },
          ],
        },
      },
    });
    const hiddenFileInput = container.querySelector(
      'input[name="fileInputs.File to copy"]'
    );
    // FIXED fields are still shown in UI but not submitted.
    expect(hiddenFileInput).toBeInTheDocument();

    const submitButton = getByText(/Submit/);
    fireEvent.click(submitButton);
    const payload = {
      ...helloWorldAppSubmissionPayloadFixture,
      job: {
        ...helloWorldAppSubmissionPayloadFixture.job,
        name: 'hello-world-0.0.1_' + frozenDate + 'T00:00:00',
      },
    };

    await waitFor(() => {
      expect(store.getActions()).toEqual([
        { type: 'GET_SYSTEM_MONITOR' },
        { type: 'SUBMIT_JOB', payload: payload },
      ]);
    });
  });

  it('job submission with file input hidden', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    const { getByText, container } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
      definition: {
        ...helloWorldAppFixture.definition,
        jobAttributes: {
          ...helloWorldAppFixture.definition.jobAttributes,
          fileInputs: [
            {
              name: 'File to copy',
              description: 'A fixed file used by the app',
              inputMode: 'REQUIRED',
              autoMountLocal: true,
              sourceUrl:
                'tapis://corral-tacc/tacc/aci/secure-test/rallyGolf.jpg',
              targetPath: 'rallyGolf.jpg',
              notes: {
                isHidden: true,
              },
            },
          ],
        },
      },
    });

    const hiddenFileInput = container.querySelector(
      'input[name="fileInputs.File to copy"]'
    );
    expect(hiddenFileInput).not.toBeInTheDocument();

    const submitButton = getByText(/Submit/);
    fireEvent.click(submitButton);
    const payload = {
      ...helloWorldAppSubmissionPayloadFixture,
      job: {
        ...helloWorldAppSubmissionPayloadFixture.job,
        name: 'hello-world-0.0.1_' + frozenDate + 'T00:00:00',
      },
    };

    await waitFor(() => {
      expect(store.getActions()).toEqual([
        { type: 'GET_SYSTEM_MONITOR' },
        { type: 'SUBMIT_JOB', payload: payload },
      ]);
    });
  });

  it('job submission with custom target path', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    const { getByText, container } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
      definition: {
        ...helloWorldAppFixture.definition,
        notes: {
          ...helloWorldAppFixture.definition.notes,
          showTargetPath: true,
        },
      },
    });

    const fileInput = container.querySelector(
      'input[name="fileInputs.File to modify"]'
    );
    const file = 'tapis://foo/bar.txt';
    const targetPathForFile = 'baz.txt';
    fireEvent.change(fileInput, { target: { value: file } });
    const targetPathInput = container.querySelector(
      'input[name="fileInputs._TargetPath_File to modify"]'
    );
    fireEvent.change(targetPathInput, { target: { value: targetPathForFile } });

    const submitButton = getByText(/Submit/);
    fireEvent.click(submitButton);
    const payload = {
      ...helloWorldAppSubmissionPayloadFixture,
      job: {
        ...helloWorldAppSubmissionPayloadFixture.job,
        fileInputs: [
          {
            name: 'File to modify',
            sourceUrl: file,
            targetPath: targetPathForFile,
          },
        ],
        name: 'hello-world-0.0.1_' + frozenDate + 'T00:00:00',
      },
    };

    await waitFor(() => {
      expect(store.getActions()).toEqual([
        { type: 'GET_SYSTEM_MONITOR' },
        { type: 'SUBMIT_JOB', payload: payload },
      ]);
    });
  });

  afterAll(() => {
    timekeeper.reset();
  });
});

describe('AppDetail', () => {
  it('renders an html app', () => {
    const store = mockStore({
      allocations: { loading: false },
      app: {
        ...initialAppState,
        definition: { ...appTrayFixture.html_definitions['vis-portal'] },
      },
      apps: { ...appTrayExpectedFixture },
    });
    const { getByText } = renderComponent(<AppDetail />, store);
    expect(
      getByText(/The TACC Visualization Portal allows simple access to TACC/)
    ).toBeDefined();
  });
});

const mockAppWithQueueFilter = {
  ...helloWorldAppFixture,
  definition: {
    ...helloWorldAppFixture.definition,
    notes: {
      ...helloWorldAppFixture.definition.notes,
      queueFilter: ['rtx', 'small'],
    },
  },
};

const mockAppWithoutQueueFilter = {
  ...helloWorldAppFixture,
  definition: {
    ...helloWorldAppFixture.definition,
    notes: {
      ...helloWorldAppFixture.definition.notes,
      queueFilter: null,
    },
  },
};

describe('AppSchemaForm queueFilter tests', () => {
  it('renders only the queues specified in the queueFilter', () => {
    const { container } = renderAppSchemaFormComponent(
      mockStore(initialMockState),
      mockAppWithQueueFilter
    );

    const targetDropdown = container.querySelector(
      'select[name="execSystemLogicalQueue"]'
    );
    const options = Array.from(targetDropdown.querySelectorAll('option'));
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toBe('rtx');
    expect(options[1].textContent).toBe('small');
  });

  it('renders all queues when no queueFilter is present', () => {
    const { container } = renderAppSchemaFormComponent(
      mockStore(initialMockState),
      mockAppWithoutQueueFilter
    );

    const targetDropdown = container.querySelector(
      'select[name="execSystemLogicalQueue"]'
    );
    const options = Array.from(targetDropdown.querySelectorAll('option'));
    expect(options).toHaveLength(3);
    expect(options[0].textContent).toBe('development');
    expect(options[1].textContent).toBe('rtx');
    expect(options[2].textContent).toBe('small');
  });
});
