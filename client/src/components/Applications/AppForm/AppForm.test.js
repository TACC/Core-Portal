import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { BrowserRouter } from 'react-router-dom';
import renderComponent from 'utils/testing';
import { AppSchemaForm, AppDetail } from './AppForm';
import allocationsFixture from './fixtures/AppForm.allocations.fixture';
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

  it('renders the AppSchemaForm', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    const { getByText } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
    });
    await waitFor(() => {
      expect(getByText(/TACC-ACI/)).toBeDefined();
    });
  });

  it('matches extended host names for apps', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
      exec_sys: {
        ...helloWorldAppFixture.exec_sys,
        host: 'login1.frontera.tacc.utexas.edu',
      },
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
      exec_sys: {
        ...helloWorldAppFixture.exec_sys,
        host: 'invalid_system.tacc.utexas.edu',
      },
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
