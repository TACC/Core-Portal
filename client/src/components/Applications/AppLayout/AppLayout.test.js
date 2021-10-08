import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from "redux-mock-store";
import AppsRoutes from "./AppLayout";
import { MemoryRouter, Route } from 'react-router-dom';
import systemsFixture from '../../DataFiles/fixtures/DataFiles.systems.fixture';
import { projectsFixture } from '../../../redux/sagas/fixtures/projects.fixture';
import filesFixture from '../../DataFiles/fixtures/DataFiles.files.fixture';
import { appTrayExpectedFixture } from '../../../redux/sagas/fixtures/apptray.fixture';
import allocationsFixture from '../AppForm/fixtures/AppForm.allocations.fixture';
import { namdAppFixture } from '../AppForm/fixtures/AppForm.app.fixture';
import { jobsFixture } from '../AppForm/fixtures/AppForm.jobs.fixture';
import renderComponent from 'utils/testing';

const mockStore = configureStore();

function renderAppsHeader(store, appId) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/applications/${appId}`]}>
        <Route path='/:appId?'>
          <AppsRoutes categoryDict={appTrayExpectedFixture}/>
        </Route>
      </MemoryRouter>
    </Provider>
  );
}
describe('AppsLayout', () => {
  it('should show a loading spinner while fetching data', () => {
    const store = mockStore({
      apps: {...appTrayExpectedFixture, loading: true}
    });
    const { getByText,getByTestId} = renderComponent(<AppsRoutes/>, store);
    
    if(categoryDict.isEmptyObject)
     (expect(getByTestId('loading-spinner')).toBeDefined());
  });
  it('Display the correct error message', () => {
    const store = mockStore({
      apps: {...appTrayExpectedFixture, error: {isError:true}}
    });
    const { getByText} = renderComponent(<AppsRoutes/>, store);
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
