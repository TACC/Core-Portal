import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { AppSchemaForm } from './AppForm';
import { default as allocationsFixture } from './fixtures/AppForm.allocations.fixture';
import { default as jobsFixture } from './fixtures/AppForm.jobs.fixture';
import { default as namdFixture } from './fixtures/AppForm.app.fixture';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';

const mockStore = configureStore();
const initialMockState = {
  allocations: allocationsFixture,
  jobs: jobsFixture,
  systems: {
    defaultHost: 'frontera.tacc.utexas.edu',
    systemsList: []
  },
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

    const { getByText } = renderAppSchemaFormComponent(store, namdFixture);
    expect(getByText(/TACC-ACI/)).toBeDefined();
  });

  it('matches extended host names for apps', () => {
    const store = mockStore({
      ...initialMockState
    });
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...namdFixture,
      resource: 'login1.frontera.tacc.utexas.edu'
    });
    expect(getByText(/TACC-ACI/)).toBeDefined();
  });

  it('does not match invalid hostnames', () => {
    const store = mockStore({
      ...initialMockState
    });
    const { getByText } = renderAppSchemaFormComponent(store, {
      ...namdFixture,
      resource: 'invalid_system_frontera.tacc.utexas.edu'
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
      ...namdFixture
    });
    expect(getByText(/You need an allocation on Frontera/)).toBeDefined();
  });
});
