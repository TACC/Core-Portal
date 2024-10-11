import React from 'react';
import {
  toHaveClass,
  toBeDisabled,
} from '@testing-library/jest-dom/dist/matchers';
import DataFilesToolbar, { ToolbarButton } from './DataFilesToolbar';
import configureStore from 'redux-mock-store';
import { createMemoryHistory } from 'history';
import renderComponent from 'utils/testing';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

const mockStore = configureStore();
expect.extend({ toHaveClass, toBeDisabled });
describe('ToolbarButton', () => {
  const store = mockStore({});
  it('renders button with correct text', () => {
    const { getByText, getByRole, getByTestId } = renderComponent(
      <ToolbarButton text="Rename" iconName="rename" onClick={() => {}} />,
      store,
      createMemoryHistory()
    );

    expect(getByText(/Rename/)).toBeDefined();
    expect(getByRole('button')).toBeDefined();
    expect(getByTestId('icon-before').classList).toContain('icon-rename');
  });
});

describe('DataFilesToolbar', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders necessary buttons', () => {
    const { getByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="tapis" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
          },
        },
        files: {
          params: {
            FilesListing: {
              path: '',
            },
          },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        listing: { selected: { FilesListing: [] } },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );

    expect(getByText(/Rename/)).toBeDefined();
    expect(getByText(/Move/)).toBeDefined();
    expect(getByText(/Copy/)).toBeDefined();
    expect(getByText(/Download/)).toBeDefined();
    expect(getByText(/Trash/)).toBeDefined();
  });

  it('does not render unnecessary buttons in Community Data', () => {
    const { getByText, queryByText } = renderComponent(
      <DataFilesToolbar scheme="community" api="tapis" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
          },
        },
        files: {
          params: {
            FilesListing: {
              path: '',
            },
          },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        listing: { selected: { FilesListing: [] } },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );

    expect(queryByText(/Rename/)).toBeFalsy();
    expect(queryByText(/Move/)).toBeFalsy();
    expect(getByText(/Copy/)).toBeDefined();
    expect(getByText(/Download/)).toBeDefined();
    expect(queryByText(/Trash/)).toBeFalsy();
  });

  it('does not render unnecessary buttons in Public Data', () => {
    const { getByText, queryByText } = renderComponent(
      <DataFilesToolbar scheme="public" api="tapis" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
          },
        },
        files: {
          params: {
            FilesListing: {
              path: '',
            },
          },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        listing: { selected: { FilesListing: [] } },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );

    expect(queryByText(/Rename/)).toBeFalsy();
    expect(queryByText(/Move/)).toBeFalsy();
    expect(getByText(/Copy/)).toBeDefined();
    expect(getByText(/Download/)).toBeDefined();
    expect(queryByText(/Trash/)).toBeFalsy();
  });

  it('does not render unnecessary buttons in Google Drive', () => {
    const { getByText, queryByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="googledrive" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
          },
        },
        files: {
          params: {
            FilesListing: {
              path: '',
            },
          },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        listing: { selected: { FilesListing: [] } },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );

    expect(queryByText(/Rename/)).toBeFalsy();
    expect(queryByText(/Move/)).toBeFalsy();
    expect(getByText(/Copy/)).toBeDefined();
    expect(queryByText(/Download/)).toBeFalsy();
    expect(queryByText(/Trash/)).toBeFalsy();
  });

  it('enables Empty button for files in .Trash', () => {
    const testFile = {
      name: 'test.txt',
      path: '/.Trash/test.txt',
      lastModified: '2020-08-01T00:00:00-05:00',
      type: 'file',
    };
    const { getByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="tapis" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
            trashPath: '.Trash',
          },
        },
        files: {
          params: {
            FilesListing: {
              system: 'frontera.home.username',
              path: 'home/username/.Trash',
              scheme: 'private',
            },
          },
          listing: { FilesListing: [testFile] },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );
    expect(getByText(/Empty/).closest('button')).not.toBeDisabled();
  });

  it('disables Empty button when .Trash is empty', () => {
    const { getByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="tapis" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
            trashPath: '.Trash',
          },
        },
        files: {
          params: {
            FilesListing: {
              system: 'frontera.home.username',
              path: 'home/username/.Trash',
              scheme: 'private',
            },
          },
          listing: { FilesListing: [] },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        //listing: {  } },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );
    expect(getByText(/Empty/).closest('button')).toBeDisabled();
  });

  // Test to prevent large file download through TAPIS
  it('prevents downloads of large files through TAPIS directly', () => {
    // Mock the alert function
    global.alert = vi.fn();
    // Create a test file whose size is greater than 2 GB
    const testFile = {
      name: 'test.txt',
      type: 'file',
      length: 3000000000,
      path: '/test.txt',
    };
    // Create the store
    const { getByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="tapis" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
            trashPath: '.Trash',
          },
        },
        files: {
          params: {
            FilesListing: {
              system: 'frontera.home.username',
              path: 'home/username',
              scheme: 'private',
            },
          },
          listing: { FilesListing: [testFile] },
          selected: { FilesListing: [0] },
          operationStatus: { trash: false },
        },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      })
    );
    // Click on the download button to try and download the file
    fireEvent.click(getByText('Download'));
    // Test for the alert message
    expect(global.alert).toHaveBeenCalledWith(
      'The data set that you are attempting to download is too large for a direct download. Direct downloads are supported for up to 2 gigabytes of data at a time. Alternative approaches for transferring large amounts of data are provided in the Large Data Transfer Methods section of the Data Transfer Guide (https://www.designsafe-ci.org/user-guide/managingdata/datatransfer/#globus).'
    );
  });

  // Test that allows downloads of files less than 2 GB
  it('allows direct file downloads when the file size is below 2 GB', () => {
    // Mock the dispatch action
    const mockDispatch = vi.fn();
    // Create a test file whose size is less than 2 GB
    const testFile = {
      name: 'test.txt',
      type: 'file',
      length: 1000000000,
      path: '/test.txt',
      id: 123,
    };
    // Create a spy that watches for the dispatch call
    vi.spyOn(require('react-redux'), 'useDispatch').mockReturnValue(
      mockDispatch
    );
    // Create the store
    const { getByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="tapis" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
            trashPath: '.Trash',
          },
        },
        files: {
          params: {
            FilesListing: {
              system: 'frontera.home.username',
              path: 'home/username',
              scheme: 'private',
            },
          },
          listing: { FilesListing: [testFile] },
          selected: { FilesListing: [0] },
          operationStatus: { trash: false },
        },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      })
    );
    // Click on the download button to try and download the file
    fireEvent.click(getByText('Download'));
    // Test for the dispatch call
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'DATA_FILES_DOWNLOAD',
      payload: {
        file: {
          id: 'undefined//test.txt',
          length: 1000000000,
          name: 'test.txt',
          path: '/test.txt',
          type: 'file',
        },
      },
    });
  });
});
