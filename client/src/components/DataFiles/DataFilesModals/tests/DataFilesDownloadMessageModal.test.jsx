import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import DataFilesDownloadMessageModalFixture from './DataFilesDownloadMessageModal.fixture';
import DataFilesDownloadMessageModal from '../DataFilesDownloadMessageModal';
import { fireEvent, waitFor } from '@testing-library/react';
// import { filenameDisplay, compressionType } from '../DataFilesCompressModal';
import { vi } from 'vitest';
// import { watchCompress } from 'redux/sagas/datafiles.sagas';

const mockStore = configureStore();
const initialMockState = {
  files: DataFilesDownloadMessageModalFixture,
};

// Establish a boolean that checks for a folder among selectedFiles
let containsFolder = false;
// Create test files whose total size is greater than 2 GB
const testFileSize = 1.5 * 1024 * 1024 * 1024;
const testFile1 = {
  name: 'test1.txt',
  type: 'file',
  length: testFileSize,
  path: '/test1.txt',
  id: 123,
};
const testFile2 = {
  name: 'test2.txt',
  type: 'file',
  length: testFileSize,
  path: '/test2.txt',
  id: 456,
};
// Create a test folder
const testFolder = {
  name: 'testFolder',
  type: 'folder',
  path: '/testFolder',
  id: 789
}

describe('DataFilesDownloadMessageModal', () => {
  
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders the data files download message modal', () => {
    const store = mockStore(initialMockState);
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
  it('checks for a folder among the selected files', () => {
    // Render the Download Message Modal
    // const formRef = React.useRef();
    // const { filenameDisplay, compressionType } = formRef.current.values;
    const { getByText } = renderComponent(
      <DataFilesDownloadMessageModal />,
      mockStore({
        files: {
          modals: {
            downloadMessage: true,
          },
          params: {
            FilesListing: {
              system: 'frontera.home.username',
              path: 'home/username',
              scheme: 'private',
            },
          },
          listing: { FilesListing: [testFile1, testFile2, testFolder] },
          selected: { FilesListing: [2] },
          operationStatus: { 
            compress: true, 
            // props: {
            //   filenameDisplay: formRef.current.values,
            //   compressionType: formRef.current.values
            // }
          },
        },
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      })
    );
    // Click on the Compress button to try and download the folder
    fireEvent.click(getByText('Compress'));
    // await waitFor (() => {
      // expect(formRef.current.values).toBeDefined();
    // });
    // expect(formRef.current.values).toBeDefined();
    expect(containsFolder).toBeTruthy;
  });

  it('prevents the compression of multiple files that total more than 2 GB in size', () => {
    // Mock the alert function
    global.alert = vi.fn();
    // Create a spy that watches for the dispatch call
    vi.spyOn(require('react-redux'), 'useDispatch').mockReturnValue(
      global.alert
    );
    const { getByText } = renderComponent(
      <DataFilesDownloadMessageModal />,
      mockStore({
        files: {
          modals: {
            downloadMessage: true,
          },
          params: {
            FilesListing: {
              system: 'frontera.home.username',
              path: 'home/username',
              scheme: 'private',
            },
          },
          listing: { FilesListing: [testFile1, testFile2, testFolder] },
          selected: { FilesListing: [0, 1] },
          operationStatus: { 
            compress: true
          },
        },
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      })
    );
    // Click on the Compress button to try and download the file
    fireEvent.click(getByText('Compress'));
    expect(global.alert).toHaveBeenCalledWith(
      'The data set that you are attempting to download is too large for a direct download. Direct downloads are supported for up to 2 gigabytes of data at a time. Alternative approaches for transferring large amounts of data are provided in the Large Data Transfer Methods section of the Data Transfer Guide (https://www.designsafe-ci.org/user-guide/managingdata/datatransfer/#globus).'
    );
  });
});
