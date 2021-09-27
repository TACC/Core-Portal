import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from "redux-mock-store";
import AppsHeader from "./AppLayout";
import { MemoryRouter, Route } from 'react-router-dom';
import systemsFixture from '../../DataFiles/fixtures/DataFiles.systems.fixture';
import { projectsFixture } from '../../../redux/sagas/fixtures/projects.fixture';
import filesFixture from '../../DataFiles/fixtures/DataFiles.files.fixture';
import { appTrayExpectedFixture } from '../../../redux/sagas/fixtures/apptray.fixture';
import allocationsFixture from '../AppForm/fixtures/AppForm.allocations.fixture';
import { namdAppFixture } from '../AppForm/fixtures/AppForm.app.fixture';
import { jobsFixture } from '../AppForm/fixtures/AppForm.jobs.fixture';

const mockStore = configureStore();
const initialMockState = {
  allocations: allocationsFixture,
  jobs: jobsFixture,
  systems: systemsFixture,
  projects: projectsFixture,
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
function renderAppsHeader(store, appId) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/applications/${appId}`]}>
        <Route path='/:appId?'>
          <AppsHeader categoryDict={appTrayExpectedFixture}/>
        </Route>
      </MemoryRouter>
    </Provider>
  );
}
it('displays an error if no storage systems are enabled', async () => {
  const store = mockStore({
    ...initialMockState,
    systems: {
      storage: {
        configuration: [],
        error: false,
        errorMessage: null,
        loading: false,
        defaultHost: ''
      },
      definitions: {
        list: [],
        error: false,
        errorMessage: null,
        loading: false
      },
    }
  })
})
describe('AppHeader', () => {
  it('renders breadcrumbs', () => {
    const store = mockStore({
      systems: systemsFixture,
      projects: projectsFixture,
      jobs: jobsFixture,
      files: filesFixture,
      apps: appTrayExpectedFixture,
      allocations: allocationsFixture,
      app: {
        error: {
          isError: false
        },
        ...namdAppFixture,
      },
      pushKeys: {
        modals: filesFixture.modals,
        modalProps: filesFixture.modalProps
      }
    });

    let {getByText} = renderAppsHeader(store, 'arraytest-0.1');
    expect(getByText(/Applications \/ Array Test/)).toBeDefined();
  });
});
