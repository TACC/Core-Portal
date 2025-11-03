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

    const inputField = getByRole('textbox', { name: 'title' });
    const button = getByRole('button', { name: 'Add Workspace' });
    fireEvent.change(inputField, {
      target: {
        value: 'a',
      },
    });
    fireEvent.click(button);

    await waitFor(() => getAllByText(/Title must be at least 3 characters/));
  });

  it('disallows title input over 150 characters and description over 800 characters', async () => {
    const store = mockStore(initialMockState);
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const { getAllByText, getByRole } = renderComponent(
      <DataFilesAddProjectModal />,
      store,
      history
    );

    const titleField = getByRole('textbox', { name: 'title' });
    const descriptionField = getByRole('textbox', { name: 'description' });
    const button = getByRole('button', { name: 'Add Workspace' });

    fireEvent.change(titleField, {
      target: {
        value:
          'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient.',
      },
    });

    fireEvent.change(descriptionField, {
      target: {
        value:
          'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo \
            ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient \
            montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium \
            quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, \
            vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. \
            Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus \
            elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor \
            eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, \
            feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. \
            Aenean imperdiet. Etiam ultricies.',
      },
    });

    fireEvent.click(button);

    await waitFor(() => getAllByText(/Title must be at most 150 characters/));
    await waitFor(() =>
      getAllByText(/Description must be at most 800 characters/)
    );
  });
});
