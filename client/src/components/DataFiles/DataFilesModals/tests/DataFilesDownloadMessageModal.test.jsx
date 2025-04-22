import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import DataFilesDownloadMessageModalFixture from './DataFilesDownloadMessageModal.fixture';
import DataFilesDownloadMessageModal from '../DataFilesDownloadMessageModal';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

const mockStore = configureStore();

// Establish a boolean that checks for a folder among selectedFiles
let containsFolder = false;
// Create test files for all tests

describe('DataFilesDownloadMessageModal', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders the data files download message modal', () => {
    const store = mockStore(DataFilesDownloadMessageModalFixture);
    const { getAllByText } = renderComponent(
      <DataFilesDownloadMessageModal />,
      store
    );

    expect(
      getAllByText(
        /Folders and multiple files must be compressed before downloading./
      )
    ).toBeDefined();
  });

  // Test to prevent folder downloads
  it('checks for a folder among the selected files', async () => {
    // Mock the dispatch call
    const mockDispatch = vi.fn();
    // Create a spy that watches for the dispatch call
    vi.spyOn(require('react-redux'), 'useDispatch').mockReturnValue(
      mockDispatch
    );
    // Render the Download Message Modal
    const { getByText } = renderComponent(
      <DataFilesDownloadMessageModal />,
      // Create the store
      mockStore({
        ...DataFilesDownloadMessageModalFixture,
        files: {
          ...DataFilesDownloadMessageModalFixture.files,
          selected: { FilesListing: [4] },
        },
      })
    );
    // Click on the Compress button to try and download the folder
    fireEvent.click(getByText('Compress'));
    // Wait for the No Folders Modal
    await waitFor(() => screen.queryByText('No Folders'));
    // Assign the No Folders Modal to a variable
    const testModal = screen.queryByText('No Folders');
    // Test for the containsFolder boolean to be true
    expect(containsFolder).toBeTruthy;
    // Test for the Large Download Modal
    expect(testModal).toBeDefined();
    // Test for the dispatch call
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'largeDownload',
        props: {},
      },
    });
  });

  // Test to prevent the compression of multiple files if their total size is greater than 2 GB
  it('prevents the compression of multiple files that total more than 2 GB in size', async () => {
    // Mock the dispatch call
    const mockDispatch = vi.fn();
    // Create a spy that watches for the dispatch call
    vi.spyOn(require('react-redux'), 'useDispatch').mockReturnValue(
      mockDispatch
    );
    const { getByText } = renderComponent(
      <DataFilesDownloadMessageModal />,
      mockStore({
        ...DataFilesDownloadMessageModalFixture,
        files: {
          ...DataFilesDownloadMessageModalFixture.files,
          selected: { FilesListing: [1, 2] },
        },
      })
    );
    // Click on the Compress button to try and download the file
    fireEvent.click(getByText('Compress'));
    // Wait for the Large Download Modal
    await waitFor(() => screen.queryByText('Large Download'));
    // Assign the Large Download Modal to a variable
    const testModal = screen.queryByText('Large Download');
    // Test for the Large Download Modal
    expect(testModal).toBeDefined();
    // Test for the dispatch call
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'largeDownload',
        props: {},
      },
    });
  });

  // Test to allow the compression/download of one or more files totaling less than 2 GB
  it('allows direct file downloads when the file size is below 2 GB'),
    () => {
      // Mock the dispatch action
      const mockDispatch = vi.fn();
      // Create a spy that watches for the dispatch call
      vi.spyOn(require('react-redux'), 'useDispatch').mockReturnValue(
        mockDispatch
      );
      // Render the Download Message Modal
      const { getByText } = renderComponent(
        <DataFilesDownloadMessageModal />,
        // Create the store
        mockStore({
          ...DataFilesDownloadMessageModalFixture,
          files: {
            ...DataFilesDownloadMessageModalFixture.files,
            selected: { FilesListing: [3] },
          },
        })
      );
      // Click on the Compress button to try and download the folder
      fireEvent.click(getByText('Compress'));
      // Test for the dispatch call
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'DATA_FILES_COMPRESS',
        payload: {
          file: {
            name: 'tests.txt',
            type: 'file',
            length: testFileSize2,
            path: '/test3.txt',
            id: 234,
          },
        },
      });
    };

  // Test to toggle modals correctly
  it('toggles modals correctly'),
    () => {
      // Mock the dispatch action
      const mockDispatch = vi.fn();
      // Create a spy that watches for the dispatch call
      vi.spyOn(require('react-redux'), 'useDispatch').mockReturnValue(
        mockDispatch
      );
      const toggleDataFilesNoFoldersModal = () => {
        dispatch({
          type: 'DATA_FILES_TOGGLE_MODAL',
          payload: {
            operation: 'noFolders',
            props: {},
          },
        });
      };
      toggleDataFilesNoFoldersModal();
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: {
          operation: 'noFolders',
          props: {},
        },
      });
    };
});
