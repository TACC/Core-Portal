import React from 'react';
import { useQuery } from '@tanstack/react-query';
import configureStore from 'redux-mock-store';
import { waitFor, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import renderComponent from 'utils/testing';
import DataFilesToolbarAppsModalFixture, {
  extractAppFixture,
} from './DataFilesToolbarAppsModals.fixture';
import DataFilesExtractModal from '../DataFilesExtractModal';
import { getAppUtil } from 'hooks/datafiles/mutations/toolbarAppUtils';

vi.mock('@tanstack/react-query');
vi.mock('hooks/datafiles/mutations/toolbarAppUtils');
const mockStore = configureStore();

describe('DataFilesExtractModal', () => {
  beforeEach(async () => {
    getAppUtil.mockResolvedValue(extractAppFixture);
    useQuery.mockReturnValue({ data: extractAppFixture });

    const { result } = renderHook(() => useQuery('extract-app', getAppUtil));
    await waitFor(() => result.current.isSuccess);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('renders the extract modal', async () => {
    const store = mockStore(DataFilesToolbarAppsModalFixture);
    const { findByText } = renderComponent(<DataFilesExtractModal />, store);

    await waitFor(async () =>
      expect(findByText(/Extract Files/)).toBeDefined()
    );
  });

  it('disables form when submitting extract job', async () => {
    const store = mockStore({
      ...DataFilesToolbarAppsModalFixture,
      files: {
        ...DataFilesToolbarAppsModalFixture.files,
        operationStatus: { extract: { type: 'RUNNING' } },
      },
    });
    const { findByTestId } = renderComponent(<DataFilesExtractModal />, store);

    await waitFor(async () =>
      expect(findByTestId(/loading-spinner/)).toBeDefined()
    );
  });

  it('displays error state & message on error status', async () => {
    const store = mockStore({
      ...DataFilesToolbarAppsModalFixture,
      files: {
        ...DataFilesToolbarAppsModalFixture.files,
        operationStatus: { extract: { type: 'ERROR', message: 'Test error.' } },
      },
    });
    const { findByTestId, findByText } = renderComponent(
      <DataFilesExtractModal />,
      store
    );

    await waitFor(async () => {
      expect(findByTestId(/icon-before/)).toBeDefined();
      expect(findByText(/Test error./)).toBeDefined();
    });
  });
});
