import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import systemsFixture from '../../DataFiles/fixtures/DataFiles.systems.fixture'
import filesFixture from '../fixtures/DataFiles.files.fixture';
import { projectsFixture, projectMetadataFixture } from '../../../redux/sagas/fixtures/projects.fixture';
import DataFilesProjectFileListing from './DataFilesProjectFileListing';

// Mock ResizeObserver
const {ResizeObserver} = window;

beforeEach(() => {
  delete window.ResizeObserver;
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

afterEach(() => {
  window.ResizeObserver = ResizeObserver;
  jest.restoreAllMocks();
});

// Mock Resize Detector
jest.mock('react-resize-detector', () => ({
  useResizeDetector: () => 
  {
    return {
      height: 10,
      ref: {
        current: {
          scrollHeight: 50
        }
      }
    }
  }
}));

const mockStore = configureStore();
const initialMockState = {
  projects: {
    ...projectsFixture,
    metadata: projectMetadataFixture
  },
  files: filesFixture,
  systems: systemsFixture,
  pushKeys: {
    modals: filesFixture.modals,
    modalProps: filesFixture.modalProps
  },
  authenticatedUser: {
    user: {
      email: 'user@username.com',
      first_name: 'Firstname',
      last_name: 'Lastname',
      username: 'username'
    }
  }
};

describe('DataFilesProjectFileListing', () => {
  it('shows uses the Read More component for long descriptions', () => {
    const store = mockStore(initialMockState);
    const { getByText } = renderComponent(
      <DataFilesProjectFileListing system="test.site.project.PROJECT-3" path="/" />,
      store
    );

    expect(getByText(/Read More/)).toBeDefined();
  });

  it('hides Edit Descriptions and Manage Team when privilege is needed and user is not owner', () => {
    initialMockState.authenticatedUser.user.username = 'member';
    initialMockState.systems.storage.configuration[5].privilegeRequired = true;
    const store = mockStore(initialMockState);
    const { queryByText } = renderComponent(
      <DataFilesProjectFileListing system="test.site.project.PROJECT-3" path="/" />,
      store
    )

    expect(queryByText(/Edit Descriptions/)).toBeNull();
    expect(queryByText(/Manage Team/)).toBeNull();
  });

  it('shows Edit Descriptions and Manage Team when privilege is needed and user is owner', () => {
    initialMockState.authenticatedUser.user.username = 'username';
    initialMockState.systems.storage.configuration[5].privilegeRequired = true;
    const store = mockStore(initialMockState);
    const { getByText } = renderComponent(
      <DataFilesProjectFileListing system="test.site.project.PROJECT-3" path="/" />,
      store
    )

    expect(getByText(/Edit Descriptions/)).toBeDefined();
    expect(getByText(/Manage Team/)).toBeDefined();
  });

  it('shows Edit Descriptions and Manage Team when privilege is not needed and user not owner', () => {
    initialMockState.authenticatedUser.user.username = 'member';
    initialMockState.systems.storage.configuration[5].privilegeRequired = false;
    const store = mockStore(initialMockState);
    const { getByText } = renderComponent(
      <DataFilesProjectFileListing system="test.site.project.PROJECT-3" path="/" />,
      store
    )

    expect(getByText(/Edit Descriptions/)).toBeDefined();
    expect(getByText(/Manage Team/)).toBeDefined();
  });

  it('shows Edit Descriptions and Manage Team when privilege is not needed and user is not owner', () => {
    initialMockState.authenticatedUser.user.username = 'member';
    initialMockState.systems.storage.configuration[5].privilegeRequired = false;
    const store = mockStore(initialMockState);
    const { getByText } = renderComponent(
      <DataFilesProjectFileListing system="test.site.project.PROJECT-3" path="/" />,
      store
    )

    expect(getByText(/Edit Descriptions/)).toBeDefined();
    expect(getByText(/Manage Team/)).toBeDefined();
  });
});
