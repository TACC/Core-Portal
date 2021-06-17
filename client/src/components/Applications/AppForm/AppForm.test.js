import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { BrowserRouter } from 'react-router-dom';
import { AppSchemaForm } from './AppForm';
import allocationsFixture from './fixtures/AppForm.allocations.fixture';
import {
  jobsFixture,
  jobsSubmissionSuccessFixture
} from './fixtures/AppForm.jobs.fixture';
import {
  namdAppFixture,
  namdAppMissingKeysFixture
} from './fixtures/AppForm.app.fixture';
import systemsFixture from '../../DataFiles/fixtures/DataFiles.systems.fixture';
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
  it('renders the AppSchemaForm', () => {
    const store = mockStore({
      ...initialMockState
    });

    const { getByText } = renderAppSchemaFormComponent(store, namdAppFixture);
    expect(getByText(/TACC-ACI/)).toBeDefined();
  });

  it('matches extended host names for apps', () => {
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
    expect(getByText(/TACC-ACI/)).toBeDefined();
  });

  it('does not match invalid hostnames', () => {
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
    expect(getByText(/Error/)).toBeDefined();
  });

  it('displays an error if the user is missing an allocation on frontera.tacc', () => {
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
    expect(getByText(/You need an allocation on Frontera/)).toBeDefined();
  });

  it('brings up the push keys message if there is an error listing frontera.tacc', () => {
    const store = mockStore({
      ...initialMockState
    });
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...namdAppMissingKeysFixture
    });
    expect(
      getByText(
        /There was a problem accessing your default My Data file system/
      )
    ).toBeDefined();
  });

  it('renders the AppSchemaForm after job submission', () => {
    const store = mockStore({
      ...initialMockState,
      jobs: jobsSubmissionSuccessFixture
    });

    const { getByText } = renderAppSchemaFormComponent(store, namdAppFixture);
    expect(getByText(/Your job has submitted successfully./)).toBeDefined();
  });
});
