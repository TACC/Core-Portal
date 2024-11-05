import React from 'react';
import { createMemoryHistory } from 'history';
import DataFilesRenameModal from '../DataFilesRenameModal';
import configureStore from 'redux-mock-store';
import DataFilesRenameModalFixture from './DataFilesRenameModal.fixture';
import systemsFixture from '../../fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';
import { fireEvent, waitFor } from '@testing-library/react';

const mockStore = configureStore();

const initialMockState = {
  files: DataFilesRenameModalFixture,
  systems: systemsFixture,
  pushKeys: {
    modalProps: {
      pushKeys: false,
    },
  },
};

describe('DataFilesRenameModal', () => {
  it('renders the rename modal', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getAllByText, getAllByRole } = renderComponent(
      <DataFilesRenameModal />,
      store,
      history
    );
    // Check the description
    expect(
      getAllByText(/Enter a new name for this file\/folder:/)
    ).toBeDefined();
    expect(getAllByRole('button')).toBeDefined();
  });

  // Skip until we can use MSW to mock API responses.
  it.skip('Dispatches action on valid input', async () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getByText, getByRole } = renderComponent(
      <DataFilesRenameModal />,
      store,
      history
    );
    // Check the description
    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc123' } });

    await waitFor(() => {
      const submitButton = getByText('Rename');
      fireEvent.click(submitButton);
    });

    expect(store.getActions()).toEqual([
      {
        type: 'DATA_FILES_RENAME',
        payload: {
          selectedFile: {
            name: 'testfile',
            path: '/testfile',
            lastModified: '2020-07-01T10:12:36-05:00',
            length: 4096,
            permissions: 'ALL',
            format: 'folder',
            system: 'test.system',
            mimeType: 'text/directory',
            type: 'dir',
          },
          api: 'tapis',
          scheme: 'private',
          newName: 'abc123',
          reloadCallback: expect.any(Function),
        },
      },
      {
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: { props: {}, operation: 'rename' },
      },
    ]);
  });

  it('Error message on invalid input', async () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getByText, getByRole } = renderComponent(
      <DataFilesRenameModal />,
      store,
      history
    );
    // Check the description
    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc123?' } });

    await waitFor(() => {
      const submitButton = getByText('Rename');
      fireEvent.click(submitButton);
    });

    expect(
      getByText(
        'Please enter a valid file name (accepted characters are A-Z a-z 0-9 () - _ .)'
      )
    ).toBeDefined();

    expect(store.getActions()).toEqual([]);
  });
});
