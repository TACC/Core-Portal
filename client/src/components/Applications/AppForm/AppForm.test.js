import React from 'react';
import { render, waitFor } from '@testing-library/react';
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
import { helloWorldAppFixture } from './fixtures/AppForm.app.fixture';
import systemsFixture from '../../DataFiles/fixtures/DataFiles.systems.fixture';
import { projectsFixture } from '../../../redux/sagas/fixtures/projects.fixture';
import '@testing-library/jest-dom/extend-expect';

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
  it('renders the AppSchemaForm', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    const { getByText } = renderAppSchemaFormComponent(
      store,
      helloWorldAppFixture
    );
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
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
    });
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

  xit('renders validation error for using normal queue but with only 1 node on Frontera', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    const appFixture = {
      ...namdAppFixture,
      definition: {
        ...namdAppFixture.definition,
        defaultNodeCount: 1,
        defaultQueue: 'normal',
      },
      exec_sys: {...helloWorldAppFixture.exec_sys,
        batchDefaultLogicalQueue: 'normal'
      }
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

  xit('renders validation error for using too many nodes for a queue (maxNodes)', async () => {
    const store = mockStore({
      ...initialMockState,
    });


    const appFixture = {
      ...helloWorldAppFixture,
      definition: {...helloWorldAppFixture.definition,
        jobAttributes: {...helloWorldAppFixture.definition.jobAttributes, nodeCount: 3}
      },
      exec_sys: {...helloWorldAppFixture.exec_sys,
        batchDefaultLogicalQueue: 'small'
      }
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

  xit('displays an error if no storage systems are enabled', async () => {
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

    const { getByText } = renderAppSchemaFormComponent(store, {
      ...helloWorldAppFixture,
    });

    await waitFor(() => {
      expect(
        getByText(/No storage systems enabled for this portal./)
      ).toBeDefined();
    });
  });

  it('renders validation error for using normal queue for SERIAL apps on Frontera', async () => {
    const store = mockStore({
      ...initialMockState,
    });

    const appFixture = {
      ...namdAppFixture,
      definition: {
        ...namdAppFixture.definition,
        defaultNodeCount: 1,
        defaultQueue: 'normal',
        notes: {
          ...namdAppFixture.definition.notes,
          hideNodeCountAndCoresPerNode: true,
        },
      },
    };

    const { getByText } = renderAppSchemaFormComponent(store, appFixture);

    await waitFor(() => {
      expect(
        getByText(/The normal queue does not support serial apps/)
      ).toBeDefined();
    });
  });

  it('displays an error when license is missing', async () => {
    const store = mockStore({
      ...initialMockState,
    });
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...namdAppFixture,
      license: {
        type: 'Application Name',
      },
    });
    await waitFor(() => {
      expect(getByText(/Activate your Application Name license/)).toBeDefined();
    });
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
