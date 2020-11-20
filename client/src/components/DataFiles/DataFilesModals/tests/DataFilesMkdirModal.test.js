import React from 'react';
import { createMemoryHistory } from 'history';
import DataFilesMkdirModal from '../DataFilesMkdirModal';
import configureStore from 'redux-mock-store';
import DataFilesMkdirModalFixture from './DataFilesMkdirModal.fixture';
import systemsFixture from '../../fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';
import { fireEvent, wait } from '@testing-library/react';

const mockStore = configureStore();

const initialMockState = {
  files: DataFilesMkdirModalFixture,
  systems: systemsFixture,
  pushKeys: {
    modalProps: {
      pushKeys: false
    }
  }
};

describe('DataFilesCopyModal', () => {
  it('renders the mkdir modal', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getAllByText, getAllByRole } = renderComponent(
      <DataFilesMkdirModal />,
      store,
      history
    );
    // Check the description
    expect(getAllByText(/Enter a name for the new folder:/)).toBeDefined();
    expect(getAllByRole('button')).toBeDefined();
  });

  it('Dispatches action on valid input', async () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getByText, getByRole } = renderComponent(
      <DataFilesMkdirModal />,
      store,
      history
    );
    // Check the description
    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc123' } });

    await wait(() => {
      const submitButton = getByText('Create Folder');
      fireEvent.click(submitButton);
    });

    expect(store.getActions()).toEqual([
      {
        type: 'DATA_FILES_MKDIR',
        payload: {
          api: 'tapis',
          scheme: 'private',
          system: 'test.system',
          path: '/',
          dirname: 'abc123',
          reloadCallback: expect.any(Function)
        }
      }
    ]);
  });

  it('Error message on invalid input', async () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getByText, getByRole } = renderComponent(
      <DataFilesMkdirModal />,
      store,
      history
    );
    // Check the description
    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc123?' } });

    await wait(() => {
      const submitButton = getByText('Create Folder');
      fireEvent.click(submitButton);
    });

    expect(
      getByText(
        'Please enter a valid directory name (accepted characters are A-Z a-z 0-9 - _ .)'
      )
    ).toBeDefined();

    expect(store.getActions()).toEqual([]);
  });
});
