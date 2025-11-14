import React from 'react';
import { useQuery } from '@tanstack/react-query';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import DataFilesDownloadMessageModalFixture from './DataFilesDownloadMessageModal.fixture';
import DataFilesDownloadMessageModal from '../DataFilesDownloadMessageModal';
import { compressAppFixture } from './DataFilesToolbarAppsModals.fixture';
import { fireEvent, screen, waitFor, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

vi.mock('hooks/datafiles/mutations/toolbarAppUtils', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual, // keep `getDefaultAllocation`
    getAppUtil: vi.fn().mockResolvedValue({
      id: 'compress-express',
      version: '0.0.1',
      definition: {
        jobAttributes: {
          execSystemId: 'cloud.data',
        },
      },
      execSystems: [
        {
          host: 'cloud.data.tacc.utexas.edu',
        },
      ],
    }),
  };
});

const mockStore = configureStore();

describe('DataFilesDownloadMessageModal', () => {
  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders the data files download message modal', async () => {
    const foo = {};
    const store = mockStore({
      ...DataFilesDownloadMessageModalFixture,
      allocations: {
        portal_alloc: '',
        active: [],
      } /*TODO fix DataFilesDownloadMessageModalFixture fixture*/,
    });

    const { findAllByText } = renderComponent(
      <DataFilesDownloadMessageModal />,
      store
    );

    await waitFor(async () => {
      await screen.findByText('Download');
    });
  });

  it('allows direct file downloads when the file size is below 2 GB'),
    async () => {
      // Mock the dispatch action
      const mockDispatch = vi.fn();
      // Create a spy that watches for the dispatch call
      vi.spyOn(require('react-redux'), 'useDispatch').mockReturnValue(
        mockDispatch
      );

      renderComponent(
        <DataFilesDownloadMessageModal />,
        // Create the store
        mockStore({
          ...DataFilesDownloadMessageModalFixture,
          allocations: {
            /*TODO fix DataFilesDownloadMessageModalFixture fixture*/
            portal_alloc: '',
            active: [],
          },
          files: {
            ...DataFilesDownloadMessageModalFixture.files,
            selected: { FilesListing: [3] },
          },
        })
      );

      const compressButton = await screen.findByText('Compress');
      fireEvent.click(compressButton);

      // Click on the Compress button to try and download the folder
      fireEvent.click(getByText('Compress'));

      await waitFor(() => {
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
      });
    };

  it('toggles modal correctly'),
    async () => {
      // Mock the dispatch action
      const mockDispatch = vi.fn();
      // Create a spy that watches for the dispatch call
      vi.spyOn(require('react-redux'), 'useDispatch').mockReturnValue(
        mockDispatch
      );
      renderComponent(
        <DataFilesDownloadMessageModal />,
        mockStore({
          ...DataFilesDownloadMessageModalFixture,
          allocations: {
            /*TODO fix DataFilesDownloadMessageModalFixture fixture*/
            portal_alloc: '',
            active: [],
          },
        })
      );

      const closeButton = await screen.findByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        // Test for the dispatch call that would toggle this modal
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'DATA_FILES_TOGGLE_MODAL',
          payload: {
            operation: 'downloadMessage',
            props: {},
          },
        });
      });
    };
});
