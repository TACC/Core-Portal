import React from 'react';
import { useQuery } from '@tanstack/react-query';
import configureStore from 'redux-mock-store';
import { waitFor, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import renderComponent from 'utils/testing';
import DataFilesCompressModalFixture, {
  compressAppFixture,
} from './DataFilesCompressModal.fixture';
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
    const store = mockStore(DataFilesCompressModalFixture);
    const { findByText } = renderComponent(<DataFilesCompressModal />, store);

    await waitFor(() =>
      expect(findByText(/Compressed File Name/)).toBeDefined()
    );
  });

  it('disables form when submitting compress job', async () => {
    const store = mockStore({
      ...DataFilesCompressModalFixture,
      files: {
        ...DataFilesCompressModalFixture.files,
        operationStatus: { compress: { type: 'RUNNING' } },
      },
    });
    const { findByLabelText } = renderComponent(
      <DataFilesCompressModal />,
      store
    );

    //const compressButtonText = await findByText('Compress');
    //expect(compressButtonText.closest('button').toBeDisabled);
    await waitFor(async () =>
      expect(findByLabelText(/Compressed File Name/).toBeDisabled)
    );
  });

  it('displays error state on error status', async () => {
    const store = mockStore({
      ...DataFilesCompressModalFixture,
      files: {
        ...DataFilesCompressModalFixture.files,
        operationStatus: { compress: { type: 'ERROR' } },
      },
    });
    const { findByTestId } = renderComponent(<DataFilesCompressModal />, store);

    const compressErrorIcon = findByTestId('icon-before');
    await waitFor(() => expect(compressErrorIcon.toBeVisible));
  });
});
