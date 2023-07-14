import React from 'react';
import { createMemoryHistory } from 'history';
import DataFilesAddProjectModal from '../DataFilesAddProjectModal';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import { fireEvent, waitFor } from '@testing-library/react';
import {
  projectsListingFixture,
  projectMetadataFixture,
} from '../../../../redux/sagas/fixtures/projects.fixture';
import systemsFixture from '../../fixtures/DataFiles.systems.fixture';
const mockStore = configureStore();

const initialMockState = {
  files: {
    modals: {
      addproject: true,
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

describe('DataFilesAddProjectModal', () => {
  it('renders the add project modal', () => {
    const store = mockStore(initialMockState);
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const { getAllByText } = renderComponent(
      <DataFilesAddProjectModal />,
      store,
      history
    );

    // Check that the authenticated user appears as the default owner
    // for a new project
    expect(getAllByText(/User Name/)).toBeDefined();
  });

  it('disallows title input under 3 characters', async () => {
    const store = mockStore(initialMockState);
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const { getAllByText, getByRole } = renderComponent(
      <DataFilesAddProjectModal />,
      store,
      history
    );

    const inputField = getByRole('textbox', { name: '' });
    const button = getByRole('button', { name: 'Add Workspace' });
    fireEvent.change(inputField, {
      target: {
        value: 'a',
      },
    });
    fireEvent.click(button);

    await waitFor(() => getAllByText(/Title must be at least 3 characters/));
  });

  it('disallows title input over 150 characters', async () => {
    const store = mockStore(initialMockState);
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const { getAllByText, getByRole } = renderComponent(
      <DataFilesAddProjectModal />,
      store,
      history
    );

    const inputField = getByRole('textbox', { name: '' });
    const button = getByRole('button', { name: 'Add Workspace' });
    fireEvent.change(inputField, {
      target: {
        value:
          'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient.',
      },
    });
    fireEvent.click(button);

    await waitFor(() => getAllByText(/Title must be at most 150 characters/));
  });
});
