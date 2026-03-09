import React from 'react';
import { useQuery } from '@tanstack/react-query';
import configureStore from 'redux-mock-store';
import { waitFor, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import renderComponent from 'utils/testing';
import DataFilesToolbarAppsModalFixture, {
  compressAppFixture,
} from './DataFilesToolbarAppsModals.fixture';
import DataFilesCompressModal from '../DataFilesCompressModal';
import { getAppUtil } from 'hooks/datafiles/mutations/toolbarAppUtils';

vi.mock('@tanstack/react-query');
vi.mock('hooks/datafiles/mutations/toolbarAppUtils');
const mockStore = configureStore();

describe('DataFilesCompressModal', () => {
  beforeEach(async () => {
    getAppUtil.mockResolvedValue(compressAppFixture);
    useQuery.mockReturnValue({ data: compressAppFixture });

    const { result } = renderHook(() => useQuery('compress-app', getAppUtil));
    await waitFor(() => result.current.isSuccess);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('renders the compress modal', async () => {
    const store = mockStore(DataFilesToolbarAppsModalFixture);
    const { findByText } = renderComponent(<DataFilesCompressModal />, store);

    await waitFor(async () =>
      expect(findByText(/Compressed File Name/)).toBeDefined()
    );
  });

  it('disables form when submitting compress job', async () => {
    const store = mockStore({
      ...DataFilesToolbarAppsModalFixture,
      files: {
        ...DataFilesToolbarAppsModalFixture.files,
        operationStatus: { compress: { type: 'RUNNING' } },
      },
    });
    const { findByTestId } = renderComponent(<DataFilesCompressModal />, store);

    await waitFor(async () =>
      expect(findByTestId(/loading-spinner/)).toBeDefined()
    );
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

    //const compressErrorIcon = findByTestId('icon-before');
    await waitFor(async () => {
      expect(findByTestId(/icon-before/)).toBeDefined();
      expect(findByText(/Test error./)).toBeDefined();
    });
  });
});
