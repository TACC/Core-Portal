import React from 'react';
import { render } from '@testing-library/react';
import { AppSchemaForm } from './AppForm';
import { default as allocationsFixture } from './fixtures/AppForm.allocations.fixture';
import { default as jobsFixture } from './fixtures/AppForm.jobs.fixture';
import { default as namdFixture } from './fixtures/AppForm.app.fixture';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';

const mockStore = configureStore();
const initialMockState = {
  allocations: allocationsFixture,
  jobs: jobsFixture,
  systems: {
    systemsList: []
  },
  files: {
    listing: {
      modal: []
    },
    params: {
      modal: {
        api: "",
        path: "",
        scheme: "",
        system: ""
      }
    }
  }
};


function renderAppSchemaFormComponent(store, app) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <AppSchemaForm app={app}/>
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
      ...initialMockState,
    });
    const { getByText } = renderAppSchemaFormComponent(
      store,
      {
        ...namdFixture,
        resource: 'login1.frontera.tacc.utexas.edu'
      }
    )
    expect(getByText(/TACC-ACI/)).toBeDefined();
  });

});
