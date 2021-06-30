import React from 'react';
import { render, wait } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { BrowserRouter } from 'react-router-dom';
import { AppSchemaForm, AppDetail } from './AppForm';
import allocationsFixture from './fixtures/AppForm.allocations.fixture';
import {
  jobsFixture,
  jobsSubmissionSuccessFixture
} from './fixtures/AppForm.jobs.fixture';
import { appTrayFixture, appTrayExpectedFixture } from '../../../redux/sagas/fixtures/apptray.fixture';
import { initialAppState } from '../../../redux/reducers/apps.reducers';
import {
  namdAppFixture,
  namdAppMissingKeysFixture
} from './fixtures/AppForm.app.fixture';
import systemsFixture from '../../DataFiles/fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';
import '@testing-library/jest-dom/extend-expect';

const mockStore = configureStore();
const initialMockState = {
  allocations: allocationsFixture,
  jobs: jobsFixture,
  systems: systemsFixture,
  files: {
    listing: {
      modal: []
    },
    params: {
      modal: {
        api: '',
        path: '',
        scheme: '',
        system: ''
      }
    },
    modalProps: { select: {} }
  }
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
      ...initialMockState
    });

    const { getByText } = renderAppSchemaFormComponent(store, namdAppFixture);
    await wait(() => {
      expect(getByText(/TACC-ACI/)).toBeDefined();
    });
  });

  it('matches extended host names for apps', async () => {
    const store = mockStore({
      ...initialMockState
    });
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...namdAppFixture,
      exec_sys: {
        ...namdAppFixture.exec_sys,
        login: {
          ...namdAppFixture.exec_sys.login,
          host: 'login1.frontera.tacc.utexas.edu'
        }
      }
    });
    await wait(() => {
      expect(getByText(/TACC-ACI/)).toBeDefined();
    });
  });

  it('does not match invalid hostnames', async () => {
    const store = mockStore({
      ...initialMockState
    });
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...namdAppFixture,
      exec_sys: {
        ...namdAppFixture.exec_sys,
        login: {
          ...namdAppFixture.exec_sys.login,
          host: 'invalid_system_frontera.tacc.utexas.edu'
        }
      }
    });
    await wait(() => {
      expect(getByText(/Error/)).toBeDefined();
    });
  });

  it('displays an error if the user is missing an allocation on frontera.tacc', async () => {
    const store = mockStore({
      ...initialMockState,
      allocations: {
        hosts: {},
        loading: false
      }
    });
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...namdAppFixture
    });
    await wait(() => {
      expect(getByText(/You need an allocation on Frontera/)).toBeDefined();
    });
  });

  it('brings up the push keys message if there is an error listing frontera.tacc', async () => {
    const store = mockStore({
      ...initialMockState
    });
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...namdAppMissingKeysFixture
    });
    await wait(() => {
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
      jobs: jobsSubmissionSuccessFixture
    });
    const { getByText } = renderAppSchemaFormComponent(store, namdAppFixture);
    await wait(() => {
      expect(getByText(/Your job has submitted successfully./)).toBeDefined();
    });
  });

  it('renders validation error for using normal queue but with only 1 node', async () => {
    const store = mockStore({
      ...initialMockState
    });

    const appFixture = {
      ...namdAppFixture,
      definition: {
        ...namdAppFixture.definition,
        defaultNodeCount: 1,
        defaultQueue: 'normal'
      }
    };

    const { getByText } = renderAppSchemaFormComponent(store, appFixture);
    await wait(() => {
      expect(
        getByText(
          /Node Count must be greater than or equal to 3 for the normal queue/
        )
      ).toBeDefined();
    });
  });

  it('renders validation error for using too many nodes for a queue (maxNodes)', async () => {
    const store = mockStore({
      ...initialMockState
    });

    const appFixture = {
      ...namdAppFixture,
      definition: {
        ...namdAppFixture.definition,
        defaultNodeCount: 3,
        defaultQueue: 'small'
      }
    };

    const { getByText } = renderAppSchemaFormComponent(store, appFixture);
    await wait(() => {
      expect(
        getByText(
          /Node Count must be less than or equal to 2 for the small queue/
        )
      ).toBeDefined();
    });
  });

  it('renders validation error for using normal queue for SERIAL apps', async () => {
    const store = mockStore({
      ...initialMockState
    });

    const appFixture = {
      ...namdAppFixture,
      definition: {
        ...namdAppFixture.definition,
        defaultNodeCount: 1,
        defaultQueue: 'normal',
        parallelism: 'SERIAL'
      }
    };

    const { getByText } = renderAppSchemaFormComponent(store, appFixture);
    await wait(() => {
      expect(
        getByText(/The normal queue does not support serial apps/)
      ).toBeDefined();
    });
  });
});

describe('AppDetail', () => {
  it('renders an html app', () => {
    const store = mockStore({
      allocations: { loading: false },
      app: { ...initialAppState, definition: { ...appTrayFixture.definitions['vis-portal'] }},
      apps: { ...appTrayExpectedFixture }
    });
    const { getByText } = renderComponent(<AppDetail />, store);
    expect(getByText(/The TACC Visualization Portal allows simple access to TACC/)).toBeDefined();
  });
});
