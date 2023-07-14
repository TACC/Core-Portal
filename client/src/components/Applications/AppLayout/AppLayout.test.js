import React from 'react';
import { render } from '@testing-library/react';
import { Provider, useSelector } from 'react-redux';
import configureStore from 'redux-mock-store';
import AppsRoutes, { AppsLayout } from './AppLayout';
import { MemoryRouter, Route } from 'react-router-dom';
import systemsFixture from '../../DataFiles/fixtures/DataFiles.systems.fixture';
import { projectsFixture } from '../../../redux/sagas/fixtures/projects.fixture';
import filesFixture from '../../DataFiles/fixtures/DataFiles.files.fixture';
import { appTrayExpectedFixture } from '../../../redux/sagas/fixtures/apptray.fixture';
import allocationsFixture from '../AppForm/fixtures/AppForm.allocations.fixture';
import { helloWorldAppFixture } from '../AppForm/fixtures/AppForm.app.fixture';
import { jobsFixture } from '../AppForm/fixtures/AppForm.jobs.fixture';
import renderComponent from 'utils/testing';

const mockStore = configureStore();

function renderAppsRoutes(store, appId) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/applications/${appId}`]}>
        <Route path="/:appId?">
          <AppsRoutes />
        </Route>
      </MemoryRouter>
    </Provider>
  );
}
describe('AppsLayout', () => {
  it('should show a loading spinner while fetching data', () => {
    const store = mockStore({
      apps: { ...appTrayExpectedFixture, loading: true, categoryDict: {} },
    });
    const { getByText, getByTestId } = renderComponent(<AppsLayout />, store);
    expect(getByTestId('loading-spinner')).toBeDefined();
  });
  it('Display the correct error message', () => {
    const store = mockStore({
      apps: { ...appTrayExpectedFixture, error: { isError: true } },
    });
    const { getByText } = renderComponent(<AppsLayout />, store);
    expect(getByText('Something went wrong.')).toBeDefined();
  });
});

describe('AppsHeader', () => {
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
          isError: false,
        },
        ...helloWorldAppFixture,
      },
      pushKeys: {
        modals: filesFixture.modals,
        modalProps: filesFixture.modalProps,
      },
      workbench: {
        config: { hideManageAccount: false },
      },
    });
    let { getByText } = renderAppsRoutes(store, 'arraytest-0.1');
    expect(getByText(/Applications \/ Array Test/)).toBeDefined();
  });
});
