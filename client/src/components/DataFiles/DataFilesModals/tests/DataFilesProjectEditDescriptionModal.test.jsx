import React from 'react';
import configureStore from 'redux-mock-store';
import { createMemoryHistory } from 'history';
import renderComponent from 'utils/testing';
import { fireEvent, waitFor, screen } from '@testing-library/react';
import DataFilesProjectEditDescriptionModal from '../DataFilesProjectEditDescriptionModal';
import {
  projectsListingFixture,
  projectMetadataFixture,
} from '../../../../redux/sagas/fixtures/projects.fixture';

const mockStore = configureStore();

const initialMockState = {
  files: {
    modals: {
      editproject: true,
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

  it('renders spinner during updating', () => {
    const state = {
      ...initialMockState,
    };
    state.projects.operation = {
      name: 'titleDescription',
      loading: true,
      error: null,
      result: null,
    };
    const store = mockStore(state);
    const { getByTestId } = renderComponent(
      <DataFilesProjectEditDescriptionModal />,
      store
    );
    expect(getByTestId('loading-spinner')).toBeDefined();
  });

  it('renders error when updating error occurs', () => {
    const state = {
      ...initialMockState,
    };
    state.projects.operation = {
      name: 'titleDescription',
      loading: null,
      error: 'something went wrong',
      result: null,
    };
    const store = mockStore(state);
    const { getByTestId } = renderComponent(
      <DataFilesProjectEditDescriptionModal />,
      store
    );
    expect(getByTestId('updating-error')).toBeDefined();
  });

  it('disallows title input under 3 characters', async () => {
    const store = mockStore(initialMockState);
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const { getAllByText, getByRole } = renderComponent(
      <DataFilesProjectEditDescriptionModal />,
      store,
      history
    );

    const inputField = getByRole('textbox', { name: 'title' });
    const button = getByRole('button', { name: 'Update Changes' });
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
      <DataFilesProjectEditDescriptionModal />,
      store,
      history
    );
    const button = getByRole('button', { name: 'Update Changes' });
    const titleField = getByRole('textbox', { name: 'title' });
    const descriptionField = getByRole('textbox', { name: 'description' });

    fireEvent.change(titleField, {
      target: {
        value:
          'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient',
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
      getAllByText(/Description must be minimum 1000 characters/)
    );
  });
});
