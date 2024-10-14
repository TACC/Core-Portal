import React from 'react';
import { createMemoryHistory } from 'history';
import DataFilesMakePublicModal from '../DataFilesMakePublicModal';
import configureStore from 'redux-mock-store';
import DataFilesMakePublicModalFixture from './DataFilesMakePublicModal.fixture';
import systemsFixture from '../../fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';
import { fireEvent, wait } from '@testing-library/react';

const mockStore = configureStore();

const initialMockState = {
  files: DataFilesMakePublicModalFixture,
  systems: systemsFixture,
  pushKeys: {
    modalProps: {
      pushKeys: false,
    },
  },
};

describe('DataFilesMakePublicModal', () => {
  it('renders the Make Public modal', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getAllByText, getAllByRole } = renderComponent(
      <DataFilesMakePublicModal />,
      store,
      history
    );
    // Check the description
    expect(getAllByText(/This action cannot be reversed/)).toBeDefined();
  });

  it('dispatches Make Public saga', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getByText } = renderComponent(
      <DataFilesMakePublicModal />,
      store,
      history
    );
    // Check the description
    fireEvent.click(getByText('Proceed'));
    expect(store.getActions()).toEqual([
      {
        type: 'DATA_FILES_MAKE_PUBLIC',
        payload: {
          system: 'test.system',
          path: '/testfile',
        },
      },
      {
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: {
          operation: 'makePublic',
          props: {},
        },
      },
    ]);
  });
});
