import React from "react"
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import DataFilesProjectsList from "./DataFilesProjectsList";
import configureStore from "redux-mock-store";
import { projectsFixture } from '../../../redux/sagas/fixtures/projects.fixture';

const mockStore = configureStore();
const initialMockState = projectsFixture;

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
    const store = mockStore({
      projects: {
        ...initialMockState,
      }
    });

    const { getByText } = renderProjectsListComponent(store);
    expect(getByText(/Test Project Title/)).toBeDefined();
  });
});