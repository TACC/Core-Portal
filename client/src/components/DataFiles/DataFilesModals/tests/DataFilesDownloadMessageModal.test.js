import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import DataFilesDownloadMessageModal from '../DataFilesDownloadMessageModal';

const mockStore = configureStore();
const initialMockState = {
  files: {
    modals: {
      downloadMessage: true
    }
  }
};

describe('DataFilesDownloadMessageModal', () => {
  it('renders the data files download message modal', () => {
    const store = mockStore(initialMockState);
    const { getAllByText } = renderComponent(
      <DataFilesDownloadMessageModal />,
      store
    );

    expect(
      getAllByText(/Folders must be compressed before download/)
    ).toBeDefined();
  });
});
