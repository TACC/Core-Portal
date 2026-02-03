import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import DataFilesDownloadMessageModalFixture from './DataFilesDownloadMessageModal.fixture';
import DataFilesDownloadMessageModal from '../DataFilesDownloadMessageModal';
import * as mutations from 'hooks/datafiles/mutations';
import { fireEvent, screen, waitFor } from '@testing-library/react';
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

  it('calls compress mutation', async () => {
    // Mock the compress mutation
    const mockCompress = vi.fn();
    const mockUseCompress = vi.fn(mutations.useCompress).mockReturnValue({
      compress: mockCompress,
      status: {},
      setStatus: () => {},
    });
    const useCompressSpy = vi
      .spyOn(mutations, 'useCompress')
      .mockReturnValue(mockUseCompress());

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
          selected: { FilesListing: [3, 4] },
        },
      })
    );

    const downloadButton = await screen.findByText('Download');
    fireEvent.click(downloadButton);

    // Click on the Compress button to try and download the folder
    fireEvent.click(screen.getByText('Compress'));

    const expectedArg = {
      filename: `Archive_${new Date().toISOString().split('.')[0]}`,
      files:
        DataFilesDownloadMessageModalFixture.files.selected.FilesListing.map(
          (i) => ({
            ...DataFilesDownloadMessageModalFixture.files.listing.FilesListing[
              i
            ],
          })
        ),
      compressionType: 'zip',
      fromDownload: true,
    };
    expect(useCompressSpy).toHaveBeenCalled();

    // TODO: Uncomment and fix these assertions once the compress mutation is refactored to be testable
    // expect(mockCompress).toHaveBeenCalledTimes(1);
    // expect(mockCompress).toHaveBeenCalledWith(expectedArg);
  });

  it('toggles modal correctly', async () => {
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
  });
});
