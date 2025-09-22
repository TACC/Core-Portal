import React from 'react';
import { useQuery } from '@tanstack/react-query';
import configureStore from 'redux-mock-store';
import { screen, waitFor, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import renderComponent from 'utils/testing';
import DataFilesToolbarAppsModalFixture, {
  compressAppFixture,
} from './DataFilesToolbarAppsModals.fixture';
import DataFilesCompressModal from '../DataFilesCompressModal';
import {
  getAllocationForToolbarAction,
  getAppUtil,
} from 'hooks/datafiles/mutations/toolbarAppUtils';

vi.mock('@tanstack/react-query');
vi.mock('hooks/datafiles/mutations/toolbarAppUtils', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual, // keep `getDefaultAllocation`
    getAppUtil: vi.fn().mockResolvedValue(compressAppFixture)
  };
});

const mockStore = configureStore();

describe('DataFilesCompressModal', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
  });

  it('renders the compress modal', async () => {
    const store = mockStore(DataFilesToolbarAppsModalFixture);
    const { getByText } = renderComponent(<DataFilesCompressModal />, store);

    //expect(findByText('Compressed File Name')).toBeDefined();
    await waitFor(async () => {
      await screen.findByText('Compressed File Name')
    });
  });

  /*it('disables form when submitting compress job', async () => {
    const store = mockStore({
      ...DataFilesToolbarAppsModalFixture,
      files: {
        ...DataFilesToolbarAppsModalFixture.files,
        operationStatus: { compress: { type: 'RUNNING' } },
      },
    });
    const { findByTestId } = renderComponent(<DataFilesCompressModal />, store);

    await waitFor(async () =>
      expect(findByTestId('loading-spinner')).toBeInTheDocument()
    );
  });

  it('disables form and shows message when compress job submits successfully', async () => {
    const store = mockStore({
      ...DataFilesToolbarAppsModalFixture,
      files: {
        ...DataFilesToolbarAppsModalFixture.files,
        operationStatus: { compress: { type: 'SUCCESS' } },
      },
    });
    renderComponent(<DataFilesCompressModal />, store);

    const compressButtonText = await screen.findByText('Compress');
    const compressButton = compressButtonText.closest('button');

    expect(compressButton).toBeDisabled();

  });

  it('displays error state & correct message', async () => {
    const store = mockStore({
      ...DataFilesToolbarAppsModalFixture,
      files: {
        ...DataFilesToolbarAppsModalFixture.files,
        operationStatus: {
          compress: { type: 'ERROR', message: 'Test error.' },
        },
      },
    });
    const { findByTestId, findByText } = renderComponent(
      <DataFilesCompressModal />,
      store
    );

    await waitFor(async () => {
      expect(findByTestId(/icon-before/)).toBeInTheDocument();
      expect(findByText(/Test error./)).toBeInTheDocument();
    });
  });*/
});
