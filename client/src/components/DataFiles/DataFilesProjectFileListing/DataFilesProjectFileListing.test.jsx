import React from 'react';
import { vi } from 'vitest';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import filesFixture from '../fixtures/DataFiles.files.fixture';
import {
  projectsFixture,
  projectMetadataFixture,
} from '../../../redux/sagas/fixtures/projects.fixture';
import DataFilesProjectFileListing from './DataFilesProjectFileListing';

// Mock ResizeObserver
const { ResizeObserver } = window;

beforeEach(() => {
  delete window.ResizeObserver;
  window.ResizeObserver = vi.fn().mockImplementation(function () {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
  });
});

afterEach(() => {
  window.ResizeObserver = ResizeObserver;
  vi.restoreAllMocks();
});

// Mock Resize Detector
vi.mock('react-resize-detector', () => ({
  useResizeDetector: () => {
    return {
      height: 10,
      ref: {
        current: {
          scrollHeight: 50,
        },
      },
    };
  },
}));

const mockStore = configureStore();
const initialMockState = {
  projects: {
    ...projectsFixture,
    metadata: projectMetadataFixture,
  },
  files: filesFixture,
  systems: systemsFixture,
  pushKeys: {
    modals: filesFixture.modals,
    modalProps: filesFixture.modalProps,
  },
  authenticatedUser: {
    user: {
      email: 'user@username.com',
      first_name: 'Firstname',
      last_name: 'Lastname',
      username: 'username',
    },
  },
  workbench: {
    config: {
      trashPath: '.Trash',
    },
  },
};

describe('DataFilesProjectFileListing', () => {
  it('shows uses the Show More component for long descriptions', () => {
    const store = mockStore(initialMockState);
    const { getByText } = renderComponent(
      <DataFilesProjectFileListing
        system="test.site.project.PROJECT-3"
        path="/"
      />,
      store
    );

    expect(getByText(/Show More/)).toBeDefined();
  });

  it('hides Edit Workspace and Manage Team when readOnly is true or user is not owner', () => {
    initialMockState.authenticatedUser.user.username = 'member';
    initialMockState.systems.storage.configuration[5].readOnly = true;
    const store = mockStore(initialMockState);
    const { queryByText } = renderComponent(
      <DataFilesProjectFileListing
        system="test.site.project.PROJECT-3"
        path="/"
      />,
      store
    );

    expect(queryByText(/Edit Workspace/)).toBeNull();
    expect(queryByText(/Manage Team/)).toBeNull();
  });

  it('shows Edit Workspace and Manage Team when readOnly is false and user is owner', () => {
    initialMockState.authenticatedUser.user.username = 'username';
    initialMockState.systems.storage.configuration[5].readOnly = false;
    const store = mockStore(initialMockState);
    const { getByText } = renderComponent(
      <DataFilesProjectFileListing
        system="test.site.project.PROJECT-3"
        path="/"
      />,
      store
    );

    expect(getByText(/Edit Workspace/)).toBeDefined();
    expect(getByText(/Manage Team/)).toBeDefined();
  });

  it('hides Edit Workspace and Manage Team when readOnly is false and user is not owner', () => {
    initialMockState.authenticatedUser.user.username = 'member';
    initialMockState.systems.storage.configuration[5].readOnly = false;
    const store = mockStore(initialMockState);
    const { queryByText } = renderComponent(
      <DataFilesProjectFileListing
        system="test.site.project.PROJECT-3"
        path="/"
      />,
      store
    );

    expect(queryByText(/Edit Workspace/)).toBeNull();
    expect(queryByText(/Manage Team/)).toBeNull();
  });

  it('shows Edit Workspace and hides Manage Team when readOnly is true and user is owner', () => {
    initialMockState.authenticatedUser.user.username = 'username';
    initialMockState.systems.storage.configuration[5].readOnly = true;
    const store = mockStore(initialMockState);
    const { queryByText, getByText } = renderComponent(
      <DataFilesProjectFileListing
        system="test.site.project.PROJECT-3"
        path="/"
      />,
      store
    );

    expect(getByText(/Edit Workspace/)).toBeDefined();
    expect(queryByText(/Manage Team/)).toBeNull();
  });
});
