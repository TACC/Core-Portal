import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import DataFilesCompressModalFixture from './DataFilesCompressModal.fixture';
import DataFilesCompressModal from '../DataFilesCompressModal';

const mockStore = configureStore();

describe('DataFilesCompressModal', () => {
  it('renders the compress modal', () => {
    const store = mockStore(DataFilesCompressModalFixture);
    const { getAllByText } = renderComponent(<DataFilesCompressModal />, store);

    expect(getAllByText(/Compressed File Name/)).toBeDefined();
  });

  it('disables form when submitting compress job', () => {
    const store = mockStore({
      ...DataFilesCompressModalFixture,
      files: {
        ...DataFilesCompressModalFixture.files,
        operationStatus: { compress: { type: 'RUNNING' } },
      },
    });
    const { getByLabelText, getByText } = renderComponent(
      <DataFilesCompressModal />,
      store
    );

    const compressInputField = getByLabelText('Compressed File Name');
    const compressButton = getByText('Compress').closest('button');
    expect(compressInputField.toBeDisabled);
    expect(compressButton.toBeDisabled);
  });

  it('displays error state on error status', () => {
    const store = mockStore({
      ...DataFilesCompressModalFixture,
      files: {
        ...DataFilesCompressModalFixture.files,
        operationStatus: { compress: { type: 'ERROR' } },
      },
    });
    const { getByTestId } = renderComponent(<DataFilesCompressModal />, store);

    const compressErrorIcon = getByTestId('icon-before');
    expect(compressErrorIcon.toBeVisible);
  });
});
