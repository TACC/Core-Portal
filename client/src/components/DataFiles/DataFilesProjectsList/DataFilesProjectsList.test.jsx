import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import DataFilesProjectsList from './DataFilesProjectsList';
import { projectsFixture } from '../../../redux/sagas/fixtures/projects.fixture';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import filesFixture from '../fixtures/DataFiles.files.fixture';

const mockStore = configureStore();
const initialMockState = {
  projects: projectsFixture,
  files: filesFixture,
  systems: systemsFixture,
};

function renderProjectsListComponent(store) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <DataFilesProjectsList />
      </BrowserRouter>
    </Provider>
  );
}

describe('DataProjectsList', () => {
  it('renders shared workspaces', () => {
    const store = mockStore(initialMockState);
    const { getByText } = renderProjectsListComponent(store);
    expect(getByText(/Test Project Title/)).toBeDefined();
  });
});
