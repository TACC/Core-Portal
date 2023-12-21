import renderComponent from 'utils/testing';
import React from 'react';
import configureStore from 'redux-mock-store';
import DataFilesPreviewModal from '../DataFilesPreviewModal';
import { initialFilesState } from '../../../../redux/reducers/datafiles.reducers';

const files = {
  ...initialFilesState,
  modals: { ...initialFilesState.modals, preview: true },
  modalProps: {
    preview: {
      api: 'tapis',
      scheme: 'projects',
      system: 'test.site.project.PROJECT-3',
      path: 'something/test.txt',
      href: 'href',
      name: 'test.txt',
      length: 1234,
    },
  },
};

const mockStore = configureStore();

describe('Data Files Preview Modal', () => {
  it('should show the appropriate preview body for text files', () => {
    const store = mockStore({
      files: {
        ...files,
        preview: {
          href: null,
          content: 'abcdef',
          error: null,
          isLoading: false,
        },
      },
    });
    const { getByText } = renderComponent(<DataFilesPreviewModal />, store);

    expect(getByText(/File Preview:/)).toBeDefined();
    expect(getByText(/test\.txt/)).toBeDefined();
    expect(getByText(/abcdef/)).toBeDefined();
  });
  it('should show a loading spinner while fetching data', () => {
    const store = mockStore({
      files,
    });
    const { getByTestId, getByText } = renderComponent(
      <DataFilesPreviewModal />,
      store
    );
    expect(getByText(/File Preview:/)).toBeDefined();
    expect(getByText(/test\.txt/)).toBeDefined();
    expect(getByTestId('loading-spinner')).toBeDefined();
  });
  it('should show errors', () => {
    const store = mockStore({
      files: {
        ...files,
        preview: {
          content: null,
          href: null,
          error: 'Unable to show preview.',
          isLoading: false,
        },
      },
    });
    const { getByText } = renderComponent(<DataFilesPreviewModal />, store);
    expect(getByText(/File Preview:/)).toBeDefined();
    expect(getByText(/test\.txt/)).toBeDefined();
    expect(getByText('Unable to show preview.')).toBeDefined();
    expect(getByText(/Download File/)).toBeDefined();
  });
});
