import React from 'react';
import { vi } from 'vitest';
import DataFilesManageProjectModal from '../DataFilesManageProjectModal';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import {
  projectsListingFixture,
  projectMetadataFixture,
} from '../../../../redux/sagas/fixtures/projects.fixture';
import systemsFixture from '../../fixtures/DataFiles.systems.fixture';

vi.mock('cross-fetch');
const mockStore = configureStore();

const initialMockState = {
  files: {
    modals: {
      manageproject: true,
    },
  },
  users: {
    search: {
      users: [],
    },
  },
  projects: {
    listing: {
      project: projectsListingFixture,
      loading: false,
      error: null,
    },
    operation: {
      name: '',
      loading: false,
      error: null,
      result: null,
    },
    metadata: projectMetadataFixture,
  },
  authenticatedUser: {
    user: {
      username: 'username',
      first_name: 'User',
      last_name: 'Name',
      email: 'user@name.com',
    },
  },
  systems: systemsFixture,
};

describe('DataFilesManageProjectModal', () => {
  it('renders the manage project modal', () => {
    const store = mockStore(initialMockState);
    const { getAllByText, debug } = renderComponent(
      <DataFilesManageProjectModal />,
      store
    );

    // Check that the authenticated user sees the Change Ownership option
    expect(getAllByText(/Change Ownership/)).toBeDefined();
  });
});
