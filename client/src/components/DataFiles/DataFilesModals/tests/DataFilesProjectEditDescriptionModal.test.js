import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import DataFilesProjectEditDescriptionModal from '../DataFilesProjectEditDescriptionModal';
import {
  projectsListingFixture,
  projectMetadataFixture
} from '../../../../redux/sagas/fixtures/projects.fixture';

const mockStore = configureStore();

const initialMockState = {
  files: {
    modals: {
      editproject: true
    }
  },
  users: {
    search: {
      users: []
    }
  },
  projects: {
    listing: {
      project: projectsListingFixture,
      loading: false,
      error: null
    },
    operation: {
      name: 'editDescription',
      loading: false,
      error: null,
      result: null
    },
    metadata: projectMetadataFixture
  },
  authenticatedUser: {
    user: {
      username: 'username',
      first_name: 'User',
      last_name: 'Name',
      email: 'user@name.com'
    }
  }
};

describe('DataFilesProjectEditDescriptionModal', () => {
  it('renders the edit project description and title modal', () => {
    const store = mockStore(initialMockState);
    const { getAllByText, getByDisplayValue } = renderComponent(
      <DataFilesProjectEditDescriptionModal />,
      store
    );
    expect(getAllByText(/Edit Descriptions/)).toBeDefined();
    expect(getAllByText(/Workspace Title/)).toBeDefined();
    expect(getByDisplayValue(projectMetadataFixture.title)).toBeDefined();
    expect(getAllByText(/Workspace Description/)).toBeDefined();
    expect(getAllByText(projectMetadataFixture.description)).toBeDefined();
    expect(getAllByText(/Update Changes/)).toBeDefined();
  });

  it('renders spinner when when updating', () => {
    const state = {
      ...initialMockState,
    };
    state.projects.operation = {
      name: 'editDescription',
      loading: true,
      error: null,
      result: null
    };
    const store = mockStore(state);
    const { getByTestId } = renderComponent(
      <DataFilesProjectEditDescriptionModal />,
      store
    );
    expect(getByTestId('loading-spinner'));
  });

  it('renders error when when updating error', () => {
    const state = {
      ...initialMockState,
    };
    state.projects.operation = {
      name: 'editDescription',
      loading: null,
      error: 'something went wrong',
      result: null
    };
    const store = mockStore(state);
    const { getByTestId } = renderComponent(
      <DataFilesProjectEditDescriptionModal />,
      store
    );
    expect(getByTestId('updating-error'));
  });
});
