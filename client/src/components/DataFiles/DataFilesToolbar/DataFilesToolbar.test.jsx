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
import { fireEvent, screen, waitFor } from '@testing-library/react';
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
  it('prevents downloads of large files through TAPIS directly', async () => {
    // Create a test file whose size is greater than 2 GB
    const tooBigFileSize = 3 * 1024 * 1024 * 1024;
    const testFile = {
      name: 'test.txt',
      type: 'file',
      length: tooBigFileSize,
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
    // Wait for the Unavailable Download Modal
    await waitFor(() => screen.queryByText('Download Unavailable'));
    // Assign the Unavailable Download Modal to a variable
    const testModal = screen.queryByText('Download Unavailable');
    // Test for the Unavailable Download Modal
    expect(testModal).toBeDefined();
  });

  it('prevents downloads of folders through TAPIS directly', async () => {
    // Create a test folder
    const testFolder = {
      name: 'test',
      type: 'folder',
      length: 4000,
      path: '/test',
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
          listing: { FilesListing: [testFolder] },
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
    // Wait for the No Folders Modal
    await waitFor(() => screen.queryByText('No Folders'));
    // Assign the No Folders Modal to a variable
    const testModal = screen.queryByText('No Folders');
    // Test for the No Folders Modal
    expect(testModal).toBeDefined();
  });

  it('prompts compress for download of >1 files', async () => {
    const testFile = {
      name: 'test.txt',
      type: 'file',
      length: 1500,
      path: '/test.txt',
    };
    const testFile2 = {
      name: 'test2.txt',
      type: 'file',
      length: 1500,
      path: '/test2.txt',
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
          listing: { FilesListing: [testFile, testFile2] },
          selected: { FilesListing: [0, 1] },
          operationStatus: { trash: false },
        },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      })
    );
    // Click on the download button to try and download the file
    fireEvent.click(getByText('Download'));
    // Wait for the Download Message Modal
    await waitFor(() =>
      screen.queryByText(
        'Folders and multiple files must be compressed before downloading.'
      )
    );
    // Assign the Download Message Modal to a variable
    const testModalText = screen.queryByText(
      'Folders and multiple files must be compressed before downloading.'
    );
    // Test for the Large Download Modal
    expect(testModalText).toBeDefined();
  });

  // Test to prevent compress in public/community data
  it('prevents compress for download of >1 files in community data', async () => {
    const testFile = {
      name: 'test.txt',
      type: 'file',
      length: 1500,
      path: '/test.txt',
    };
    const testFile2 = {
      name: 'test2.txt',
      type: 'file',
      length: 1500,
      path: '/test2.txt',
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
              system: 'test',
              path: 'test',
              scheme: 'community',
            },
          },
          listing: { FilesListing: [testFile, testFile2] },
          selected: { FilesListing: [0, 1] },
          operationStatus: { trash: false },
        },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      })
    );
    // Click on the download button to try and download the file
    fireEvent.click(getByText('Download'));
    // Wait for the Large Download Modal
    await waitFor(() => screen.queryByText('Download Unavailable'));
    // Assign the Large Download Modal to a variable
    const testModalText = screen.queryByText(
      'Compression is not available in this data system. It may be faster for files to be transferred to your My Data directory and download them there, but if they are larger than 2GB use Globus below.'
    );
    // Test for the Large Download Modal
    expect(testModalText).toBeDefined();
  });

  // Test that allows downloads of files less than 2 GB
  it('allows direct file downloads when the file size is below 2 GB', () => {
    // Mock the dispatch action
    const mockDispatch = vi.fn();
    // Create a test file whose size is less than 2 GB
    const testFileSize = 1 * 1024 * 1024 * 1024;
    const testFile = {
      name: 'test.txt',
      type: 'file',
      length: testFileSize,
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
          length: testFileSize,
          name: 'test.txt',
          path: '/test.txt',
          type: 'file',
        },
      },
    });
  });
  it('disables compress and extract when allocation is unavailable', () => {
    const { queryByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="tapis" />,
      mockStore({
        allocations: { portal_alloc: undefined, active: [] },
        workbench: {
          config: {
            extractApp: { id: 'extract', version: '0.0.3' },
            compressApp: { id: 'compress', version: '0.0.4' },
          },
        },
        files: {
          params: {
            FilesListing: {
              system: 'frontera.home.username',
              path: 'home/username/hello.zip',
              scheme: 'private',
            },
          },
          listing: { FilesListing: [] },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );
    expect(queryByText(/compress/)).toBeFalsy();
    expect(queryByText(/extract/)).toBeFalsy();
  });
  it('enables compress and extract when allocation is available', () => {
    const { queryByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="tapis" />,
      mockStore({
        allocations: { portal_alloc: undefined, active: ['foo'] },
        workbench: {
          config: {
            extractApp: { id: 'extract', version: '0.0.3' },
            compressApp: { id: 'compress', version: '0.0.4' },
          },
        },
        files: {
          params: {
            FilesListing: {
              system: 'frontera.home.username',
              path: 'home/username/hello.zip',
              scheme: 'private',
            },
          },
          listing: { FilesListing: [] },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );
    expect(queryByText(/compress/)).toBeDefined();
    expect(queryByText(/extract/)).toBeDefined();
  });
});
